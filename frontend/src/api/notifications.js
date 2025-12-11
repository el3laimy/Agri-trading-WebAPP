import axios from 'axios';

const API_URL = '/api/v1/notifications';

export const getNotifications = async (token, unreadOnly = false) => {
    const response = await axios.get(`${API_URL}/`, {
        params: { unread_only: unreadOnly },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getUnreadCount = async (token) => {
    const response = await axios.get(`${API_URL}/count`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const markAsRead = async (token, notificationId) => {
    const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const markAllAsRead = async (token) => {
    const response = await axios.put(`${API_URL}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const checkAlerts = async (token) => {
    const response = await axios.post(`${API_URL}/check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
