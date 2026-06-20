import Notification from './notification.model.js';
import { sendEmailNotification } from './channels/emailChannel.js';

export const getByUser = (userId, query = {}) => {
  const filter = { recipientId: userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
};

export const getUnreadCount = (userId) =>
  Notification.countDocuments({ recipientId: userId, isRead: false });

export const markAsRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { isRead: true, readAt: new Date() },
  );

export const markAllAsRead = (userId) =>
  Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

export const create = async (data) => {
  const notification = await Notification.create(data);
  if (data.channels?.includes('email')) {
    await sendEmailNotification(notification);
  }
  return notification;
};
