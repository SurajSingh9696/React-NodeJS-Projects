const { compressToTargetSize, CompressImage } = require("../Utils/Compressor.js");

const compressController = async (req, res) => {
    try {
        // Check if files exist (Busboy stores them in req.files)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No images uploaded" });
        }

        const files = req.files;
        const qualityPercent = req.body.quality ? parseInt(req.body.quality) : null;
        const targetKB = req.body.targetKB ? parseInt(req.body.targetKB) : null;
        const format = req.body.format || "jpeg";
        const maxWidth = req.body.maxWidth ? parseInt(req.body.maxWidth) : undefined;
        const maxHeight = req.body.maxHeight ? parseInt(req.body.maxHeight) : undefined;

        console.log("Compression parameters:", { 
            qualityPercent, 
            targetKB, 
            format, 
            maxWidth, 
            maxHeight,
            fileCount: files.length
        });

        const compressed = [];

        for (let i = 0; i < files.length; i++) {
            try {
                let outBuffer;

                if (targetKB) {
                    outBuffer = await compressToTargetSize(files[i].buffer, targetKB, {
                        startQuality: qualityPercent || 85,
                        format,
                        maxHeight,
                        maxWidth
                    });
                } else {
                    outBuffer = await CompressImage(files[i].buffer, {
                        quality: qualityPercent || 80,
                        format,
                        maxHeight,
                        maxWidth
                    });
                }

                const base64 = outBuffer.toString("base64");
                const base64Url = `data:image/${format};base64,${base64}`;

                compressed.push(base64Url);
            } catch (fileError) {
                console.error(`Error processing file ${i}:`, fileError);
                // Push null or error message for failed files to maintain array order
                compressed.push(null);
            }
        }

        // Check if any files were successfully processed
        const successfulCompressions = compressed.filter(item => item !== null);
        if (successfulCompressions.length === 0) {
            return res.status(500).json({ error: "All images failed to compress" });
        }

        res.status(200).json({ 
            data: compressed,
            successCount: successfulCompressions.length,
            totalCount: files.length
        });

    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "An error occurred while compressing images: " + error.message });
    }
}

module.exports = {
    compressController
};