const Sharp = require("sharp");


async function CompressImage(Buffer, opts = {}) {
    const { quality = 75, format = "jpeg", maxWidth, maxHeight } = opts;
    const sharp = Sharp(Buffer);

    if (maxWidth || maxHeight) {
        sharp.resize({
            width: maxWidth,
            height: maxHeight,
            fit: Sharp.fit.inside,
            withoutEnlargement: true
        });
    }

    if (format === "jpeg") {
        return await sharp.jpeg({ quality, mozjpeg: true }).toBuffer();
    }
    else if (format === "webp") {
        return await sharp.webp({ quality }).toBuffer();
    }
    else if (format === "png") {
        return await sharp.png({ compressionLevel: Math.round((9 * (100 - quality)) / 100) }).toBuffer();
    }
    else {
        return await sharp.jpeg({ quality }).toBuffer();
    }
}



async function compressToTargetSize(buffer, targetKB, opts = {}) {
    const { startQuality = 90, minQuality = 10, step = 5, format = "jpeg", maxWidth, maxHeight } = opts;

    let quality = startQuality;
    let lastGood = null;

    let working = Sharp(buffer);
    if (maxHeight || maxWidth) {
        working = working.resize({
            width: maxWidth,
            height: maxHeight,
            fit: Sharp.fit.inside,
            withoutEnlargement: true
        });
    }

    while (quality >= minQuality) {
        console.log("Trying quality: " + quality);
        const buf = await working.clone()[format]({ quality }).toBuffer();
        const size = Math.round(buf.length / 1024);
        console.log("Size: " + size + "KB");

        if (size <= targetKB) return buf;

        lastGood = buf;
        quality -= step;
    }

    return lastGood || (await working.toBuffer());
}


module.exports = {
    compressToTargetSize, CompressImage
};
