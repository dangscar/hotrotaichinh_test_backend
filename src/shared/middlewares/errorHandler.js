import { AppError } from '../errors/AppError.js';
import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details || []);
  }

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 422, 'VALIDATION_ERROR');
  }

  if (err.code === 11000) {
    return errorResponse(res, 'Duplicate field value', 409, 'DUPLICATE_ERROR');
  }

  console.error('[Error]', err);
  return errorResponse(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};
