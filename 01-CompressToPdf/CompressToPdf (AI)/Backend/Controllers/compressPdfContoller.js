const { compressImage, compressMultipleImagesToBuffer } = require('../utils/compressUtil.js');
const { generatePDF } = require('../utils/pdfUtil.js');

const compressPdfController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const files = req.files.map((f) => f.buffer);
    const { quality = 80, targetSizeKB, pageSize = 'A4', layout = 'portrait', margin = 20, autoOrientation = true } = req.body;

    const compressedImages = await Promise.all(
      files.map(file => 
        compressImage(file, { 
          quality: Number(quality), 
          targetSizeKB: targetSizeKB ? Number(targetSizeKB) : undefined 
        })
      )
    );

    const pdfBuffer = await generatePDF(compressedImages, { 
      pageSize, 
      layout, 
      margin: Number(margin), 
      autoOrientation: autoOrientation !== "false" 
    });
    
    return res.binary(pdfBuffer, 'compressed_output.pdf', 'application/pdf');
  } catch (error) {
    console.error("Compress + PDF error:", error);
    res.status(500).json({ error: "Compress + PDF failed", message: error.message });
  }
}

module.exports = compressPdfController;