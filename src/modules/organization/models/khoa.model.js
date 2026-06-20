import mongoose from 'mongoose';

const khoaSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

khoaSchema.index({ isActive: 1, name: 1 });

const Khoa = mongoose.model('Khoa', khoaSchema);
export default Khoa;
