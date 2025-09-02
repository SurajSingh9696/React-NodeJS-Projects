const { CompressImage } = require("../Utils/Compressor");
const {imagesToPdf} = require("./Utils/pdfMaker");

const pdfController = async (req , res)=>{
    try {
        let buffers = req.files.map(f => f.buffer);
        
        const tmp = [];
        for(const  b of buffers){
            const c = await CompressImage(b , {
                quality: parseInt(req.body.quality) || 80,
                format: "jpeg",
                maxWidth: parseInt(req.body.maxWidth) || undefined,
                maxHeight: parseInt(req.body.maxHeight) || undefined
            });

            tmp.push(c);
        }
        buffers = tmp;

        const pdfDoc = await imagesToPdf(buffers , {
            pageSize: req.body.pageSize || "A4",
            orientation: req.body.orientation || "portrait",
            margin: req.body.margin ? parseInt(req.body.margin) : 36
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=output.pdf");
        pdfDoc.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "An error occurred while generating PDF: " + error.message});
    }
}

module.exports = {
    pdfController
};