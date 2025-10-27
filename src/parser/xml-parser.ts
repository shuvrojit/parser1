import { XMLNode } from '../types/pptx-types';

/**
 * Simple XML Parser
 * Parses basic XML without external dependencies
 */
export class XMLParser {
  private data: string;
  private position: number;

  constructor(data: string) {
    this.data = data;
    this.position = 0;
  }

  /**
   * Parse XML string into a tree structure
   */
  parse(): XMLNode | null {
    this.skipWhitespace();
    
    // Skip XML declaration if present
    if (this.peek() === '<' && this.data.substring(this.position, this.position + 5) === '<?xml') {
      this.skipDeclaration();
      this.skipWhitespace();
    }

    return this.parseElement();
  }

  /**
   * Skip XML declaration
   */
  private skipDeclaration(): void {
    while (this.position < this.data.length && this.data.substring(this.position, this.position + 2) !== '?>') {
      this.position++;
    }
    if (this.data.substring(this.position, this.position + 2) === '?>') {
      this.position += 2;
    }
  }

  /**
   * Parse an XML element
   */
  private parseElement(): XMLNode | null {
    if (this.peek() !== '<') {
      return this.parseText();
    }

    this.position++; // Skip '<'

    // Check for comment
    if (this.data.substring(this.position, this.position + 3) === '!--') {
      this.skipComment();
      this.skipWhitespace();
      return this.parseElement();
    }

    // Check for CDATA
    if (this.data.substring(this.position, this.position + 8) === '![CDATA[') {
      return this.parseCDATA();
    }

    // Check for closing tag
    if (this.peek() === '/') {
      return null;
    }

    // Parse tag name
    const name = this.parseTagName();
    this.skipWhitespace();

    // Parse attributes
    const attributes = this.parseAttributes();
    this.skipWhitespace();

    // Check for self-closing tag
    if (this.peek() === '/' && this.peekNext() === '>') {
      this.position += 2;
      return {
        type: 'element',
        name,
        attributes,
        children: []
      };
    }

    // Skip '>'
    if (this.peek() === '>') {
      this.position++;
    }

    // Parse children
    const children: XMLNode[] = [];
    while (this.position < this.data.length) {
      this.skipWhitespace();
      
      // Check for closing tag
      if (this.data.substring(this.position, this.position + 2 + name.length) === `</${name}`) {
        this.position += 2 + name.length;
        this.skipWhitespace();
        if (this.peek() === '>') {
          this.position++;
        }
        break;
      }

      const child = this.parseElement();
      if (child) {
        children.push(child);
      } else {
        break;
      }
    }

    return {
      type: 'element',
      name,
      attributes,
      children
    };
  }

  /**
   * Parse text content
   */
  private parseText(): XMLNode {
    let text = '';
    while (this.position < this.data.length && this.peek() !== '<') {
      text += this.data[this.position];
      this.position++;
    }
    
    return {
      type: 'text',
      content: this.decodeEntities(text.trim())
    };
  }

  /**
   * Parse CDATA section
   */
  private parseCDATA(): XMLNode {
    this.position += 8; // Skip '![CDATA['
    let content = '';
    while (this.position < this.data.length && this.data.substring(this.position, this.position + 3) !== ']]>') {
      content += this.data[this.position];
      this.position++;
    }
    this.position += 3; // Skip ']]>'
    
    return {
      type: 'cdata',
      content
    };
  }

  /**
   * Parse tag name
   */
  private parseTagName(): string {
    let name = '';
    while (this.position < this.data.length) {
      const ch = this.peek();
      if (ch === ' ' || ch === '>' || ch === '/' || ch === '\t' || ch === '\n' || ch === '\r') {
        break;
      }
      name += ch;
      this.position++;
    }
    return name;
  }

  /**
   * Parse attributes
   */
  private parseAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();
    
    while (this.position < this.data.length) {
      this.skipWhitespace();
      
      const ch = this.peek();
      if (ch === '>' || ch === '/') {
        break;
      }

      // Parse attribute name
      const name = this.parseAttributeName();
      if (!name) break;

      this.skipWhitespace();

      // Skip '='
      if (this.peek() === '=') {
        this.position++;
        this.skipWhitespace();
      }

      // Parse attribute value
      const value = this.parseAttributeValue();
      attributes.set(name, value);
    }

    return attributes;
  }

  /**
   * Parse attribute name
   */
  private parseAttributeName(): string {
    let name = '';
    while (this.position < this.data.length) {
      const ch = this.peek();
      if (ch === '=' || ch === ' ' || ch === '>' || ch === '/' || ch === '\t' || ch === '\n' || ch === '\r') {
        break;
      }
      name += ch;
      this.position++;
    }
    return name;
  }

  /**
   * Parse attribute value
   */
  private parseAttributeValue(): string {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") {
      return '';
    }

    this.position++; // Skip opening quote
    let value = '';
    
    while (this.position < this.data.length && this.peek() !== quote) {
      value += this.data[this.position];
      this.position++;
    }

    if (this.peek() === quote) {
      this.position++; // Skip closing quote
    }

    return this.decodeEntities(value);
  }

  /**
   * Skip XML comment
   */
  private skipComment(): void {
    this.position += 3; // Skip '!--'
    while (this.position < this.data.length && this.data.substring(this.position, this.position + 3) !== '-->') {
      this.position++;
    }
    if (this.data.substring(this.position, this.position + 3) === '-->') {
      this.position += 3;
    }
  }

  /**
   * Skip whitespace
   */
  private skipWhitespace(): void {
    while (this.position < this.data.length) {
      const ch = this.peek();
      if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
        break;
      }
      this.position++;
    }
  }

  /**
   * Peek current character
   */
  private peek(): string {
    return this.data[this.position] || '';
  }

  /**
   * Peek next character
   */
  private peekNext(): string {
    return this.data[this.position + 1] || '';
  }

  /**
   * Decode HTML entities
   */
  private decodeEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
}
