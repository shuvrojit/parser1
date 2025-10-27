import * as fs from 'fs';
import { PDFParser } from './parser/pdf-parser';
import { PDFTextExtractor } from './utils/text-extractor';
import { PDFDocument } from './types/pdf-types';

export { PDFParser } from './parser/pdf-parser';
export { PDFTextExtractor } from './utils/text-extractor';
export { PDFLexer } from './parser/lexer';
export { PDFObjectParser } from './parser/object-parser';
export * from './types/pdf-types';

/**
 * Parse a PDF file from a file path
 */
export function parsePDFFile(filePath: string): PDFDocument {
  const buffer = fs.readFileSync(filePath);
  const data = new Uint8Array(buffer);
  const parser = new PDFParser(data);
  return parser.parse();
}

/**
 * Parse a PDF from a buffer
 */
export function parsePDFBuffer(buffer: Buffer): PDFDocument {
  const data = new Uint8Array(buffer);
  const parser = new PDFParser(data);
  return parser.parse();
}

/**
 * Parse a PDF from Uint8Array
 */
export function parsePDF(data: Uint8Array): PDFDocument {
  const parser = new PDFParser(data);
  return parser.parse();
}

/**
 * Extract text from a PDF file
 */
export function extractTextFromPDFFile(filePath: string): string {
  const doc = parsePDFFile(filePath);
  const extractor = new PDFTextExtractor(doc);
  return extractor.extractText();
}

/**
 * Extract text from a PDF buffer
 */
export function extractTextFromPDFBuffer(buffer: Buffer): string {
  const doc = parsePDFBuffer(buffer);
  const extractor = new PDFTextExtractor(doc);
  return extractor.extractText();
}

/**
 * Extract text from a PDF document
 */
export function extractText(doc: PDFDocument): string {
  const extractor = new PDFTextExtractor(doc);
  return extractor.extractText();
}
