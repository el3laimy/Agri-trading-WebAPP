import axios from 'axios';

const API_URL = '/api/v1/treasury';

export const getTreasurySummary = async (date) => {
    const response = await axios.get(`${API_URL}/summary`, {
        params: { target_date: date }
    });
    return response.data;
};

export const getTreasuryTransactions = async (date, limit = 100) => {
    const response = await axios.get(`${API_URL}/transactions`, {
        params: { target_date: date, limit }
    });
    return response.data;
};

export const createCashReceipt = async (receiptData) => {
    const response = await axios.post(`${API_URL}/cash-receipt`, receiptData);
    return response.data;
};

export const createCashPayment = async (paymentData) => {
    const response = await axios.post(`${API_URL}/cash-payment`, paymentData);
    return response.data;
};

export const createQuickExpense = async (data) => {
    const response = await axios.post(`${API_URL}/quick-expense`, data);
    return response.data;
};

export const updateCashReceipt = async (id, data) => {
    const response = await axios.put(`${API_URL}/cash-receipt/${id}`, data);
    return response.data;
};

export const updateCashPayment = async (id, data) => {
    const response = await axios.put(`${API_URL}/cash-payment/${id}`, data);
    return response.data;
};

export const updateQuickExpense = async (id, data) => {
    const response = await axios.put(`${API_URL}/quick-expense/${id}`, data);
    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
