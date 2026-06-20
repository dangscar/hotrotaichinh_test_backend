import mongoose from 'mongoose';

export const QUYEN_CODES = [
  'truong_khoa',
  'pho_khoa',
  'truong_bo_mon',
  'pho_bo_mon',
  'ban_giam_hieu',
  'truong_phong',
  'pho_phong',
];

const quyenSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Quyen = mongoose.model('Quyen', quyenSchema);
export default Quyen;
