import * as userService from './user.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { parsePagination } from '../../shared/utils/pagination.js';

export const getAll = async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await userService.getAll(req.query, pagination);
  return successResponse(res, result.data, 'Success', HTTP_STATUS.OK, result.meta);
};

export const getById = async (req, res) => {
  const user = await userService.getById(req.params.id);
  return successResponse(res, user);
};

export const create = async (req, res) => {
  const user = await userService.create(req.body);
  return successResponse(res, user, 'User created', HTTP_STATUS.CREATED);
};

export const update = async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  return successResponse(res, user, 'User updated');
};

export const updateStatus = async (req, res) => {
  const user = await userService.updateStatus(req.params.id, req.body.isActive);
  return successResponse(res, user, 'Status updated');
};

export const remove = async (req, res) => {
  const user = await userService.remove(req.params.id);
  return successResponse(res, user, 'User soft-deleted successfully');
};

