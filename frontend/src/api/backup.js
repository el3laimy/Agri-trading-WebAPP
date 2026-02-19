import apiClient from './client';

const API_URL = '/backup';

// إنشاء نسخة احتياطية
export const createBackup = async () => {
    const response = await apiClient.post(`${API_URL}/create`, {});
    return response.data;
};

// الحصول على قائمة النسخ الاحتياطية
export const getBackups = async () => {
    const response = await apiClient.get(`${API_URL}/`);
    return response.data;
};

// استعادة نسخة احتياطية
export const restoreBackup = async (filename) => {
    const response = await apiClient.post(`${API_URL}/restore/${filename}`, {});
    return response.data;
};

// حذف نسخة احتياطية
export const deleteBackup = async (filename) => {
    const response = await apiClient.delete(`${API_URL}/${filename}`);
    return response.data;
};

// تحميل ملف النسخة (يتم التعامل معه كرابط مباشر)
export const getDownloadUrl = (filename) => {
    return `/api/v1${API_URL}/download/${filename}`;
};

// رفع ملف نسخة احتياطية
export const uploadBackup = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
