import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
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

/**
 * Fetch data from a URL
 */
function fetchFromURL(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (response.headers.location) {
          // Resolve relative URLs
          const redirectUrl = response.headers.location.startsWith('http') 
            ? response.headers.location 
            : new URL(response.headers.location, url).href;
          fetchFromURL(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch PDF: HTTP ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse a PDF from a URL
 */
export async function parsePDFFromURL(url: string): Promise<PDFDocument> {
  const buffer = await fetchFromURL(url);
  return parsePDFBuffer(buffer);
}

/**
 * Extract text from a PDF at a URL
 */
export async function extractTextFromPDFURL(url: string): Promise<string> {
  const doc = await parsePDFFromURL(url);
  const extractor = new PDFTextExtractor(doc);
  return extractor.extractText();
}
