import { PDFLexer } from './lexer';
import { PDFObjectParser } from './object-parser';
import {
  PDFDocument,
  PDFXRefEntry,
  PDFTrailer,
  PDFIndirectObject,
  PDFDictionary,
  PDFNumber,
  PDFArray,
  PDFIndirectReference,
} from '../types/pdf-types';

/**
 * Main PDF Document Parser
 */
export class PDFParser {
  private data: Uint8Array;
  private lexer: PDFLexer;
  private objectParser: PDFObjectParser;

  constructor(data: Uint8Array) {
    this.data = data;
    this.lexer = new PDFLexer(data);
    this.objectParser = new PDFObjectParser(this.lexer);
  }

  /**
   * Parse the PDF document
   */
  parse(): PDFDocument {
    // Parse PDF version
    const version = this.parseVersion();

    // Find and parse the cross-reference table and trailer
    const xrefPos = this.findXRefPosition();
    this.lexer.setPosition(xrefPos);

    const xrefTable = this.parseXRefTable();
    const trailer = this.parseTrailer();

    // Parse all indirect objects
    const objects = this.parseAllObjects(xrefTable);

    return {
      version,
      objects,
      trailer,
      xrefTable,
    };
  }

  /**
   * Parse PDF version from header
   */
  private parseVersion(): string {
    this.lexer.setPosition(0);
    
    if (!this.lexer.match('%PDF-')) {
      throw new Error('Invalid PDF header');
    }

    this.lexer.consume('%PDF-');
    
    const versionBytes = this.lexer.readWhile(ch => 
      (ch >= 48 && ch <= 57) || ch === 46 // digits or '.'
    );

    return new TextDecoder('latin1').decode(versionBytes);
  }

  /**
   * Find the position of the xref table
   */
  private findXRefPosition(): number {
    // Search for 'startxref' from the end of the file
    const searchStart = Math.max(0, this.data.length - 1024);
    this.lexer.setPosition(searchStart);

    const startxrefPos = this.lexer.findSequence('startxref');
    if (startxrefPos === -1) {
      throw new Error('Could not find startxref');
    }

    this.lexer.setPosition(startxrefPos);
    this.lexer.consume('startxref');
    this.lexer.skipWhitespace();

    // Read the xref position
    const xrefPos = this.objectParser.parseObject();
    if (!xrefPos || xrefPos.type !== 'number') {
      throw new Error('Invalid xref position');
    }

    return xrefPos.value;
  }

  /**
   * Parse the cross-reference table
   */
  private parseXRefTable(): Map<number, PDFXRefEntry> {
    this.lexer.skipWhitespace();
    
    if (!this.lexer.match('xref')) {
      throw new Error('Expected xref table');
    }
    this.lexer.consume('xref');

    const xrefTable = new Map<number, PDFXRefEntry>();

    while (!this.lexer.isEOF()) {
      this.lexer.skipWhitespace();
      
      // Check if we've reached the trailer
      if (this.lexer.match('trailer')) {
        break;
      }

      // Parse subsection header (start_obj_num count)
      const startObj = this.objectParser.parseObject();
      if (!startObj || startObj.type !== 'number') {
        break;
      }

      this.lexer.skipWhitespace();
      
      const count = this.objectParser.parseObject();
      if (!count || count.type !== 'number') {
        break;
      }

      // Parse entries
      for (let i = 0; i < count.value; i++) {
        this.lexer.skipWhitespace();
        
        const offset = this.objectParser.parseObject() as PDFNumber;
        this.lexer.skipWhitespace();
        
        const generation = this.objectParser.parseObject() as PDFNumber;
        this.lexer.skipWhitespace();
        
        const flag = String.fromCharCode(this.lexer.read());
        
        xrefTable.set(startObj.value + i, {
          offset: offset.value,
          generation: generation.value,
          inUse: flag === 'n',
        });
      }
    }

    return xrefTable;
  }

  /**
   * Parse the trailer dictionary
   */
  private parseTrailer(): PDFTrailer {
    this.lexer.skipWhitespace();
    
    if (!this.lexer.match('trailer')) {
      throw new Error('Expected trailer');
    }
    this.lexer.consume('trailer');

    this.lexer.skipWhitespace();
    
    const trailerDict = this.objectParser.parseObject();
    if (!trailerDict || trailerDict.type !== 'dictionary') {
      throw new Error('Invalid trailer dictionary');
    }

    const dict = trailerDict as PDFDictionary;
    const entries = dict.entries;

    const trailer: PDFTrailer = {
      size: (entries.get('Size') as PDFNumber)?.value || 0,
    };

    if (entries.has('Root')) {
      trailer.root = entries.get('Root') as PDFIndirectReference;
    }

    if (entries.has('Info')) {
      trailer.info = entries.get('Info') as PDFIndirectReference;
    }

    if (entries.has('ID')) {
      trailer.id = entries.get('ID') as PDFArray;
    }

    if (entries.has('Prev')) {
      trailer.prev = (entries.get('Prev') as PDFNumber)?.value;
    }

    return trailer;
  }

  /**
   * Parse all indirect objects using the xref table
   */
  private parseAllObjects(xrefTable: Map<number, PDFXRefEntry>): Map<string, PDFIndirectObject> {
    const objects = new Map<string, PDFIndirectObject>();

    for (const [objNum, entry] of xrefTable) {
      if (!entry.inUse) {
        continue;
      }

      try {
        this.lexer.setPosition(entry.offset);
        const indirectObj = this.objectParser.parseIndirectObject();
        
        if (indirectObj) {
          const key = `${indirectObj.objectNumber}_${indirectObj.generation}`;
          objects.set(key, indirectObj);
        }
      } catch (e) {
        // Skip objects that fail to parse
        console.warn(`Failed to parse object ${objNum}:`, e);
      }
    }

    return objects;
  }

  /**
   * Get an object by reference
   */
  static getObjectByReference(
    doc: PDFDocument,
    ref: PDFIndirectReference
  ): PDFIndirectObject | undefined {
    const key = `${ref.objectNumber}_${ref.generation}`;
    return doc.objects.get(key);
  }
}
