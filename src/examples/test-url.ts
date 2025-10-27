/**
 * Comprehensive tests for PDF parser including URL parsing
 */
import * as fs from 'fs';
import * as http from 'http';
import { parsePDF, parsePDFFromURL, extractText, extractTextFromPDFURL } from '../index';

// Create a minimal valid PDF for testing
function createMinimalPDF(): Uint8Array {
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
  const streamContent = 'BT\n/F1 12 Tf\n100 700 Td\n(Hello from URL!) Tj\nET\n';
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

// Start a simple HTTP server for testing
function startTestServer(pdfData: Buffer): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/test.pdf') {
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Length': pdfData.length
        });
        res.end(pdfData);
      } else if (req.url === '/redirect.pdf') {
        res.writeHead(302, { 'Location': '/test.pdf' });
        res.end();
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve({ server, port: address.port });
      }
    });
  });
}

async function runTests() {
  console.log('=== Comprehensive PDF Parser Tests ===\n');

  let testServer: http.Server | null = null;
  let serverPort = 0;
  let testsRun = 0;
  let testsPassed = 0;

  try {
    // Test 1: Parse minimal PDF from Uint8Array
    testsRun++;
    console.log('Test 1: Parsing minimal PDF from Uint8Array...');
    const pdfData = createMinimalPDF();
    const doc = parsePDF(pdfData);
    
    if (doc.version && doc.objects.size > 0 && doc.trailer.size) {
      console.log('✓ PDF parsed successfully');
      console.log(`  Version: ${doc.version}`);
      console.log(`  Objects: ${doc.objects.size}`);
      console.log(`  Trailer size: ${doc.trailer.size}`);
      testsPassed++;
    } else {
      throw new Error('PDF structure validation failed');
    }

    // Test 2: Extract text from parsed document
    testsRun++;
    console.log('\nTest 2: Extracting text from parsed document...');
    const text = extractText(doc);
    
    if (text.includes('Hello from URL!')) {
      console.log('✓ Text extracted successfully');
      console.log(`  Text: "${text.trim()}"`);
      testsPassed++;
    } else {
      throw new Error(`Expected text to contain "Hello from URL!", got: "${text.trim()}"`);
    }

    // Test 3: Verify document structure
    testsRun++;
    console.log('\nTest 3: Verifying document structure...');
    const hasRoot = doc.trailer.root !== undefined;
    const hasSize = doc.trailer.size > 0;
    const hasObjects = doc.objects.size > 0;
    
    if (hasRoot && hasSize && hasObjects) {
      console.log('✓ Document structure is valid');
      console.log(`  Root reference: ${doc.trailer.root?.objectNumber} ${doc.trailer.root?.generation} R`);
      console.log(`  Total objects: ${doc.objects.size}`);
      testsPassed++;
    } else {
      throw new Error('Document structure validation failed');
    }

    // Test 4: Start test server and test URL parsing
    testsRun++;
    console.log('\nTest 4: Starting local HTTP server for URL tests...');
    const pdfBuffer = Buffer.from(pdfData);
    const { server, port } = await startTestServer(pdfBuffer);
    testServer = server;
    serverPort = port;
    console.log(`✓ Server started on port ${port}`);
    testsPassed++;

    // Test 5: Parse PDF from URL
    testsRun++;
    console.log('\nTest 5: Parsing PDF from URL...');
    const url = `http://localhost:${serverPort}/test.pdf`;
    const docFromURL = await parsePDFFromURL(url);
    
    if (docFromURL.version && docFromURL.objects.size > 0) {
      console.log('✓ PDF parsed from URL successfully');
      console.log(`  URL: ${url}`);
      console.log(`  Version: ${docFromURL.version}`);
      console.log(`  Objects: ${docFromURL.objects.size}`);
      testsPassed++;
    } else {
      throw new Error('PDF from URL validation failed');
    }

    // Test 6: Extract text from PDF URL
    testsRun++;
    console.log('\nTest 6: Extracting text from PDF URL...');
    const textFromURL = await extractTextFromPDFURL(url);
    
    if (textFromURL.includes('Hello from URL!')) {
      console.log('✓ Text extracted from URL successfully');
      console.log(`  Text: "${textFromURL.trim()}"`);
      testsPassed++;
    } else {
      throw new Error(`Expected text to contain "Hello from URL!", got: "${textFromURL.trim()}"`);
    }

    // Test 7: Test redirect handling
    testsRun++;
    console.log('\nTest 7: Testing URL redirect handling...');
    const redirectUrl = `http://localhost:${serverPort}/redirect.pdf`;
    const docFromRedirect = await parsePDFFromURL(redirectUrl);
    
    if (docFromRedirect.version && docFromRedirect.objects.size > 0) {
      console.log('✓ PDF parsed from redirected URL successfully');
      console.log(`  Redirect URL: ${redirectUrl}`);
      testsPassed++;
    } else {
      throw new Error('PDF from redirected URL validation failed');
    }

    // Test 8: Test error handling for invalid URL
    testsRun++;
    console.log('\nTest 8: Testing error handling for invalid URL...');
    try {
      await parsePDFFromURL(`http://localhost:${serverPort}/nonexistent.pdf`);
      throw new Error('Should have thrown an error for 404');
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        console.log('✓ Error handling for invalid URL works correctly');
        console.log(`  Error: ${error.message}`);
        testsPassed++;
      } else {
        throw error;
      }
    }

    console.log(`\n=== Test Results: ${testsPassed}/${testsRun} Tests Passed ===`);
    
    if (testsPassed === testsRun) {
      console.log('✓ All tests passed successfully!');
    } else {
      console.log(`✗ ${testsRun - testsPassed} test(s) failed`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    console.log(`\n=== Test Results: ${testsPassed}/${testsRun} Tests Passed ===`);
    process.exit(1);
  } finally {
    // Clean up test server
    if (testServer) {
      testServer.close();
      console.log('\n✓ Test server closed');
    }
  }
}

runTests();
