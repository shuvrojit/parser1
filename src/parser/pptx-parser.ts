import { ZIPParser } from './zip-parser';
import { XMLParser } from './xml-parser';
import { PPTXDocument, PPTXSlide, PPTXMetadata, XMLNode } from '../types/pptx-types';

/**
 * PPTX (PowerPoint) Parser
 * Parses PPTX files from scratch without external dependencies
 */
export class PPTXParser {
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Parse PPTX file
   */
  parse(): PPTXDocument {
    // Parse ZIP archive
    const zipParser = new ZIPParser(this.data);
    const entries = zipParser.parse();

    // Extract metadata
    const metadata = this.parseMetadata(entries);

    // Parse slides
    const slides = this.parseSlides(entries);

    return {
      metadata,
      slides,
      slideCount: slides.length
    };
  }

  /**
   * Parse presentation metadata
   */
  private parseMetadata(entries: Map<string, any>): PPTXMetadata {
    const metadata: PPTXMetadata = {};

    // Parse core properties
    const corePropsEntry = entries.get('docProps/core.xml');
    if (corePropsEntry) {
      try {
        const xmlContent = new TextDecoder('utf-8').decode(corePropsEntry.data);
        const xmlParser = new XMLParser(xmlContent);
        const xmlDoc = xmlParser.parse();

        if (xmlDoc) {
          metadata.title = this.findTextContent(xmlDoc, 'dc:title');
          metadata.subject = this.findTextContent(xmlDoc, 'dc:subject');
          metadata.creator = this.findTextContent(xmlDoc, 'dc:creator');
          metadata.description = this.findTextContent(xmlDoc, 'dc:description');

          const created = this.findTextContent(xmlDoc, 'dcterms:created');
          if (created) {
            metadata.created = new Date(created);
          }

          const modified = this.findTextContent(xmlDoc, 'dcterms:modified');
          if (modified) {
            metadata.modified = new Date(modified);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return metadata;
  }

  /**
   * Parse all slides
   */
  private parseSlides(entries: Map<string, any>): PPTXSlide[] {
    const slides: PPTXSlide[] = [];

    // Get slide files from ppt/slides/
    const slideFiles: string[] = [];
    for (const fileName of entries.keys()) {
      if (fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')) {
        slideFiles.push(fileName);
      }
    }

    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });

    // Parse each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = parseInt(slideFile.match(/slide(\d+)\.xml/)?.[1] || '0');
      
      try {
        const slide = this.parseSlide(entries, slideFile, slideNumber);
        slides.push(slide);
      } catch (e) {
        // Skip slides that fail to parse - they may be malformed or use unsupported features
        // Continue parsing remaining slides
      }
    }

    return slides;
  }

  /**
   * Parse a single slide
   */
  private parseSlide(entries: Map<string, any>, slideFile: string, slideNumber: number): PPTXSlide {
    const slideEntry = entries.get(slideFile);
    if (!slideEntry) {
      throw new Error(`Slide file not found: ${slideFile}`);
    }

    const xmlContent = new TextDecoder('utf-8').decode(slideEntry.data);
    const xmlParser = new XMLParser(xmlContent);
    const xmlDoc = xmlParser.parse();

    const text: string[] = [];
    let title: string | undefined;

    if (xmlDoc) {
      // Extract all text from the slide
      this.extractTextFromNode(xmlDoc, text);

      // Try to identify title (usually the first text placeholder)
      if (text.length > 0) {
        title = text[0];
      }
    }

    // Parse relationships
    const relationships = this.parseRelationships(entries, slideFile);

    // Parse notes if available
    const notesFile = slideFile.replace('slides/slide', 'notesSlides/notesSlide');
    let notes: string | undefined;
    if (entries.has(notesFile)) {
      notes = this.parseNotes(entries, notesFile);
    }

    return {
      slideNumber,
      title,
      text,
      notes,
      relationships
    };
  }

  /**
   * Extract text content from XML node recursively
   */
  private extractTextFromNode(node: XMLNode, textArray: string[]): void {
    if (node.type === 'text' && node.content && node.content.trim()) {
      textArray.push(node.content.trim());
    }

    if (node.children) {
      for (const child of node.children) {
        this.extractTextFromNode(child, textArray);
      }
    }
  }

  /**
   * Find text content by tag name
   */
  private findTextContent(node: XMLNode, tagName: string): string | undefined {
    if (node.name === tagName) {
      if (node.children && node.children.length > 0) {
        const textNode = node.children.find(n => n.type === 'text');
        if (textNode && textNode.content) {
          return textNode.content;
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        const result = this.findTextContent(child, tagName);
        if (result) {
          return result;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse slide relationships
   */
  private parseRelationships(entries: Map<string, any>, slideFile: string): Map<string, string> {
    const relationships = new Map<string, string>();
    
    // Relationship file is in _rels subfolder
    const relsFile = slideFile.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsEntry = entries.get(relsFile);
    
    if (relsEntry) {
      try {
        const xmlContent = new TextDecoder('utf-8').decode(relsEntry.data);
        const xmlParser = new XMLParser(xmlContent);
        const xmlDoc = xmlParser.parse();

        if (xmlDoc && xmlDoc.children) {
          for (const child of xmlDoc.children) {
            if (child.name === 'Relationship' && child.attributes) {
              const id = child.attributes.get('Id');
              const target = child.attributes.get('Target');
              if (id && target) {
                relationships.set(id, target);
              }
            }
          }
        }
      } catch (e) {
        // Ignore relationship parsing errors
      }
    }

    return relationships;
  }

  /**
   * Parse notes for a slide
   */
  private parseNotes(entries: Map<string, any>, notesFile: string): string | undefined {
    const notesEntry = entries.get(notesFile);
    if (!notesEntry) {
      return undefined;
    }

    try {
      const xmlContent = new TextDecoder('utf-8').decode(notesEntry.data);
      const xmlParser = new XMLParser(xmlContent);
      const xmlDoc = xmlParser.parse();

      const text: string[] = [];
      if (xmlDoc) {
        this.extractTextFromNode(xmlDoc, text);
      }

      return text.join(' ');
    } catch (e) {
      return undefined;
    }
  }
}
