import apiClient from './client';
import { PurchaseSchema, BasePurchaseSchema } from '../schemas/purchases';
import { idSchema } from '../schemas/common';

const API_URL = '/purchases/';

/**
 * دالة لجلب قائمة المشتريات من الخادم
 * @returns {Promise<Array>} قائمة بالمشتريات مع تفاصيل المحصول والمورد
 */
export const getPurchases = async () => {
    try {
        const response = await apiClient.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
    }
};

/**
 * دالة لإنشاء عملية شراء جديدة في الخادم
 * @param {object} purchaseData - بيانات عملية الشراء الجديدة
 * @returns {Promise<object>} عملية الشراء التي تم إنشاؤها
 */
export const createPurchase = async (purchaseData) => {
    try {
        const validatedData = PurchaseSchema.parse(purchaseData);
        const response = await apiClient.post(API_URL, validatedData);
        return response.data;
    } catch (error) {
        console.error("Error creating purchase:", error);
        throw error;
    }
};

export const updatePurchase = async (purchaseId, purchaseData) => {
    try {
        const validatedData = BasePurchaseSchema.partial().parse(purchaseData);
        const response = await apiClient.put(`${API_URL}${purchaseId}`, validatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating purchase:", error);
        throw error;
    }
};

export const deletePurchase = async (purchaseId) => {
    try {
        const response = await apiClient.delete(`${API_URL}${purchaseId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting purchase:", error);
        throw error;
    }
};

/**
 * دالة للحصول على آخر سعر شراء لمحصول من مورد معين
 * تستخدم لتعبئة السعر الافتراضي في النموذج
 * @param {number} cropId - معرف المحصول
 * @param {number} supplierId - معرف المورد
 * @returns {Promise<object>} - { unit_price, purchase_date, quantity_kg }
 */
export const getLastPurchasePrice = async (cropId, supplierId) => {
    try {
        // Validate IDs
        idSchema.parse(cropId);
        idSchema.parse(supplierId);

        const response = await apiClient.get(`${API_URL}last-price/${cropId}/${supplierId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching last price:", error);
        return { unit_price: null, purchase_date: null, quantity_kg: null };
    }
};
