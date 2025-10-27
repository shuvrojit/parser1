/**
 * Create a minimal valid PPTX file for testing
 */
import * as fs from 'fs';
import * as path from 'path';

function createPPTXFile(outputPath: string) {
  // We'll create the PPTX structure using Node's zlib
  const zlib = require('zlib');
  
  // PPTX files have specific structure
  const files: { [key: string]: string } = {};
  
  // [Content_Types].xml
  files['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;
  
  // _rels/.rels
  files['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;
  
  // docProps/core.xml
  files['docProps/core.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Test Presentation</dc:title>
  <dc:creator>PPTX Parser</dc:creator>
  <dc:subject>Testing</dc:subject>
  <dc:description>A minimal PPTX file for testing the parser</dc:description>
  <dcterms:created xsi:type="dcterms:W3CDTF">2024-01-01T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2024-01-01T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;
  
  // ppt/_rels/presentation.xml.rels
  files['ppt/_rels/presentation.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`;
  
  // ppt/presentation.xml
  files['ppt/presentation.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`;
  
  // ppt/slides/slide1.xml
  files['ppt/slides/slide1.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r>
              <a:t>Welcome to PPTX Parser</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r>
              <a:t>This is slide 1</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:r>
              <a:t>Testing text extraction</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
  
  // ppt/slides/slide2.xml
  files['ppt/slides/slide2.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r>
              <a:t>Second Slide</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r>
              <a:t>More content here</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

  // ppt/slides/_rels/slide1.xml.rels
  files['ppt/slides/_rels/slide1.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  // ppt/slides/_rels/slide2.xml.rels
  files['ppt/slides/_rels/slide2.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  // Now create the ZIP file
  const parts: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;
  
  for (const [fileName, content] of Object.entries(files)) {
    const fileBytes = Buffer.from(content, 'utf-8');
    const compressedData = zlib.deflateRawSync(fileBytes);
    
    // Local file header
    const localHeader = Buffer.alloc(30 + Buffer.byteLength(fileName));
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Version needed
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Compression method (DEFLATE)
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(0, 14); // CRC32 (simplified, should calculate properly)
    localHeader.writeUInt32LE(compressedData.length, 18); // Compressed size
    localHeader.writeUInt32LE(fileBytes.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(Buffer.byteLength(fileName), 26); // File name length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    localHeader.write(fileName, 30);
    
    parts.push(localHeader);
    parts.push(compressedData);
    
    // Central directory entry
    const centralEntry = Buffer.alloc(46 + Buffer.byteLength(fileName));
    centralEntry.writeUInt32LE(0x02014b50, 0); // Signature
    centralEntry.writeUInt16LE(20, 4); // Version made by
    centralEntry.writeUInt16LE(20, 6); // Version needed
    centralEntry.writeUInt16LE(0, 8); // Flags
    centralEntry.writeUInt16LE(8, 10); // Compression method
    centralEntry.writeUInt16LE(0, 12); // Mod time
    centralEntry.writeUInt16LE(0, 14); // Mod date
    centralEntry.writeUInt32LE(0, 16); // CRC32
    centralEntry.writeUInt32LE(compressedData.length, 20); // Compressed size
    centralEntry.writeUInt32LE(fileBytes.length, 24); // Uncompressed size
    centralEntry.writeUInt16LE(Buffer.byteLength(fileName), 28); // File name length
    centralEntry.writeUInt16LE(0, 30); // Extra field length
    centralEntry.writeUInt16LE(0, 32); // Comment length
    centralEntry.writeUInt16LE(0, 34); // Disk number
    centralEntry.writeUInt16LE(0, 36); // Internal attributes
    centralEntry.writeUInt32LE(0, 38); // External attributes
    centralEntry.writeUInt32LE(offset, 42); // Local header offset
    centralEntry.write(fileName, 46);
    
    centralDir.push(centralEntry);
    
    offset += localHeader.length + compressedData.length;
  }
  
  const centralDirOffset = offset;
  const centralDirBuffer = Buffer.concat(centralDir);
  parts.push(centralDirBuffer);
  
  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // Signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Disk with central directory
  eocd.writeUInt16LE(Object.keys(files).length, 8); // Entries on this disk
  eocd.writeUInt16LE(Object.keys(files).length, 10); // Total entries
  eocd.writeUInt32LE(centralDirBuffer.length, 12); // Central directory size
  eocd.writeUInt32LE(centralDirOffset, 16); // Central directory offset
  eocd.writeUInt16LE(0, 20); // Comment length
  
  parts.push(eocd);
  
  // Write to file
  const finalBuffer = Buffer.concat(parts);
  fs.writeFileSync(outputPath, finalBuffer);
  
  console.log(`Created PPTX file: ${outputPath}`);
  console.log(`File size: ${finalBuffer.length} bytes`);
}

// Create the test PPTX file
const outputPath = path.join(__dirname, '../../test-pptx/sample.pptx');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

createPPTXFile(outputPath);
