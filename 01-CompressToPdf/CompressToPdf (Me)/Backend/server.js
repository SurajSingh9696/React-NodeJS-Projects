const express = require("express");
const Busboy = require("busboy");
const cors = require("cors");
const { compressController } = require("./Controllers/CompressController");

const exp = express();
exp.use(express.json());
exp.use(cors());

// Custom middleware to handle file uploads with Busboy
const busboyMiddleware = (req, res, next) => {
  if (req.method !== 'POST' || !req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit per file
    }
  });

  req.files = [];
  req.body = {};

  busboy.on('field', (fieldname, value) => {
    req.body[fieldname] = value;
  });

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (fieldname === 'images') {
      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        req.files.push({
          fieldname,
          originalname: filename,
          encoding,
          mimetype,
          buffer,
          size: buffer.length
        });
      });
    } else {
      file.resume(); // Discard non-image files
    }
  });

  busboy.on('finish', () => {
    next();
  });

  busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(500).json({ error: 'File upload error' });
  });

  req.pipe(busboy);
};

// Apply the busboy middleware
exp.use(busboyMiddleware);

exp.post("/compress", compressController);

const PORT = 3333;
exp.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});