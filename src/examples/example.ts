/**
 * Example usage of the PDF parser
 */
import { parsePDF, extractText, PDFParser } from '../index';

// Create a sample PDF document
function createSamplePDF(): Uint8Array {
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
  parts.push('/BaseFont /Times-Roman\n');
  parts.push('>>\n');
  parts.push('>>\n');
  parts.push('>>\n');
  parts.push('/MediaBox [0 0 612 792]\n');
  parts.push('/Contents 4 0 R\n');
  parts.push('>>\n');
  parts.push('endobj\n');
  
  // Object 4: Content Stream
  const streamContent = 'BT\n/F1 24 Tf\n100 700 Td\n(PDF Parser Demo) Tj\n0 -30 Td\n/F1 12 Tf\n(This is a PDF parser written from scratch in TypeScript!) Tj\nET\n';
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

console.log('=== PDF Parser Example ===\n');

// Create a sample PDF
const pdfData = createSamplePDF();

// Parse the PDF
console.log('1. Parsing PDF document...');
const doc = parsePDF(pdfData);
console.log(`   ✓ Successfully parsed PDF version ${doc.version}`);
console.log(`   ✓ Found ${doc.objects.size} objects`);
console.log(`   ✓ Document has ${doc.trailer.size} total entries\n`);

// Extract text
console.log('2. Extracting text from PDF...');
const text = extractText(doc);
console.log(`   ✓ Extracted text:\n`);
console.log('   ' + '-'.repeat(50));
console.log('   ' + text.trim().replace(/\n/g, '\n   '));
console.log('   ' + '-'.repeat(50) + '\n');

// Inspect document structure
console.log('3. Document structure:');
console.log(`   Catalog: ${doc.trailer.root?.objectNumber} ${doc.trailer.root?.generation} R`);
console.log(`   Cross-reference table entries: ${doc.xrefTable.size}`);
console.log(`   Object types in document:`);

const objectTypes = new Map<string, number>();
for (const [key, obj] of doc.objects) {
  const type = obj.object.type;
  objectTypes.set(type, (objectTypes.get(type) || 0) + 1);
}

for (const [type, count] of objectTypes) {
  console.log(`     - ${type}: ${count}`);
}

console.log('\n=== Example Complete ===');
