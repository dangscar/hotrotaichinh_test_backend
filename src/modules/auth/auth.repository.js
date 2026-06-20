import User from '../users/user.model.js';

export const findByEmail = (email) => User.findOne({ email }).select('+password');

export const findById = (id) => User.findById(id);

export const findByIdWithSession = (id) =>
  User.findById(id).select('+refreshToken +rememberSession');

export const updateRefreshToken = (userId, refreshToken, rememberSession = false) =>
  User.findByIdAndUpdate(userId, { refreshToken, rememberSession }, { new: true });

export const updateLastLogin = (userId) =>
  User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true });
