import crypto from 'crypto';
import config from '../../config/index.js';
import * as authRepository from './auth.repository.js';
import PasswordReset from './passwordReset.model.js';
import User from '../users/user.model.js';
import { comparePassword, hashPassword } from '../../shared/utils/hashPassword.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/generateToken.js';
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../../shared/errors/AppError.js';
import { ROLE_PERMISSIONS } from '../../config/roles.js';
import { assertCtutEmail } from '../../shared/validators/ctutEmail.js';
import { sendPasswordResetEmail } from '../../shared/services/emailService.js';

const isValidEmailFormat = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const GENERIC_FORGOT_MESSAGE =
  'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.';

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const formatUser = (user) => ({
  _id: user._id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  permissions: ROLE_PERMISSIONS[user.role] || [],
  studentId: user.studentId,
  department: user.department,
  faculty: user.faculty,
});

export const login = async ({ email, password, rememberMe = false }) => {
  assertCtutEmail(email);

  const user = await authRepository.findByEmail(email);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshExpiresIn = rememberMe
    ? config.jwt.refreshExpiresIn
    : config.jwt.sessionRefreshExpiresIn;
  const refreshToken = generateRefreshToken(payload, refreshExpiresIn);

  await authRepository.updateRefreshToken(user._id, refreshToken, rememberMe);
  await authRepository.updateLastLogin(user._id);

  return {
    user: formatUser(user),
    accessToken,
    refreshToken,
    rememberMe,
  };
};

export const refreshToken = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user = await authRepository.findByIdWithSession(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const refreshExpiresIn = user.rememberSession
    ? config.jwt.refreshExpiresIn
    : config.jwt.sessionRefreshExpiresIn;
  const newRefreshToken = generateRefreshToken(payload, refreshExpiresIn);
  await authRepository.updateRefreshToken(user._id, newRefreshToken, user.rememberSession);

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId) => {
  await authRepository.updateRefreshToken(userId, null, false);
};

export const getMe = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) throw new UnauthorizedError('User not found');
  return formatUser(user);
};

export const forgotPassword = async ({ accountEmail, recipientEmail }) => {
  if (!isValidEmailFormat(accountEmail)) {
    throw new ValidationError('Email tài khoản không đúng định dạng');
  }
  if (!isValidEmailFormat(recipientEmail)) {
    throw new ValidationError('Email nhận liên kết không đúng định dạng');
  }

  const normalizedAccountEmail = accountEmail.toLowerCase().trim();
  const normalizedRecipientEmail = recipientEmail.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedAccountEmail, isActive: true });

  await PasswordReset.updateMany(
    { accountEmail: normalizedAccountEmail, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await PasswordReset.create({
    userId: user?._id ?? null,
    accountEmail: normalizedAccountEmail,
    recipientEmail: normalizedRecipientEmail,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const resetUrl = `${config.clientUrl}/auth/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail({
      to: normalizedRecipientEmail,
      resetUrl,
      fullName: user?.fullName ?? 'Bạn',
    });
  } catch (err) {
    throw new ValidationError(err.message || 'Không gửi được email qua Gmail');
  }

  return { message: GENERIC_FORGOT_MESSAGE };
};

export const verifyResetToken = async (token) => {
  if (!token) throw new ValidationError('Token không hợp lệ');

  const record = await PasswordReset.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new NotFoundError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  if (!record.userId) {
    throw new NotFoundError('Không tìm thấy tài khoản liên kết với email đăng nhập');
  }

  return { valid: true, accountEmail: record.accountEmail };
};

export const resetPassword = async ({ token, password }) => {
  if (!token) throw new ValidationError('Token không hợp lệ');
  if (!password || password.length < 6) {
    throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự');
  }

  const record = await PasswordReset.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new NotFoundError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  if (!record.userId) {
    throw new NotFoundError('Không tìm thấy tài khoản liên kết với yêu cầu này');
  }

  const hashedPassword = await hashPassword(password);
  await User.findByIdAndUpdate(record.userId, {
    password: hashedPassword,
    refreshToken: null,
    rememberSession: false,
  });

  record.usedAt = new Date();
  await record.save();

  return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
};
