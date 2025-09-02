const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

async function generatePDF(buffers, options = {}) {
  const {
    pageSize = 'A4',
    layout = 'portrait',
    margin = 20,
    autoOrientation = true,
  } = options;

  const pdfDoc = await PDFDocument.create();

  for (const buffer of buffers) {
    const metadata = await sharp(buffer).metadata();
    
    let width, height;
    
    if (pageSize === 'A4') {
      width = 595.28;
      height = 841.89;
    } else if (Array.isArray(pageSize)) {
      width = pageSize[0];
      height = pageSize[1];
    } else {
      width = 595.28;
      height = 841.89;
    }

    let orientation = layout;
    if (autoOrientation && metadata.width > metadata.height) {
      orientation = 'landscape';
      [width, height] = [height, width];
    }

    const page = pdfDoc.addPage([width, height]);
    
    const maxWidth = width - margin * 2;
    const maxHeight = height - margin * 2;
    
    const scale = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
    const displayWidth = metadata.width * scale;
    const displayHeight = metadata.height * scale;
    
    const x = (width - displayWidth) / 2;
    const y = (height - displayHeight) / 2;

    // Convert image to JPEG for better PDF compatibility
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
    
    const image = await pdfDoc.embedJpg(jpegBuffer);
    page.drawImage(image, {
      x,
      y,
      width: displayWidth,
      height: displayHeight,
    });
  }

  return await pdfDoc.save();
}

module.exports = { generatePDF };