const sharp = require('sharp');
const JSZip = require('jszip');

async function compressImage(buffer, options = {}) {
  const { quality = 80, targetSizeKB } = options;
  
  try {
    if (!targetSizeKB) {
      return sharp(buffer)
        .jpeg({ 
          quality, 
          mozjpeg: true, 
          progressive: true,
          force: true
        })
        .toBuffer();
    }

    let outputBuffer = await sharp(buffer)
      .jpeg({ 
        quality, 
        mozjpeg: true, 
        progressive: true,
        force: true
      })
      .toBuffer();

    let currentKB = outputBuffer.length / 1024;
    
    if (currentKB <= targetSizeKB) {
      return outputBuffer;
    }

    // Binary search for optimal quality
    let low = 10;
    let high = quality;
    let optimalBuffer = outputBuffer;

    while (low <= high) {
      const midQuality = Math.floor((low + high) / 2);
      
      const testBuffer = await sharp(buffer)
        .jpeg({ 
          quality: midQuality, 
          mozjpeg: true, 
          progressive: true,
          force: true
        })
        .toBuffer();
      
      const testKB = testBuffer.length / 1024;

      if (testKB <= targetSizeKB) {
        optimalBuffer = testBuffer;
        low = midQuality + 1;
      } else {
        high = midQuality - 1;
      }
    }

    return optimalBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
}

async function compressMultipleImagesToBuffer(buffers, options = {}) {
  try {
    const zip = new JSZip();
    
    // Process all images in parallel
    const compressionPromises = buffers.map(async (buffer, index) => {
      try {
        const compressed = await compressImage(buffer, options);
        const filename = `image_${index + 1}.jpg`;
        zip.file(filename, compressed);
        return filename;
      } catch (error) {
        console.error(`Error compressing image ${index + 1}:`, error);
        throw error;
      }
    });

    await Promise.all(compressionPromises);
    
    // Generate ZIP file with proper options
    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      },
      platform: 'DOS',
      comment: 'Compressed images archive'
    });

    // Convert Uint8Array to Buffer
    return Buffer.from(zipBuffer);
  } catch (error) {
    console.error('ZIP creation error:', error);
    throw error;
  }
}

module.exports = {
  compressImage,
  compressMultipleImagesToBuffer
};