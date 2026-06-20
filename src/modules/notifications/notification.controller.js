import * as notificationService from './notification.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';

export const getAll = async (req, res) => {
  const notifications = await notificationService.getByUser(req.user.id, req.query);
  return successResponse(res, notifications);
};

export const getUnreadCount = async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  return successResponse(res, { count });
};

export const markAsRead = async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  return successResponse(res, null, 'Marked as read');
};

export const markAllAsRead = async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  return successResponse(res, null, 'All marked as read');
};
