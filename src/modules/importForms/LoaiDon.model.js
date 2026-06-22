import mongoose from 'mongoose';

const LoaiDonSchema = new mongoose.Schema({
    tenDon: String,

    templateFile: String,

    chiTiet: [
        {
            moTa: String,
            placeHolder: String,
        }
    ]
}, {
    timestamps: true,
});

export default mongoose.model("LoaiDon", LoaiDonSchema);