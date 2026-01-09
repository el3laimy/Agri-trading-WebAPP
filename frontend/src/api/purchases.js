import axios from 'axios';

const API_URL = '/api/v1/purchases/';

/**
 * دالة لجلب قائمة المشتريات من الخادم
 * @returns {Promise<Array>} قائمة بالمشتريات مع تفاصيل المحصول والمورد
 */
export const getPurchases = async () => {
    try {
        const response = await axios.get(API_URL);
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
        const response = await axios.post(API_URL, purchaseData);
        return response.data;
    } catch (error) {
        console.error("Error creating purchase:", error);
        throw error;
    }
};

export const updatePurchase = async (purchaseId, purchaseData) => {
    try {
        const response = await axios.put(`${API_URL}${purchaseId}`, purchaseData);
        return response.data;
    } catch (error) {
        console.error("Error updating purchase:", error);
        throw error;
    }
};

export const deletePurchase = async (purchaseId) => {
    try {
        const response = await axios.delete(`${API_URL}${purchaseId}`);
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
        const response = await axios.get(`${API_URL}last-price/${cropId}/${supplierId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching last price:", error);
        return { unit_price: null, purchase_date: null, quantity_kg: null };
    }
};
