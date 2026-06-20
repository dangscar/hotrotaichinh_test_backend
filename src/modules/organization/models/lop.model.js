import mongoose from 'mongoose';

const lopSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    khoaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Khoa', required: true },
    boMonId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoMon', required: true },
    academicYear: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

lopSchema.index({ boMonId: 1, code: 1 }, { unique: true });
lopSchema.index({ khoaId: 1, boMonId: 1, isActive: 1 });

const Lop = mongoose.model('Lop', lopSchema);
export default Lop;
