import apiClient from './client';
import { CashReceiptSchema, CashPaymentSchema, QuickExpenseSchema } from '../schemas/treasury';

const API_URL = '/treasury';

export const getTreasurySummary = async (date) => {
    const response = await apiClient.get(`${API_URL}/summary`, {
        params: { target_date: date }
    });
    return response.data;
};

export const getTreasuryTransactions = async (date, limit = 100) => {
    const response = await apiClient.get(`${API_URL}/transactions`, {
        params: { target_date: date, limit }
    });
    return response.data;
};

export const createCashReceipt = async (receiptData) => {
    const validatedData = CashReceiptSchema.parse(receiptData);
    const response = await apiClient.post(`${API_URL}/cash-receipt`, validatedData);
    return response.data;
};

export const createCashPayment = async (paymentData) => {
    const validatedData = CashPaymentSchema.parse(paymentData);
    const response = await apiClient.post(`${API_URL}/cash-payment`, validatedData);
    return response.data;
};

export const createQuickExpense = async (data) => {
    const validatedData = QuickExpenseSchema.parse(data);
    const response = await apiClient.post(`${API_URL}/quick-expense`, validatedData);
    return response.data;
};

export const updateCashReceipt = async (id, data) => {
    const validatedData = CashReceiptSchema.partial().parse(data);
    const response = await apiClient.put(`${API_URL}/cash-receipt/${id}`, validatedData);
    return response.data;
};

export const updateCashPayment = async (id, data) => {
    const validatedData = CashPaymentSchema.partial().parse(data);
    const response = await apiClient.put(`${API_URL}/cash-payment/${id}`, validatedData);
    return response.data;
};

export const updateQuickExpense = async (id, data) => {
    const validatedData = QuickExpenseSchema.partial().parse(data);
    const response = await apiClient.put(`${API_URL}/quick-expense/${id}`, validatedData);
    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
};
