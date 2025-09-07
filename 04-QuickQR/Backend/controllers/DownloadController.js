const qrModel = require("../models/qrModel");

const DownloadContoller = async (req, res) => {
    try {
        
        const id = req.params.id;
        const data = await qrModel.findById(id);
        if (!data) {
            return res.status(401).json({ message: "Image not found" });
        }
        res.set({"Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${data.imageName}.png"`});
        res.send(data.data);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

};

module.exports = DownloadContoller;