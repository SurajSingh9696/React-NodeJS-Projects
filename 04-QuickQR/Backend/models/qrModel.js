const mongoose = require("mongoose");

const qrSchema = new mongoose.Schema({
    imageName : {
        type : String,
        required : true
    },
    data: {
        type: Buffer,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
}, { collection: 'QuickQR' });

const qrModel = mongoose.model("qrimages", qrSchema);
module.exports = qrModel;