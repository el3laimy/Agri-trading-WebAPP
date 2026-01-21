import axios from 'axios';

const API_BASE = '/api/v1/transformations';

/**
 * قائمة عمليات التحويل
 */
export const getTransformations = async () => {
    const response = await axios.get(API_BASE);
    return response.data;
};

/**
 * الحصول على عملية تحويل واحدة
 */
export const getTransformation = async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
};

/**
 * إنشاء عملية تحويل جديدة
 * @param {Object} data - بيانات التحويل
 * @param {number} data.source_crop_id - معرف المحصول المصدر
 * @param {number} data.source_quantity_kg - الكمية بالكيلو
 * @param {number} data.processing_cost - مصاريف التحويل
 * @param {string} data.transformation_date - تاريخ التحويل
 * @param {Array} data.outputs - المخرجات
 */
export const createTransformation = async (data) => {
    const response = await axios.post(API_BASE, data);
    return response.data;
};

/**
 * حذف عملية تحويل
 */
export const deleteTransformation = async (id) => {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
};
