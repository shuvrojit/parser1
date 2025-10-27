import { PDFLexer } from './lexer';
import {
  PDFObject,
  PDFNull,
  PDFBoolean,
  PDFNumber,
  PDFString,
  PDFName,
  PDFArray,
  PDFDictionary,
  PDFStream,
  PDFIndirectReference,
  PDFIndirectObject,
} from '../types/pdf-types';

/**
 * Parser for PDF objects
 */
export class PDFObjectParser {
  private lexer: PDFLexer;

  constructor(lexer: PDFLexer) {
    this.lexer = lexer;
  }

  /**
   * Parse any PDF object
   */
  parseObject(): PDFObject | null {
    this.lexer.skipWhitespace();
    
    if (this.lexer.isEOF()) {
      return null;
    }

    const ch = this.lexer.peek();

    // null
    if (this.lexer.match('null')) {
      this.lexer.consume('null');
      return { type: 'null' };
    }

    // boolean
    if (this.lexer.match('true')) {
      this.lexer.consume('true');
      return { type: 'boolean', value: true };
    }
    if (this.lexer.match('false')) {
      this.lexer.consume('false');
      return { type: 'boolean', value: false };
    }

    // numeric or indirect reference
    if (this.isDigit(ch) || ch === 43 || ch === 45 || ch === 46) { // digit, +, -, .
      return this.parseNumericOrReference();
    }

    // string
    if (ch === 40) { // '('
      return this.parseString();
    }

    // hex string
    if (ch === 60 && this.lexer.peek(1) !== 60) { // '<' but not '<<'
      return this.parseHexString();
    }

    // name
    if (ch === 47) { // '/'
      return this.parseName();
    }

    // array
    if (ch === 91) { // '['
      return this.parseArray();
    }

    // dictionary or stream
    if (ch === 60 && this.lexer.peek(1) === 60) { // '<<'
      return this.parseDictionaryOrStream();
    }

    throw new Error(`Unexpected character at position ${this.lexer.getPosition()}: ${String.fromCharCode(ch)}`);
  }

  /**
   * Parse number or indirect reference
   */
  private parseNumericOrReference(): PDFObject {
    const startPos = this.lexer.getPosition();
    const num1 = this.parseNumber();

    this.lexer.skipWhitespace();
    
    // Check if this is an indirect reference (num1 gen R)
    if (!this.lexer.isEOF() && this.isDigit(this.lexer.peek())) {
      const num2Pos = this.lexer.getPosition();
      const num2 = this.parseNumber();
      
      this.lexer.skipWhitespace();
      
      if (this.lexer.peek() === 82) { // 'R'
        this.lexer.read();
        return {
          type: 'reference',
          objectNumber: num1.value,
          generation: num2.value,
        };
      }
      
      // Not a reference, restore position
      this.lexer.setPosition(num2Pos);
    }

    return num1;
  }

  /**
   * Parse a number
   */
  private parseNumber(): PDFNumber {
    let numStr = '';
    
    // Handle sign
    if (this.lexer.peek() === 43 || this.lexer.peek() === 45) { // + or -
      numStr += String.fromCharCode(this.lexer.read());
    }

    // Read digits and decimal point
    while (!this.lexer.isEOF()) {
      const ch = this.lexer.peek();
      if (this.isDigit(ch) || ch === 46) { // digit or '.'
        numStr += String.fromCharCode(this.lexer.read());
      } else {
        break;
      }
    }

    return { type: 'number', value: parseFloat(numStr) };
  }

  /**
   * Parse a literal string
   */
  private parseString(): PDFString {
    this.lexer.read(); // consume '('
    
    let result = '';
    let depth = 1;

    while (!this.lexer.isEOF() && depth > 0) {
      const ch = this.lexer.read();

      if (ch === 92) { // backslash - escape sequence
        const next = this.lexer.read();
        switch (next) {
          case 110: result += '\n'; break; // \n
          case 114: result += '\r'; break; // \r
          case 116: result += '\t'; break; // \t
          case 98: result += '\b'; break;  // \b
          case 102: result += '\f'; break; // \f
          case 40: result += '('; break;   // \(
          case 41: result += ')'; break;   // \)
          case 92: result += '\\'; break;  // \\
          case 10: case 13: break;         // line continuation
          default:
            // Octal escape
            if (next >= 48 && next <= 55) { // 0-7
              let octal = String.fromCharCode(next);
              for (let i = 0; i < 2 && !this.lexer.isEOF(); i++) {
                const ch = this.lexer.peek();
                if (ch >= 48 && ch <= 55) {
                  octal += String.fromCharCode(this.lexer.read());
                } else {
                  break;
                }
              }
              result += String.fromCharCode(parseInt(octal, 8));
            } else {
              result += String.fromCharCode(next);
            }
        }
      } else if (ch === 40) { // '('
        depth++;
        result += String.fromCharCode(ch);
      } else if (ch === 41) { // ')'
        depth--;
        if (depth > 0) {
          result += String.fromCharCode(ch);
        }
      } else {
        result += String.fromCharCode(ch);
      }
    }

    return { type: 'string', value: result };
  }

