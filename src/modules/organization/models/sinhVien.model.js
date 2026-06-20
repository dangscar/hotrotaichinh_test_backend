import mongoose from 'mongoose';

const sinhVienSchema = new mongoose.Schema(
  {
    maSV: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, default: '' },
    khoaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Khoa', required: true },
    boMonId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoMon', required: true },
    lopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lop', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

sinhVienSchema.index({ lopId: 1, isActive: 1 });
sinhVienSchema.index({ khoaId: 1, boMonId: 1 });
sinhVienSchema.index({ fullName: 'text', maSV: 'text', email: 'text' });

const SinhVien = mongoose.model('SinhVien', sinhVienSchema);
export default SinhVien;
