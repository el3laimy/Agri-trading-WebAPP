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
