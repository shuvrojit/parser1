/**
 * PPTX (PowerPoint) Types
 */

/**
 * XML Node types
 */
export interface XMLNode {
  type: 'element' | 'text' | 'cdata';
  name?: string;
  attributes?: Map<string, string>;
  children?: XMLNode[];
  content?: string;
}

/**
 * ZIP Archive Entry
 */
export interface ZIPEntry {
  fileName: string;
  uncompressedSize: number;
  compressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
  data: Uint8Array;
}

/**
 * PPTX Slide Content
 */
export interface PPTXSlide {
  slideNumber: number;
  title?: string;
  text: string[];
  notes?: string;
  relationships: Map<string, string>;
}

/**
 * PPTX Presentation Metadata
 */
export interface PPTXMetadata {
  title?: string;
  subject?: string;
  creator?: string;
  created?: Date;
  modified?: Date;
  description?: string;
}

/**
 * PPTX Document Structure
 */
export interface PPTXDocument {
  metadata: PPTXMetadata;
  slides: PPTXSlide[];
  slideCount: number;
}
