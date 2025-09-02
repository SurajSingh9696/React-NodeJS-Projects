const { generatePDF } = require('../utils/pdfUtil');

const pdfController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const files = req.files.map((f) => f.buffer);
    const { pageSize = 'A4', layout = 'portrait', margin = 20, autoOrientation = true } = req.body;
    
    const pdfBuffer = await generatePDF(files, { 
      pageSize, 
      layout, 
      margin: Number(margin), 
      autoOrientation: autoOrientation !== "false" 
    });
    
    return res.binary(pdfBuffer, 'output.pdf', 'application/pdf');
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "PDF generation failed", message: error.message });
  }
}
module.exports = pdfController;