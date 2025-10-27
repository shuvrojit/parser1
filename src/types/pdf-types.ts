/**
 * PDF Object Types
 */
export type PDFObject = 
  | PDFNull
  | PDFBoolean
  | PDFNumber
  | PDFString
  | PDFName
  | PDFArray
  | PDFDictionary
  | PDFStream
  | PDFIndirectReference;

export interface PDFNull {
  type: 'null';
}

export interface PDFBoolean {
  type: 'boolean';
  value: boolean;
}

export interface PDFNumber {
  type: 'number';
  value: number;
}

export interface PDFString {
  type: 'string';
  value: string;
}

export interface PDFName {
  type: 'name';
  value: string;
}

export interface PDFArray {
  type: 'array';
  items: PDFObject[];
}

export interface PDFDictionary {
  type: 'dictionary';
  entries: Map<string, PDFObject>;
}

export interface PDFStream {
  type: 'stream';
  dictionary: PDFDictionary;
  data: Uint8Array;
}

export interface PDFIndirectReference {
  type: 'reference';
  objectNumber: number;
  generation: number;
}

export interface PDFIndirectObject {
  objectNumber: number;
  generation: number;
  object: PDFObject;
}

/**
 * PDF Document Structure
 */
export interface PDFXRefEntry {
  offset: number;
  generation: number;
  inUse: boolean;
}

export interface PDFTrailer {
  size: number;
  root?: PDFIndirectReference;
  info?: PDFIndirectReference;
  id?: PDFArray;
  prev?: number;
}

export interface PDFDocument {
  version: string;
  objects: Map<string, PDFIndirectObject>;
  trailer: PDFTrailer;
  xrefTable: Map<number, PDFXRefEntry>;
}
