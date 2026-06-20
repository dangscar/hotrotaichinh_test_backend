import * as userRepository from './user.repository.js';
import { hashPassword } from '../../shared/utils/hashPassword.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { assertCtutEmail } from '../../shared/validators/ctutEmail.js';

export const getAll = async (query, pagination) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { department: { $regex: query.search, $options: 'i' } },
      { faculty: { $regex: query.search, $options: 'i' } },
      { studentId: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.isActive !== undefined && query.isActive !== '') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const [data, total] = await Promise.all([
    userRepository.findAll(filter, pagination),
    userRepository.count(filter),
  ]);

  return { data, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
};

export const getById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const create = async (data) => {
  assertCtutEmail(data.email);
  const hashedPassword = await hashPassword(data.password);
  return userRepository.create({ ...data, password: hashedPassword });
};

export const update = async (id, data) => {
  if (data.password) {
    data.password = await hashPassword(data.password);
  }
  const user = await userRepository.update(id, data);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateStatus = async (id, isActive) => {
  const user = await userRepository.update(id, { isActive });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const remove = async (id) => {
  const user = await userRepository.remove(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

