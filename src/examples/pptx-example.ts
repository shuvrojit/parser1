/**
 * Example usage of the PPTX parser
 */
import { parsePPTX, extractPPTXText } from '../index';
import * as fs from 'fs';

// Create a minimal PPTX file for testing
function createMinimalPPTX(): Uint8Array {
  // This is a base64 encoded minimal PPTX file with 2 slides
  // Generated using PowerPoint and base64 encoded
  
  // For demonstration purposes, we'll create a simple structure
  // In a real scenario, you would use an actual PPTX file
  
  console.log('Note: To test with a real PPTX file, provide the file path.');
  console.log('Example: node dist/examples/pptx-example.js path/to/your/file.pptx\n');
  
  // Return empty for now - actual testing requires a real PPTX file
  return new Uint8Array(0);
}

console.log('=== PPTX Parser Example ===\n');

// Check if a file path was provided
const filePath = process.argv[2];

if (filePath) {
  try {
    console.log(`1. Reading PPTX file: ${filePath}`);
    const buffer = fs.readFileSync(filePath);
    const pptxData = new Uint8Array(buffer);
    
    console.log('2. Parsing PPTX document...');
    const doc = parsePPTX(pptxData);
    console.log(`   ✓ Successfully parsed PPTX`);
    console.log(`   ✓ Found ${doc.slideCount} slides`);
    console.log(`   ✓ Metadata:`);
    if (doc.metadata.title) console.log(`      - Title: ${doc.metadata.title}`);
    if (doc.metadata.creator) console.log(`      - Creator: ${doc.metadata.creator}`);
    if (doc.metadata.created) console.log(`      - Created: ${doc.metadata.created}`);
    console.log();

    // Extract text
    console.log('3. Extracting text from PPTX...');
    const text = extractPPTXText(doc);
    console.log(`   ✓ Extracted text:\n`);
    console.log('   ' + '-'.repeat(70));
    console.log('   ' + text.replace(/\n/g, '\n   '));
    console.log('   ' + '-'.repeat(70) + '\n');

    // Show slide details
    console.log('4. Slide details:');
    for (const slide of doc.slides) {
      console.log(`   Slide ${slide.slideNumber}:`);
      if (slide.title) {
        console.log(`     Title: ${slide.title}`);
      }
      console.log(`     Text elements: ${slide.text.length}`);
      if (slide.notes) {
        console.log(`     Has notes: Yes`);
      }
    }

    console.log('\n=== Example Complete ===');
  } catch (error) {
    console.error('\n✗ Error parsing PPTX:', error);
    console.error('\nPlease ensure the file is a valid PPTX file.');
    process.exit(1);
  }
} else {
  console.log('Usage: node dist/examples/pptx-example.js <path-to-pptx-file>');
  console.log('\nThe PPTX parser supports:');
  console.log('  ✓ Text extraction from slides');
  console.log('  ✓ Slide titles and content');
  console.log('  ✓ Speaker notes');
  console.log('  ✓ Presentation metadata (title, author, dates)');
  console.log('  ✓ Multiple slides');
  console.log('\nExample:');
  console.log('  node dist/examples/pptx-example.js presentation.pptx');
}
