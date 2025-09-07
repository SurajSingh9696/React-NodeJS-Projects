const qrModel = require("../models/qrModel");

const ImageUploadController = async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const data = await qrModel.create({ imageName: req.body.imageName, data: req.file.buffer });
        res.status(200).json({ message: "Image uploaded successfully"  , url : `http://localhost:5555/downloadQrImage/${data._id.toString()}` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = ImageUploadController;