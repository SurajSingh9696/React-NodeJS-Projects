const { compressImage, compressMultipleImagesToBuffer } = require('../utils/compressUtil');

const compressController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const files = req.files.map((f) => f.buffer);
    const { quality = 80, targetSizeKB } = req.body;

    console.log(`Processing ${files.length} images with quality ${quality}`);

    if (files.length === 1) {
      const compressed = await compressImage(files[0], { 
        quality: Number(quality), 
        targetSizeKB: targetSizeKB ? Number(targetSizeKB) : undefined 
      });
      
      return res.binary(compressed, 'compressed.jpg', 'image/jpeg');
    } else {
      const zipBuffer = await compressMultipleImagesToBuffer(files, { 
        quality: Number(quality), 
        targetSizeKB: targetSizeKB ? Number(targetSizeKB) : undefined 
      });
      
      return res.binary(zipBuffer, 'compressed_images.zip', 'application/zip');
    }
  } catch (error) {
    console.error("Compression error:", error);
    res.status(500).json({ error: "Compression failed", message: error.message });
  }
};

module.exports = compressController;