import {
  PDFDocument,
  PDFObject,
  PDFDictionary,
  PDFArray,
  PDFString,
  PDFName,
  PDFStream,
  PDFIndirectReference,
} from '../types/pdf-types';
import { PDFParser } from '../parser/pdf-parser';

/**
 * Extract text content from a PDF document
 */
export class PDFTextExtractor {
  private doc: PDFDocument;

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  /**
   * Extract all text from the document
   */
  extractText(): string {
    let text = '';

    // Get the catalog (root)
    if (!this.doc.trailer.root) {
      return text;
    }

    const catalog = PDFParser.getObjectByReference(this.doc, this.doc.trailer.root);
    if (!catalog || catalog.object.type !== 'dictionary') {
      return text;
    }

    // Get the Pages dictionary
    const pagesRef = (catalog.object as PDFDictionary).entries.get('Pages');
    if (!pagesRef || pagesRef.type !== 'reference') {
      return text;
    }

    const pages = PDFParser.getObjectByReference(this.doc, pagesRef);
    if (!pages || pages.object.type !== 'dictionary') {
      return text;
    }

    // Get all page objects
    const pageObjects = this.getAllPages(pages.object as PDFDictionary);

    // Extract text from each page
    for (const pageObj of pageObjects) {
      text += this.extractTextFromPage(pageObj) + '\n';
    }

    return text;
  }

  /**
   * Get all page objects from the page tree
   */
  private getAllPages(pagesDict: PDFDictionary): PDFDictionary[] {
    const pages: PDFDictionary[] = [];
    const kids = pagesDict.entries.get('Kids');

    if (!kids || kids.type !== 'array') {
      return pages;
    }

    for (const kid of (kids as PDFArray).items) {
      if (kid.type !== 'reference') {
        continue;
      }

      const kidObj = PDFParser.getObjectByReference(this.doc, kid);
      if (!kidObj || kidObj.object.type !== 'dictionary') {
        continue;
      }

      const kidDict = kidObj.object as PDFDictionary;
      const type = kidDict.entries.get('Type');

      if (type && type.type === 'name') {
        const typeName = (type as PDFName).value;
        
        if (typeName === 'Page') {
          pages.push(kidDict);
        } else if (typeName === 'Pages') {
          // Recursively get pages
          pages.push(...this.getAllPages(kidDict));
        }
      }
    }

    return pages;
  }

  /**
   * Extract text from a single page
   */
  private extractTextFromPage(page: PDFDictionary): string {
    let text = '';

    // Get the Contents
    const contents = page.entries.get('Contents');
    if (!contents) {
      return text;
    }

    // Contents can be a stream or an array of streams
    const streams: PDFStream[] = [];

    if (contents.type === 'reference') {
      const streamObj = PDFParser.getObjectByReference(this.doc, contents);
      if (streamObj && streamObj.object.type === 'stream') {
        streams.push(streamObj.object as PDFStream);
      }
    } else if (contents.type === 'stream') {
      streams.push(contents as PDFStream);
    } else if (contents.type === 'array') {
      for (const item of (contents as PDFArray).items) {
        if (item.type === 'reference') {
          const streamObj = PDFParser.getObjectByReference(this.doc, item);
          if (streamObj && streamObj.object.type === 'stream') {
            streams.push(streamObj.object as PDFStream);
          }
        }
      }
    }

    // Extract text from each content stream
    for (const stream of streams) {
      text += this.extractTextFromStream(stream);
    }

    return text;
  }

  /**
   * Extract text from a content stream
   */
  private extractTextFromStream(stream: PDFStream): string {
    const content = new TextDecoder('latin1').decode(stream.data);
    let text = '';

    // Simple text extraction - look for text showing operators
    // Tj - show a text string
    // TJ - show text strings with individual glyph positioning
    // ' - move to next line and show text
    // " - set word and character spacing, move to next line, and show text

    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;

    // Extract from Tj operators
    let match;
    while ((match = tjRegex.exec(content)) !== null) {
      text += this.decodeTextString(match[1]) + ' ';
    }

    // Extract from TJ operators
    while ((match = tjArrayRegex.exec(content)) !== null) {
      const arrayContent = match[1];
      const stringRegex = /\(([^)]*)\)/g;
      let stringMatch;
      while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
        text += this.decodeTextString(stringMatch[1]) + ' ';
      }
    }

    return text;
  }

  /**
   * Decode a text string (handle escape sequences)
   */
  private decodeTextString(str: string): string {
    let result = '';
    let i = 0;

    while (i < str.length) {
      if (str[i] === '\\') {
        i++;
        if (i < str.length) {
          switch (str[i]) {
            case 'n': result += '\n'; break;
            case 'r': result += '\r'; break;
            case 't': result += '\t'; break;
            case 'b': result += '\b'; break;
            case 'f': result += '\f'; break;
            case '(': result += '('; break;
            case ')': result += ')'; break;
            case '\\': result += '\\'; break;
            default:
              // Octal
              if (str[i] >= '0' && str[i] <= '7') {
                let octal = str[i];
                i++;
                if (i < str.length && str[i] >= '0' && str[i] <= '7') {
                  octal += str[i];
                  i++;
                  if (i < str.length && str[i] >= '0' && str[i] <= '7') {
                    octal += str[i];
                  } else {
                    i--;
                  }
                } else {
                  i--;
                }
                result += String.fromCharCode(parseInt(octal, 8));
              } else {
                result += str[i];
              }
          }
        }
      } else {
        result += str[i];
      }
      i++;
    }

    return result;
  }
}
