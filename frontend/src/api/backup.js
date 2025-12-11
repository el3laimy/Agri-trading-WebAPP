import axios from 'axios';

const API_URL = '/api/v1/backup';

// إنشاء نسخة احتياطية
export const createBackup = async (token) => {
    const response = await axios.post(`${API_URL}/create`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// الحصول على قائمة النسخ الاحتياطية
export const getBackups = async (token) => {
    const response = await axios.get(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// استعادة نسخة احتياطية
export const restoreBackup = async (token, filename) => {
    const response = await axios.post(`${API_URL}/restore/${filename}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// حذف نسخة احتياطية
export const deleteBackup = async (token, filename) => {
    const response = await axios.delete(`${API_URL}/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// تحميل ملف النسخة (يتم التعامل معه كرابط مباشر)
export const getDownloadUrl = (filename) => {
    return `${API_URL}/download/${filename}`;
};

// رفع ملف نسخة احتياطية
export const uploadBackup = async (token, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
