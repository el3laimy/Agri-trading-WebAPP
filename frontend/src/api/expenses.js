import apiClient from './client';

const API_URL = '/expenses/';

export const getExpenses = async () => {
    try {
        const response = await apiClient.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
    }
};

export const createExpense = async (expenseData) => {
    try {
        const response = await apiClient.post(API_URL, expenseData);
        return response.data;
    } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
    }
};

export const updateExpense = async (expenseId, expenseData) => {
    try {
        const response = await apiClient.put(`${API_URL}${expenseId}`, expenseData);
        return response.data;
    } catch (error) {
        console.error("Error updating expense:", error);
        throw error;
    }
};

export const deleteExpense = async (expenseId) => {
    try {
        const response = await apiClient.delete(`${API_URL}${expenseId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
    }
};
