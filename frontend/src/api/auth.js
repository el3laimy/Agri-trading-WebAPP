import apiClient from './client';

const API_URL = '/auth';

/**
 * تسجيل الدخول
 * Note: Login uses x-www-form-urlencoded format as required by OAuth2PasswordRequestForm
 */
export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post(`${API_URL}/login`, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
};

/**
 * تسجيل الخروج
 */
export const logout = async () => {
    const response = await apiClient.post(`${API_URL}/logout`, {});
    return response.data;
};

/**
 * الحصول على بيانات المستخدم الحالي
 */
export const getCurrentUser = async () => {
    const response = await apiClient.get(`${API_URL}/me`);
    return response.data;
};

/**
 * تغيير كلمة المرور
 */
export const changePassword = async (currentPassword, newPassword) => {
    const response = await apiClient.post(`${API_URL}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
    });
    return response.data;
};

/**
 * الحصول على قائمة المستخدمين
 */
export const getUsers = async () => {
    const response = await apiClient.get(`${API_URL}/users`);
    return response.data;
};

/**
 * إنشاء مستخدم جديد
 */
export const createUser = async (userData) => {
    const response = await apiClient.post(`${API_URL}/users`, userData);
    return response.data;
};

/**
 * تحديث مستخدم
 */
export const updateUser = async (userId, userData) => {
    const response = await apiClient.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
};

/**
 * الحصول على الأدوار
 */
export const getRoles = async () => {
    const response = await apiClient.get(`${API_URL}/roles`);
    return response.data;
};

/**
 * تحديث إعدادات لوحة التحكم
 */
export const updateDashboardConfig = async (config) => {
    const response = await apiClient.put(`${API_URL}/me/config`, {
        dashboard_config: typeof config === 'string' ? config : JSON.stringify(config)
    });
    return response.data;
};
