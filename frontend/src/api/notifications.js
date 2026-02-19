import apiClient from './client';

const API_URL = '/notifications';

export const getNotifications = async (unreadOnly = false) => {
    const response = await apiClient.get(`${API_URL}/`, {
        params: { unread_only: unreadOnly }
    });
    return response.data;
};

export const getUnreadCount = async () => {
    const response = await apiClient.get(`${API_URL}/count`);
    return response.data;
};

export const markAsRead = async (notificationId) => {
    const response = await apiClient.put(`${API_URL}/${notificationId}/read`, {});
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await apiClient.put(`${API_URL}/read-all`, {});
    return response.data;
};

export const checkAlerts = async () => {
    const response = await apiClient.post(`${API_URL}/check`, {});
    return response.data;
};
