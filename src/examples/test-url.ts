/**
 * Comprehensive tests for PDF parser including URL parsing
 */
import * as http from 'http';
import { parsePDF, parsePDFFromURL, extractText, extractTextFromPDFURL } from '../index';
import { createMinimalPDF } from './test-utils';

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
    const pdfData = createMinimalPDF('Hello from URL!');
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

    // Test 9: Test URL validation - invalid protocol
    testsRun++;
    console.log('\nTest 9: Testing URL validation for invalid protocol...');
    try {
      await parsePDFFromURL('ftp://example.com/test.pdf');
      throw new Error('Should have thrown an error for invalid protocol');
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP and HTTPS protocols')) {
        console.log('✓ URL validation for invalid protocol works correctly');
        console.log(`  Error: ${error.message}`);
        testsPassed++;
      } else {
        throw error;
      }
    }

    // Test 10: Test URL validation - empty URL
    testsRun++;
    console.log('\nTest 10: Testing URL validation for empty URL...');
    try {
      await parsePDFFromURL('');
      throw new Error('Should have thrown an error for empty URL');
    } catch (error) {
      if (error instanceof Error && error.message.includes('non-empty string')) {
        console.log('✓ URL validation for empty URL works correctly');
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
