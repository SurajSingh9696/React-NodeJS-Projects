const express = require("express");
const multer = require("multer");
const cors = require("cors");

const { compressController } = require("./Controllers/CompressController");

const upload = multer({storage: multer.memoryStorage()});
const exp = express();
exp.use(express.json());
exp.use(cors());


exp.post("/compress" , upload.array("images") , compressController);

const PORT = 3333;
exp.listen(PORT , ()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})