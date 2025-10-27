/**
 * Lexer for tokenizing PDF content
 */
export class PDFLexer {
  private data: Uint8Array;
  private position: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.position = 0;
  }

  getPosition(): number {
    return this.position;
  }

  setPosition(pos: number): void {
    this.position = pos;
  }

  isEOF(): boolean {
    return this.position >= this.data.length;
  }

  peek(offset: number = 0): number {
    const pos = this.position + offset;
    return pos < this.data.length ? this.data[pos] : -1;
  }

  read(): number {
    return this.isEOF() ? -1 : this.data[this.position++];
  }

  readBytes(length: number): Uint8Array {
    const bytes = this.data.slice(this.position, this.position + length);
    this.position += length;
    return bytes;
  }

  skipWhitespace(): void {
    while (!this.isEOF()) {
      const ch = this.peek();
      // PDF whitespace: null (0), tab (9), line feed (10), form feed (12), carriage return (13), space (32)
      if (ch === 0 || ch === 9 || ch === 10 || ch === 12 || ch === 13 || ch === 32) {
        this.read();
      } else if (ch === 37) { // '%' - comment
        this.skipComment();
      } else {
        break;
      }
    }
  }

  skipComment(): void {
    // Skip until end of line
    while (!this.isEOF()) {
      const ch = this.read();
      if (ch === 10 || ch === 13) { // LF or CR
        break;
      }
    }
  }

  readUntil(delimiter: number): Uint8Array {
    const start = this.position;
    while (!this.isEOF() && this.peek() !== delimiter) {
      this.read();
    }
    return this.data.slice(start, this.position);
  }

  readWhile(predicate: (ch: number) => boolean): Uint8Array {
    const start = this.position;
    while (!this.isEOF() && predicate(this.peek())) {
      this.read();
    }
    return this.data.slice(start, this.position);
  }

  match(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (this.peek(i) !== str.charCodeAt(i)) {
        return false;
      }
    }
    return true;
  }

  consume(str: string): boolean {
    if (this.match(str)) {
      this.position += str.length;
      return true;
    }
    return false;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder('latin1').decode(bytes);
  }

  findSequence(sequence: string, startPos?: number): number {
    if (startPos !== undefined) {
      this.position = startPos;
    }

    const bytes = new TextEncoder().encode(sequence);
    
    while (this.position < this.data.length) {
      let match = true;
      for (let i = 0; i < bytes.length; i++) {
        if (this.position + i >= this.data.length || this.data[this.position + i] !== bytes[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        return this.position;
      }
      
      this.position++;
    }
    
    return -1;
  }
}
