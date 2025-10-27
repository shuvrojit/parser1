/**
 * Shared test utilities for PDF parser tests
 */

/**
 * Create a minimal valid PDF for testing
 */
export function createMinimalPDF(contentText = 'Hello, World!'): Uint8Array {
  // Build PDF with correct offsets
  const parts: string[] = [];
  const offsets: number[] = [0]; // Object 0 is always unused
  
  parts.push('%PDF-1.4\n');
  
  // Object 1: Catalog
  offsets.push(parts.join('').length);
  parts.push('1 0 obj\n');
  parts.push('<<\n');
  parts.push('/Type /Catalog\n');
  parts.push('/Pages 2 0 R\n');
  parts.push('>>\n');
  parts.push('endobj\n');
  
  // Object 2: Pages
  offsets.push(parts.join('').length);
  parts.push('2 0 obj\n');
  parts.push('<<\n');
  parts.push('/Type /Pages\n');
  parts.push('/Kids [3 0 R]\n');
  parts.push('/Count 1\n');
  parts.push('>>\n');
  parts.push('endobj\n');
  
  // Object 3: Page
  offsets.push(parts.join('').length);
  parts.push('3 0 obj\n');
  parts.push('<<\n');
  parts.push('/Type /Page\n');
  parts.push('/Parent 2 0 R\n');
  parts.push('/Resources <<\n');
  parts.push('/Font <<\n');
  parts.push('/F1 <<\n');
  parts.push('/Type /Font\n');
  parts.push('/Subtype /Type1\n');
  parts.push('/BaseFont /Helvetica\n');
  parts.push('>>\n');
  parts.push('>>\n');
  parts.push('>>\n');
  parts.push('/MediaBox [0 0 612 792]\n');
  parts.push('/Contents 4 0 R\n');
  parts.push('>>\n');
  parts.push('endobj\n');
  
  // Object 4: Content Stream
  const streamContent = `BT\n/F1 12 Tf\n100 700 Td\n(${contentText}) Tj\nET\n`;
  offsets.push(parts.join('').length);
  parts.push('4 0 obj\n');
  parts.push('<<\n');
  parts.push(`/Length ${streamContent.length}\n`);
  parts.push('>>\n');
  parts.push('stream\n');
  parts.push(streamContent);
  parts.push('endstream\n');
  parts.push('endobj\n');
  
  // Cross-reference table
  const xrefPos = parts.join('').length;
  parts.push('xref\n');
  parts.push('0 5\n');
  parts.push('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    const offset = offsets[i].toString().padStart(10, '0');
    parts.push(`${offset} 00000 n \n`);
  }
  
  // Trailer
  parts.push('trailer\n');
  parts.push('<<\n');
  parts.push('/Size 5\n');
  parts.push('/Root 1 0 R\n');
  parts.push('>>\n');
  parts.push('startxref\n');
  parts.push(`${xrefPos}\n`);
  parts.push('%%EOF');
  
  return new TextEncoder().encode(parts.join(''));
}
