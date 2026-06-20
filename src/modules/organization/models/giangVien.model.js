import mongoose from 'mongoose';

const giangVienSchema = new mongoose.Schema(
  {
    maGV: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, default: '' },
    khoaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Khoa', required: true },
    boMonId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoMon', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

giangVienSchema.index({ khoaId: 1, boMonId: 1, isActive: 1 });
giangVienSchema.index({ fullName: 'text', maGV: 'text', email: 'text' });

const GiangVien = mongoose.model('GiangVien', giangVienSchema);
export default GiangVien;
