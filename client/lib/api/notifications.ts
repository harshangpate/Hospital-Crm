import apiClient from '../api-client';

export interface Notification {
  id: string;
  type: 'appointment' | 'alert' | 'info' | 'success' | 'lab_result' | 'prescription' | 'billing' | 'inventory';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Get user notifications
export const getNotifications = async (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

  return apiClient.get<{ data: NotificationsResponse }>(`/notifications?${queryParams.toString()}`);
};

// Mark notification as read
export const markNotificationAsRead = async (id: string) => {
  return apiClient.put(`/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  return apiClient.put('/notifications/read-all');
};

// Delete notification
export const deleteNotification = async (id: string) => {
  return apiClient.delete(`/notifications/${id}`);
};

// Get notification preferences
export const getNotificationPreferences = async () => {
  return apiClient.get('/notifications/preferences');
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences: Record<string, boolean>) => {
  return apiClient.put('/notifications/preferences', preferences);
};
