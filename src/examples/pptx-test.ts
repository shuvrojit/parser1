/**
 * Test for PPTX parser
 */
import * as fs from 'fs';
import * as path from 'path';
import { parsePPTX, extractPPTXText, ZIPParser, XMLParser } from '../index';

function testZIPParser() {
  console.log('Test 1: ZIP Parser...');
  
  // Create a minimal ZIP file for testing
  // ZIP local file header + central directory + EOCD
  const fileName = 'test.txt';
  const fileContent = 'Hello, PPTX!';
  const fileBytes = new TextEncoder().encode(fileContent);
  
  const parts: number[] = [];
  
  // Local file header
  const localHeaderOffset = 0;
  parts.push(...[0x50, 0x4b, 0x03, 0x04]); // Local file header signature
  parts.push(...[0x14, 0x00]); // Version needed
  parts.push(...[0x00, 0x00]); // Flags
  parts.push(...[0x00, 0x00]); // Compression method (stored)
  parts.push(...[0x00, 0x00]); // Mod time
  parts.push(...[0x00, 0x00]); // Mod date
  parts.push(...[0x00, 0x00, 0x00, 0x00]); // CRC32 (simplified)
  parts.push(...[fileBytes.length, 0x00, 0x00, 0x00]); // Compressed size
  parts.push(...[fileBytes.length, 0x00, 0x00, 0x00]); // Uncompressed size
  parts.push(...[fileName.length, 0x00]); // File name length
  parts.push(...[0x00, 0x00]); // Extra field length
  parts.push(...Array.from(new TextEncoder().encode(fileName))); // File name
  parts.push(...Array.from(fileBytes)); // File data
  
  // Central directory
  const centralDirOffset = parts.length;
  parts.push(...[0x50, 0x4b, 0x01, 0x02]); // Central directory signature
  parts.push(...[0x14, 0x00]); // Version made by
  parts.push(...[0x14, 0x00]); // Version needed
  parts.push(...[0x00, 0x00]); // Flags
  parts.push(...[0x00, 0x00]); // Compression method
  parts.push(...[0x00, 0x00]); // Mod time
  parts.push(...[0x00, 0x00]); // Mod date
  parts.push(...[0x00, 0x00, 0x00, 0x00]); // CRC32
  parts.push(...[fileBytes.length, 0x00, 0x00, 0x00]); // Compressed size
  parts.push(...[fileBytes.length, 0x00, 0x00, 0x00]); // Uncompressed size
  parts.push(...[fileName.length, 0x00]); // File name length
  parts.push(...[0x00, 0x00]); // Extra field length
  parts.push(...[0x00, 0x00]); // Comment length
  parts.push(...[0x00, 0x00]); // Disk number
  parts.push(...[0x00, 0x00]); // Internal attributes
  parts.push(...[0x00, 0x00, 0x00, 0x00]); // External attributes
  parts.push(...[localHeaderOffset, 0x00, 0x00, 0x00]); // Local header offset
  parts.push(...Array.from(new TextEncoder().encode(fileName))); // File name
  
  // End of central directory
  const eocdOffset = parts.length;
  parts.push(...[0x50, 0x4b, 0x05, 0x06]); // EOCD signature
  parts.push(...[0x00, 0x00]); // Disk number
  parts.push(...[0x00, 0x00]); // Disk with central directory
  parts.push(...[0x01, 0x00]); // Entries on this disk
  parts.push(...[0x01, 0x00]); // Total entries
  parts.push(...[eocdOffset - centralDirOffset, 0x00, 0x00, 0x00]); // Central directory size
  parts.push(...[centralDirOffset, 0x00, 0x00, 0x00]); // Central directory offset
  parts.push(...[0x00, 0x00]); // Comment length
  
  const zipData = new Uint8Array(parts);
  
  try {
    const zipParser = new ZIPParser(zipData);
    const entries = zipParser.parse();
    
    if (entries.size === 1 && entries.has(fileName)) {
      const entry = entries.get(fileName)!;
      const content = new TextDecoder().decode(entry.data);
      if (content === fileContent) {
        console.log('✓ ZIP parser works correctly');
        return true;
      }
    }
    console.log('✗ ZIP parser did not extract expected content');
    return false;
  } catch (error) {
    console.log('✗ ZIP parser test failed:', error);
    return false;
  }
}

function testXMLParser() {
  console.log('\nTest 2: XML Parser...');
  
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <title>Test Title</title>
  <content>Test Content</content>
  <items>
    <item id="1">Item 1</item>
    <item id="2">Item 2</item>
  </items>
</root>`;
  
  try {
    const xmlParser = new XMLParser(xmlContent);
    const xmlDoc = xmlParser.parse();
    
    if (xmlDoc && xmlDoc.name === 'root' && xmlDoc.children) {
      const titleNode = xmlDoc.children.find(n => n.name === 'title');
      if (titleNode && titleNode.children && titleNode.children[0].content === 'Test Title') {
        console.log('✓ XML parser works correctly');
        return true;
      }
    }
    
    console.log('✗ XML parser did not parse expected structure');
    return false;
  } catch (error) {
    console.log('✗ XML parser test failed:', error);
    return false;
  }
}

function testPPTXParser() {
  console.log('\nTest 3: PPTX Parser (requires real PPTX file)...');
  console.log('⚠ Skipping - requires a real PPTX file for testing');
  console.log('  To test with a real file, run:');
  console.log('  node dist/examples/pptx-example.js path/to/file.pptx');
  return true;
}

function runTests() {
  console.log('=== PPTX Parser Tests ===\n');

  let allPassed = true;
  
  allPassed = testZIPParser() && allPassed;
  allPassed = testXMLParser() && allPassed;
  allPassed = testPPTXParser() && allPassed;

  if (allPassed) {
    console.log('\n=== All Tests Passed ===');
  } else {
    console.log('\n=== Some Tests Failed ===');
    process.exit(1);
  }
}

runTests();