  /**
   * Parse a hexadecimal string
   */
  private parseHexString(): PDFString {
    this.lexer.read(); // consume '<'
    
    let hex = '';
    while (!this.lexer.isEOF()) {
      const ch = this.lexer.peek();
      if (ch === 62) { // '>'
        this.lexer.read();
        break;
      }
      if (ch === 32 || ch === 9 || ch === 10 || ch === 13) { // whitespace
        this.lexer.read();
        continue;
      }
      hex += String.fromCharCode(this.lexer.read());
    }

    // Convert hex to string
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = hex.substring(i, i + 2);
      result += String.fromCharCode(parseInt(byte.padEnd(2, '0'), 16));
    }

    return { type: 'string', value: result };
  }

  /**
   * Parse a name
   */
  private parseName(): PDFName {
    this.lexer.read(); // consume '/'
    
    let name = '';
    while (!this.lexer.isEOF()) {
      const ch = this.lexer.peek();
      
      // Delimiter characters
      if (ch === 0 || ch === 9 || ch === 10 || ch === 12 || ch === 13 || ch === 32 ||
          ch === 40 || ch === 41 || ch === 60 || ch === 62 || ch === 91 || ch === 93 ||
          ch === 123 || ch === 125 || ch === 47 || ch === 37) {
        break;
      }

      if (ch === 35) { // '#' - hex escape
        this.lexer.read();
        const hex1 = this.lexer.read();
        const hex2 = this.lexer.read();
        const hexStr = String.fromCharCode(hex1, hex2);
        name += String.fromCharCode(parseInt(hexStr, 16));
      } else {
        name += String.fromCharCode(this.lexer.read());
      }
    }

    return { type: 'name', value: name };
  }

  /**
   * Parse an array
   */
  private parseArray(): PDFArray {
    this.lexer.read(); // consume '['
    
    const items: PDFObject[] = [];

    while (!this.lexer.isEOF()) {
      this.lexer.skipWhitespace();
      
      if (this.lexer.peek() === 93) { // ']'
        this.lexer.read();
        break;
      }

      const obj = this.parseObject();
      if (obj) {
        items.push(obj);
      }
    }

    return { type: 'array', items };
  }

  /**
   * Parse a dictionary or stream
   */
  private parseDictionaryOrStream(): PDFDictionary | PDFStream {
    this.lexer.consume('<<');
    
    const entries = new Map<string, PDFObject>();

    while (!this.lexer.isEOF()) {
      this.lexer.skipWhitespace();
      
      if (this.lexer.match('>>')) {
        this.lexer.consume('>>');
        break;
      }

      // Parse key (must be a name)
      const key = this.parseName();
      
      this.lexer.skipWhitespace();
      
      // Parse value
      const value = this.parseObject();
      if (value) {
        entries.set(key.value, value);
      }
    }

    const dict: PDFDictionary = { type: 'dictionary', entries };

    // Check if this is a stream
    this.lexer.skipWhitespace();
    if (this.lexer.match('stream')) {
      this.lexer.consume('stream');
      
      // Skip EOL after 'stream'
      if (this.lexer.peek() === 13) { // CR
        this.lexer.read();
      }
      if (this.lexer.peek() === 10) { // LF
        this.lexer.read();
      }

      // Get stream length
      const lengthObj = entries.get('Length');
      let length = 0;
      
      if (lengthObj && lengthObj.type === 'number') {
        length = lengthObj.value;
      }

      // Read stream data
      const data = this.lexer.readBytes(length);

      // Skip to 'endstream'
      this.lexer.skipWhitespace();
      this.lexer.consume('endstream');

      return {
        type: 'stream',
        dictionary: dict,
        data,
      };
    }

    return dict;
  }

  /**
   * Parse an indirect object
   */
  parseIndirectObject(): PDFIndirectObject | null {
    this.lexer.skipWhitespace();
    
    if (this.lexer.isEOF()) {
      return null;
    }

    // Parse object number
    const objNum = this.parseNumber();
    
    this.lexer.skipWhitespace();
    
    // Parse generation number
    const genNum = this.parseNumber();
    
    this.lexer.skipWhitespace();
    
    // Expect 'obj'
    if (!this.lexer.match('obj')) {
      return null;
    }
    this.lexer.consume('obj');

    // Parse the object
    const obj = this.parseObject();
    
    if (!obj) {
      return null;
    }

    // Skip to 'endobj'
    this.lexer.skipWhitespace();
    this.lexer.consume('endobj');

    return {
      objectNumber: objNum.value,
      generation: genNum.value,
      object: obj,
    };
  }

  private isDigit(ch: number): boolean {
    return ch >= 48 && ch <= 57; // 0-9
  }
}
