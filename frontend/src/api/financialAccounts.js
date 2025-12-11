import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/financial-accounts/';

export const getFinancialAccounts = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching financial accounts:", error);
        throw error;
    }
};

export const createFinancialAccount = async (accountData) => {
    try {
        const response = await axios.post(API_URL, accountData);
        return response.data;
    } catch (error) {
        console.error("Error creating financial account:", error);
        throw error;
    }
};

export const updateFinancialAccount = async (accountId, accountData) => {
    try {
        const response = await axios.put(`${API_URL}${accountId}`, accountData);
        return response.data;
    } catch (error) {
        console.error("Error updating financial account:", error);
        throw error;
    }
};

export const deleteFinancialAccount = async (accountId) => {
    try {
        const response = await axios.delete(`${API_URL}${accountId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting financial account:", error);
        throw error;
    }
};
