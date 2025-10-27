/**
 * Example usage of PDF parser with URL parsing
 */
import { parsePDFFromURL, extractTextFromPDFURL } from '../index';

async function runExample() {
  console.log('=== PDF Parser URL Example ===\n');

  // Example: Create a sample PDF programmatically
  console.log('Note: This example demonstrates URL parsing capability.');
  console.log('For demonstration, you would typically use a real URL like:');
  console.log('  const url = "https://example.com/sample.pdf";');
  console.log('\nExample usage:\n');

  console.log('```typescript');
  console.log('// Parse PDF from URL');
  console.log('const doc = await parsePDFFromURL(url);');
  console.log('console.log(`PDF Version: ${doc.version}`);');
  console.log('console.log(`Objects: ${doc.objects.size}`);');
  console.log('');
  console.log('// Extract text directly from URL');
  console.log('const text = await extractTextFromPDFURL(url);');
  console.log('console.log(text);');
  console.log('```\n');

  console.log('Features:');
  console.log('  ✓ Supports HTTP and HTTPS protocols');
  console.log('  ✓ Handles URL redirects (301, 302)');
  console.log('  ✓ Returns structured PDF document');
  console.log('  ✓ No external dependencies required\n');

  console.log('For a complete working example, see test-url.ts which');
  console.log('creates a local HTTP server and demonstrates URL parsing.');
}

runExample();
