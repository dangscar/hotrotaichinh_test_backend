import { ValidationError } from '../errors/AppError.js';

/** Chấp nhận @ctut.edu hoặc @ctut.edu.vn */
export const CTUT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@ctut\.edu(\.vn)?$/i;

export const CTUT_EMAIL_MESSAGE =
  'Email phải sử dụng đuôi @ctut.edu.vn hoặc @ctut.edu';

export const isValidCtutEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return CTUT_EMAIL_REGEX.test(email.trim());
};

export const assertCtutEmail = (email) => {
  if (!isValidCtutEmail(email)) {
    throw new ValidationError(CTUT_EMAIL_MESSAGE, [
      { field: 'email', message: CTUT_EMAIL_MESSAGE },
    ]);
  }
};
