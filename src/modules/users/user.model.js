import mongoose from 'mongoose';
import { ROLE_LIST } from '../../config/roles.js';
import { isValidCtutEmail, CTUT_EMAIL_MESSAGE } from '../../shared/validators/ctutEmail.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: isValidCtutEmail,
        message: CTUT_EMAIL_MESSAGE,
      },
    },
    password: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    studentId: { type: String, sparse: true, unique: true },
    department: { type: String },
    faculty: { type: String },
    phone: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ROLE_LIST, required: true, default: 'student' },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    rememberSession: { type: Boolean, default: false, select: false },
    lastLoginAt: { type: Date },
    khoaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Khoa', default: null },
    boMonId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoMon', default: null },
    lopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lop', default: null },
    sinhVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'SinhVien', default: null },
    giangVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'GiangVien', default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ isActive: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
