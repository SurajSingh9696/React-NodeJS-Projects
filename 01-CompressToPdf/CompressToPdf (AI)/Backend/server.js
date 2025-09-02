const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { compressImage, compressMultipleImagesToBuffer } = require('./utils/compressUtil.js');
const { generatePDF } = require('./utils/pdfUtil.js');
const compressController = require('./Controllers/compressController.js');
const pdfController = require('./Controllers/pdfController.js');
const compressPdfController = require('./Controllers/compressPdfContoller.js');
const healthController = require('./Controllers/healthController.js');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to handle binary responses properly
app.use((req, res, next) => {
  res.binary = function(data, filename, contentType) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.setHeader('Content-Type', contentType);
    this.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    this.setHeader('Content-Length', buffer.length);
    this.send(buffer);
  };
  next();
});

app.post("/compress", upload.array("images", 20), compressController);

app.post("/pdf", upload.array("images", 20), pdfController);

app.post("/compress-pdf", upload.array("images", 20), compressPdfController);

// Health check endpoint
app.get("/health", healthController
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🚀 Check Server Health on http://localhost:${PORT}/health`);
});