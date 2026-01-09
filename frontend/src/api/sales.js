import axios from 'axios';

const API_URL = '/api/v1/sales/';

export const getSales = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};

export const createSale = async (saleData) => {
    try {
        const response = await axios.post(API_URL, saleData);
        return response.data;
    } catch (error) {
        console.error("Error creating sale:", error);
        throw error;
    }
};

export const downloadInvoice = async (saleId) => {
    try {
        const response = await axios.get(`${API_URL}${saleId}/invoice`, {
            responseType: 'blob', // Important for handling binary data (PDF)
        });
        return response.data;
    } catch (error) {
        console.error("Error downloading invoice:", error);
        throw error;
    }
};

export const updateSale = async (saleId, saleData) => {
    try {
        const response = await axios.put(`${API_URL}${saleId}`, saleData);
        return response.data;
    } catch (error) {
        console.error("Error updating sale:", error);
        throw error;
    }
};

export const deleteSale = async (saleId) => {
    try {
        const response = await axios.delete(`${API_URL}${saleId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting sale:", error);
        throw error;
    }
};

/**
 * دالة للحصول على آخر سعر بيع لمحصول لعميل معين
 * @param {number} cropId 
 * @param {number} customerId 
 * @returns {Promise<object>}
 */
export const getLastSalePrice = async (cropId, customerId) => {
    try {
        const response = await axios.get(`${API_URL}last-price/${cropId}/${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching last price:", error);
        return { selling_unit_price: null, sale_date: null, quantity_sold_kg: null };
    }
};
