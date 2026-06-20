import User from './user.model.js';

export const findAll = (filter, { skip, limit }) =>
  User.find(filter).select('-password -refreshToken').skip(skip).limit(limit).sort({ createdAt: -1 });

export const count = (filter) => User.countDocuments(filter);

export const findById = (id) => User.findById(id).select('-password -refreshToken');

export const create = (data) => User.create(data);

export const update = (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true }).select('-password -refreshToken');

export const remove = (id) => User.findByIdAndUpdate(id, { isActive: false }, { new: true });
