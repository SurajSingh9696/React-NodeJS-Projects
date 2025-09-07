const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const dotenv = require('dotenv');

const ImageUploadController = require('./controllers/ImageUploadController');
const DownloadContoller = require('./controllers/DownloadController');

dotenv.config();
require('./models/db')();

const exp = express();

exp.use(cors());
exp.use(express.json());

exp.post("/imageUpload" ,upload.single("image"),  ImageUploadController)

exp.get("/downloadQrImage/:id" , DownloadContoller)


const PORT = process.env.PORT || 5000;


exp.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});