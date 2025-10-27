# PDF Parser

A PDF parser written from scratch in TypeScript with **no external dependencies**.

## Features

- 🚀 **Pure TypeScript** - Written entirely in TypeScript with no external libraries
- 📄 **PDF Parsing** - Parse PDF files and extract document structure
- 📝 **Text Extraction** - Extract text content from PDF documents
- 🔍 **Object Inspection** - Access PDF objects, dictionaries, arrays, and streams
- ⚡ **Lightweight** - No dependencies on external PDF libraries

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Basic Text Extraction

```typescript
import { parsePDF, extractText } from './dist/index';
import * as fs from 'fs';

// Read PDF file
const buffer = fs.readFileSync('document.pdf');
const pdfData = new Uint8Array(buffer);

// Parse PDF
const doc = parsePDF(pdfData);

// Extract text
const text = extractText(doc);
console.log(text);
```

### Parse and Inspect PDF Structure

```typescript
import { parsePDF, PDFParser } from './dist/index';

const doc = parsePDF(pdfData);

console.log(`PDF Version: ${doc.version}`);
console.log(`Objects: ${doc.objects.size}`);
console.log(`Trailer Size: ${doc.trailer.size}`);

// Access catalog
if (doc.trailer.root) {
  const catalog = PDFParser.getObjectByReference(doc, doc.trailer.root);
  console.log('Catalog:', catalog);
}
```

## Examples

Run the example:
```bash
npm run example
```

Run the tests:
```bash
npm test
```

## API Reference

### Main Functions

- `parsePDF(data: Uint8Array): PDFDocument` - Parse a PDF from bytes
- `parsePDFFile(filePath: string): PDFDocument` - Parse a PDF from file path
- `parsePDFBuffer(buffer: Buffer): PDFDocument` - Parse a PDF from Node.js Buffer
- `extractText(doc: PDFDocument): string` - Extract text from a parsed PDF document

### Classes

- `PDFParser` - Main PDF document parser
- `PDFLexer` - Tokenizer for PDF content
- `PDFObjectParser` - Parser for PDF objects
- `PDFTextExtractor` - Text extraction utility

## PDF Format Support

This parser supports basic PDF 1.4 format features:

- ✅ PDF header parsing
- ✅ Cross-reference table parsing
- ✅ Trailer dictionary parsing
- ✅ Indirect object parsing
- ✅ Basic object types (null, boolean, number, string, name, array, dictionary, stream)
- ✅ Text content extraction
- ✅ Page tree traversal

**Not supported:**
- Compressed cross-reference streams
- Object streams
- Encrypted PDFs
- Complex font encodings
- Embedded fonts
- Image extraction
- Form fields

## Architecture

The parser is organized into several components:

1. **Lexer** (`src/parser/lexer.ts`) - Tokenizes PDF byte stream
2. **Object Parser** (`src/parser/object-parser.ts`) - Parses PDF objects
3. **PDF Parser** (`src/parser/pdf-parser.ts`) - Main document parser
4. **Text Extractor** (`src/utils/text-extractor.ts`) - Extracts text from content streams
5. **Types** (`src/types/pdf-types.ts`) - TypeScript type definitions

## Implementation Notes

This is a from-scratch implementation that:
- Uses only built-in TypeScript/JavaScript APIs
- No external libraries (not even for compression/encryption)
- Implements basic PDF 1.4 specification features
- Focuses on simplicity and readability over complete feature coverage

## License

ISC