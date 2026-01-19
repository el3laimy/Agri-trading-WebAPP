import axios from 'axios';
import { CashReceiptSchema, CashPaymentSchema, QuickExpenseSchema } from '../schemas/treasury';

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
    const validatedData = CashReceiptSchema.parse(receiptData);
    const response = await axios.post(`${API_URL}/cash-receipt`, validatedData);
    return response.data;
};

export const createCashPayment = async (paymentData) => {
    const validatedData = CashPaymentSchema.parse(paymentData);
    const response = await axios.post(`${API_URL}/cash-payment`, validatedData);
    return response.data;
};

export const createQuickExpense = async (data) => {
    const validatedData = QuickExpenseSchema.parse(data);
    const response = await axios.post(`${API_URL}/quick-expense`, validatedData);
    return response.data;
};

export const updateCashReceipt = async (id, data) => {
    // Partial validation could be used here if needed, or full schema.
    // For update, typically we allow partial updates or full replacement.
    // Assuming full replacement or consistent schema for simplified security.
    // Or we should relax validation for partial updates.
    // Given the destructive test sent HUGE string, we want to validate description/amount.
    // We'll use the schema to validate fields present.
    // Zod's .partial() or .parse on specific fields if data is partial.
    // But destructivetest sends "amount" and "description".
    // Let's assume full validation for safety or use .partial() if standard is PATCH.
    // PUT usually means replace resource, so full schema is appropriate.
    const validatedData = CashReceiptSchema.partial().parse(data);
    const response = await axios.put(`${API_URL}/cash-receipt/${id}`, validatedData);
    return response.data;
};

export const updateCashPayment = async (id, data) => {
    const validatedData = CashPaymentSchema.partial().parse(data);
    const response = await axios.put(`${API_URL}/cash-payment/${id}`, validatedData);
    return response.data;
};

export const updateQuickExpense = async (id, data) => {
    const validatedData = QuickExpenseSchema.partial().parse(data);
    const response = await axios.put(`${API_URL}/quick-expense/${id}`, validatedData);
    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
