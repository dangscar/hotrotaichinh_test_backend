import mongoose from "mongoose";

const GeneratedFileSchema = new mongoose.Schema({
    tenDon: {
        type: String,
        required: true,
    },

    tenNguoiGui: {
        type: String,
        required: true,
    },

    duongDanFile: {
        type: String,
        required: true,
    },

    trangThai: {
        type: String,
        enum: ["nhap", "cho_duyet", "da_duyet", "tu_choi"],
        default: "nhap",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model("GeneratedFile", GeneratedFileSchema);
