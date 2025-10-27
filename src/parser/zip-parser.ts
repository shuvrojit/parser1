import { ZIPEntry } from '../types/pptx-types';

/**
 * Simple ZIP Parser
 * Parses basic ZIP archives without compression support
 */
export class ZIPParser {
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Parse ZIP archive and extract all entries
   */
  parse(): Map<string, ZIPEntry> {
    const entries = new Map<string, ZIPEntry>();

    // Find End of Central Directory (EOCD)
    const eocdOffset = this.findEOCD();
    if (eocdOffset === -1) {
      throw new Error('Invalid ZIP file: End of Central Directory not found');
    }

    // Parse EOCD
    const centralDirOffset = this.readUint32LE(eocdOffset + 16);
    const centralDirEntries = this.readUint16LE(eocdOffset + 10);

    // Parse Central Directory entries
    let offset = centralDirOffset;
    for (let i = 0; i < centralDirEntries; i++) {
      const entry = this.parseCentralDirectoryEntry(offset);
      if (entry) {
        entries.set(entry.fileName, entry);
        offset += 46 + entry.fileName.length + this.readUint16LE(offset + 30) + this.readUint16LE(offset + 32);
      }
    }

    return entries;
  }

  /**
   * Find End of Central Directory signature
   */
  private findEOCD(): number {
    const signature = 0x06054b50; // End of central directory signature
    
    // Search from end of file (last 65KB)
    const searchStart = Math.max(0, this.data.length - 65536);
    
    for (let i = this.data.length - 22; i >= searchStart; i--) {
      if (this.readUint32LE(i) === signature) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Parse a Central Directory entry
   */
  private parseCentralDirectoryEntry(offset: number): ZIPEntry | null {
    const signature = this.readUint32LE(offset);
    
    if (signature !== 0x02014b50) { // Central directory file header signature
      return null;
    }

    const compressionMethod = this.readUint16LE(offset + 10);
    const compressedSize = this.readUint32LE(offset + 20);
    const uncompressedSize = this.readUint32LE(offset + 24);
    const fileNameLength = this.readUint16LE(offset + 28);
    const localHeaderOffset = this.readUint32LE(offset + 42);

    // Read file name
    const fileNameBytes = this.data.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder('utf-8').decode(fileNameBytes);

    // Extract file data from local file header
    const data = this.extractFileData(localHeaderOffset, compressionMethod, compressedSize, uncompressedSize);

    return {
      fileName,
      uncompressedSize,
      compressedSize,
      compressionMethod,
      localHeaderOffset,
      data
    };
  }

  /**
   * Extract file data from local file header
   */
  private extractFileData(
    localHeaderOffset: number,
    compressionMethod: number,
    compressedSize: number,
    uncompressedSize: number
  ): Uint8Array {
    const signature = this.readUint32LE(localHeaderOffset);
    
    if (signature !== 0x04034b50) { // Local file header signature
      throw new Error('Invalid local file header');
    }

    const fileNameLength = this.readUint16LE(localHeaderOffset + 26);
    const extraFieldLength = this.readUint16LE(localHeaderOffset + 28);
    
    const dataOffset = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
    const dataEnd = dataOffset + compressedSize;

    if (compressionMethod === 0) {
      // No compression (STORED)
      return this.data.slice(dataOffset, dataEnd);
    } else if (compressionMethod === 8) {
      // DEFLATE compression
      return this.inflateData(this.data.slice(dataOffset, dataEnd), uncompressedSize);
    } else {
      throw new Error(`Unsupported compression method: ${compressionMethod}`);
    }
  }

  /**
   * Inflate DEFLATE-compressed data
   * Basic implementation for common PPTX files
   */
  private inflateData(compressedData: Uint8Array, uncompressedSize: number): Uint8Array {
    try {
      return this.tryNodejsDecompression(compressedData);
    } catch (e) {
      throw new Error(`Failed to decompress data: ${e}. Requires Node.js environment with zlib.`);
    }
  }

  /**
   * Try Node.js zlib decompression
   */
  private tryNodejsDecompression(compressedData: Uint8Array): Uint8Array {
    if (typeof require !== 'undefined') {
      const zlib = require('zlib');
      const buffer = Buffer.from(compressedData);
      const inflated = zlib.inflateRawSync(buffer);
      return new Uint8Array(inflated);
    }
    throw new Error('Node.js zlib not available');
  }

  /**
   * Read 16-bit unsigned integer (little-endian)
   */
  private readUint16LE(offset: number): number {
    return this.data[offset] | (this.data[offset + 1] << 8);
  }

  /**
   * Read 32-bit unsigned integer (little-endian)
   */
  private readUint32LE(offset: number): number {
    return (
      this.data[offset] |
      (this.data[offset + 1] << 8) |
      (this.data[offset + 2] << 16) |
      (this.data[offset + 3] << 24)
    ) >>> 0;
  }
}
