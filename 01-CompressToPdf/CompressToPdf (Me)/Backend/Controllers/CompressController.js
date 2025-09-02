const {compressToTargetSize , CompressImage} = require("../Utils/Compressor.js");


const compressController = async (req , res)=>{
    try {
        const files = req.files;
        if(!files.length) return res.status(400).json({error : "No images uploaded"});
        const qualityPercent = req.body.quality ? parseInt(req.body.quality) : null;
        const targetKB = req.body.targetKB ? parseInt(req.body.targetKB) : null;
        const format = req.body.format || "jpeg";
        const maxWidth = req.body.maxWidth ? parseInt(req.body.maxWidth) : undefined;
        const maxHeight = req.body.maxHeight ? parseInt(req.body.maxHeight) : undefined;

        console.log(qualityPercent , targetKB , format , maxWidth , maxHeight);

        const compressed = [];

        for(let i = 0; i < files.length; i++){
            let outBuffer;

            if(targetKB){
                outBuffer = await compressToTargetSize(files[i].buffer, targetKB, {
                    startQuality: qualityPercent || 85,
                    format,
                    maxHeight,
                    maxWidth
                });

            }else{
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
        }

        res.status(200).json({data: compressed});

    } catch (error) {
        console.error(error);
        res.status(500).json({error: "An error occurred while compressing images: " + error.message});
    }
}

module.exports = {
    compressController
};