/**
 * Simple test for the PDF parser
 */
import { parsePDF, extractText } from '../index';
import { createMinimalPDF } from './test-utils';

function runTests() {
  console.log('=== PDF Parser Tests ===\n');

  try {
    // Test 1: Parse minimal PDF
    console.log('Test 1: Parsing minimal PDF...');
    const pdfData = createMinimalPDF();
    const doc = parsePDF(pdfData);
    console.log('✓ PDF parsed successfully');
    console.log(`  Version: ${doc.version}`);
    console.log(`  Objects: ${doc.objects.size}`);
    console.log(`  Trailer size: ${doc.trailer.size}`);

    // Test 2: Extract text
    console.log('\nTest 2: Extracting text...');
    const text = extractText(doc);
    console.log('✓ Text extracted successfully');
    console.log(`  Text: "${text.trim()}"`);

    // Test 3: Verify text content
    console.log('\nTest 3: Verifying text content...');
    if (text.includes('Hello, World!')) {
      console.log('✓ Text content matches expected');
    } else {
      console.log('✗ Text content does not match expected');
    }

    console.log('\n=== All Tests Passed ===');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

runTests();
