# Document Parser

A document parser written from scratch in TypeScript with **no external dependencies**. Supports both PDF and PPTX (PowerPoint) formats.

## Features

- 🚀 **Pure TypeScript** - Written entirely in TypeScript with no external libraries
- 📄 **PDF Parsing** - Parse PDF files and extract document structure
- 📊 **PPTX Parsing** - Parse PowerPoint files and extract slide content
- 📝 **Text Extraction** - Extract text content from both PDF and PPTX documents
- 🔍 **Object Inspection** - Access document objects, metadata, and structure
- ⚡ **Lightweight** - No dependencies on external libraries

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### PDF Usage

#### Basic PDF Text Extraction

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

#### Parse and Inspect PDF Structure

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

### PPTX Usage

#### Basic PPTX Text Extraction

```typescript
import { parsePPTX, extractPPTXText } from './dist/index';
import * as fs from 'fs';

// Read PPTX file
const buffer = fs.readFileSync('presentation.pptx');
const pptxData = new Uint8Array(buffer);

// Parse PPTX
const doc = parsePPTX(pptxData);

// Extract text
const text = extractPPTXText(doc);
console.log(text);
```

#### Parse and Inspect PPTX Structure

```typescript
import { parsePPTX, PPTXParser } from './dist/index';

const doc = parsePPTX(pptxData);

console.log(`Slide Count: ${doc.slideCount}`);
console.log(`Title: ${doc.metadata.title}`);
console.log(`Creator: ${doc.metadata.creator}`);

// Access slides
for (const slide of doc.slides) {
  console.log(`Slide ${slide.slideNumber}: ${slide.title}`);
  console.log(`Text elements: ${slide.text.length}`);
}
```

## Examples

Run the PDF example:
```bash
npm run example
```

Run the PPTX example:
```bash
node dist/examples/pptx-example.js path/to/your/file.pptx
```

Run the tests:
```bash
npm test
```

## API Reference

### PDF Functions

- `parsePDF(data: Uint8Array): PDFDocument` - Parse a PDF from bytes
- `parsePDFFile(filePath: string): PDFDocument` - Parse a PDF from file path
- `parsePDFBuffer(buffer: Buffer): PDFDocument` - Parse a PDF from Node.js Buffer
- `extractText(doc: PDFDocument): string` - Extract text from a parsed PDF document
- `extractTextFromPDFFile(filePath: string): string` - Parse and extract text from PDF file
- `extractTextFromPDFBuffer(buffer: Buffer): string` - Parse and extract text from PDF buffer

### PPTX Functions

- `parsePPTX(data: Uint8Array): PPTXDocument` - Parse a PPTX from bytes
- `parsePPTXFile(filePath: string): PPTXDocument` - Parse a PPTX from file path
- `parsePPTXBuffer(buffer: Buffer): PPTXDocument` - Parse a PPTX from Node.js Buffer
- `extractPPTXText(doc: PPTXDocument): string` - Extract text from a parsed PPTX document
- `extractTextFromPPTXFile(filePath: string): string` - Parse and extract text from PPTX file
- `extractTextFromPPTXBuffer(buffer: Buffer): string` - Parse and extract text from PPTX buffer

### PDF Classes

- `PDFParser` - Main PDF document parser
- `PDFLexer` - Tokenizer for PDF content
- `PDFObjectParser` - Parser for PDF objects
- `PDFTextExtractor` - Text extraction utility

### PPTX Classes

- `PPTXParser` - Main PPTX document parser
- `ZIPParser` - ZIP archive parser for PPTX files
- `XMLParser` - XML parser for PPTX content
- `PPTXTextExtractor` - Text extraction utility

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

## PPTX Format Support

This parser supports Office Open XML (.pptx) format features:

- ✅ ZIP archive extraction
- ✅ XML content parsing
- ✅ Slide content extraction
- ✅ Text extraction from slides
- ✅ Presentation metadata (title, author, dates)
- ✅ Multiple slides support
- ✅ Speaker notes extraction
- ✅ Slide relationships parsing

**Not supported:**
- Image extraction
- Chart parsing
- SmartArt parsing
- Animations
- Embedded objects
- Master slides
- Complex formatting
- Password-protected presentations

## Architecture

The parser is organized into several components:

### PDF Components

1. **Lexer** (`src/parser/lexer.ts`) - Tokenizes PDF byte stream
2. **Object Parser** (`src/parser/object-parser.ts`) - Parses PDF objects
3. **PDF Parser** (`src/parser/pdf-parser.ts`) - Main document parser
4. **Text Extractor** (`src/utils/text-extractor.ts`) - Extracts text from content streams
5. **Types** (`src/types/pdf-types.ts`) - TypeScript type definitions

### PPTX Components

1. **ZIP Parser** (`src/parser/zip-parser.ts`) - Extracts files from ZIP archives
2. **XML Parser** (`src/parser/xml-parser.ts`) - Parses XML content
3. **PPTX Parser** (`src/parser/pptx-parser.ts`) - Main presentation parser
4. **Text Extractor** (`src/utils/pptx-text-extractor.ts`) - Extracts text from slides
5. **Types** (`src/types/pptx-types.ts`) - TypeScript type definitions

## Implementation Notes

This is a from-scratch implementation that:
- Uses only built-in TypeScript/JavaScript APIs
- No external libraries (except Node.js zlib for PPTX decompression)
- Implements basic PDF 1.4 and Office Open XML (PPTX) specifications
- Focuses on simplicity and readability over complete feature coverage
- Works in both Node.js and browser environments (with some limitations)

## License

ISC