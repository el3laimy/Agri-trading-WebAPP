import axios from 'axios';

const API_URL = '/api/v1/auth';

/**
 * تسجيل الدخول
 */
export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/login`, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
};

/**
 * تسجيل الخروج
 */
export const logout = async (token) => {
    const response = await axios.post(`${API_URL}/logout`, {}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-Token': token
        }
    });
    return response.data;
};

/**
 * الحصول على بيانات المستخدم الحالي
 */
export const getCurrentUser = async (token) => {
    const response = await axios.get(`${API_URL}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * تغيير كلمة المرور
 */
export const changePassword = async (token, currentPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
    }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * الحصول على قائمة المستخدمين
 */
export const getUsers = async (token) => {
    const response = await axios.get(`${API_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * إنشاء مستخدم جديد
 */
export const createUser = async (token, userData) => {
    const response = await axios.post(`${API_URL}/users`, userData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * تحديث مستخدم
 */
export const updateUser = async (token, userId, userData) => {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * الحصول على الأدوار
 */
export const getRoles = async (token) => {
    const response = await axios.get(`${API_URL}/roles`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

/**
 * تحديث إعدادات لوحة التحكم
 */
export const updateDashboardConfig = async (token, config) => {
    const response = await axios.put(`${API_URL}/me/config`, {
        dashboard_config: typeof config === 'string' ? config : JSON.stringify(config)
    }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};
