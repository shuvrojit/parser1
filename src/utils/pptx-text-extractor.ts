import { PPTXDocument, PPTXSlide } from '../types/pptx-types';

/**
 * PPTX Text Extractor
 * Utility for extracting text from PPTX documents
 */
export class PPTXTextExtractor {
  private doc: PPTXDocument;

  constructor(doc: PPTXDocument) {
    this.doc = doc;
  }

  /**
   * Extract all text from the presentation
   */
  extractText(): string {
    const lines: string[] = [];

    for (const slide of this.doc.slides) {
      const slideText = this.extractTextFromSlide(slide);
      if (slideText) {
        lines.push(slideText);
        lines.push(''); // Empty line between slides
      }
    }

    return lines.join('\n').trim();
  }

  /**
   * Extract text from a single slide
   */
  extractTextFromSlide(slide: PPTXSlide): string {
    const lines: string[] = [];

    // Add slide number
    lines.push(`--- Slide ${slide.slideNumber} ---`);

    // Add title if available
    if (slide.title) {
      lines.push(slide.title);
      lines.push('');
    }

    // Add all text content
    for (const text of slide.text) {
      if (text !== slide.title) { // Avoid duplicating title
        lines.push(text);
      }
    }

    // Add notes if available
    if (slide.notes) {
      lines.push('');
      lines.push('Notes:');
      lines.push(slide.notes);
    }

    return lines.join('\n');
  }

  /**
   * Extract text from specific slides
   */
  extractTextFromSlides(slideNumbers: number[]): string {
    const lines: string[] = [];

    for (const slideNumber of slideNumbers) {
      const slide = this.doc.slides.find(s => s.slideNumber === slideNumber);
      if (slide) {
        const slideText = this.extractTextFromSlide(slide);
        if (slideText) {
          lines.push(slideText);
          lines.push(''); // Empty line between slides
        }
      }
    }

    return lines.join('\n').trim();
  }

  /**
   * Get all text as an array of slide texts
   */
  extractTextArray(): string[] {
    return this.doc.slides.map(slide => {
      return slide.text.join(' ');
    });
  }
}
