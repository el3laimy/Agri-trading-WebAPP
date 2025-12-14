import axios from 'axios';

const API_URL = '/api/v1/capital';

const capitalAPI = {
    /**
     * تسجيل حركة رأس مال جديدة
     * @param {Object} transactionData - { amount, type, description, transaction_date, owner_name }
     */
    createTransaction: async (transactionData) => {
        try {
            const response = await axios.post(`${API_URL}/transaction`, transactionData);
            return response.data;
        } catch (error) {
            console.error('Error creating capital transaction:', error);
            throw error;
        }
    },

    /**
     * جلب سجل حركات رأس المال (اختياري، للعرض المستقبلي)
     */
    getHistory: async () => {
        // This endpoint is not yet implemented in backend service explicitly as a route, 
        // but good to have the placeholder or I can implement it later if needed for reports.
        // For now, we focus on creation.
        return [];
    }
};

export default capitalAPI;
