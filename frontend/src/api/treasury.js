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

export const createQuickExpense = async (expenseData) => {
    const response = await axios.post(`${API_URL}/quick-expense`, expenseData);
    return response.data;
};

