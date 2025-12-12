import axios from 'axios';
const API_BASE_URL = '/api/v1';

// Contracts
export const getContracts = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
        if (filters.status) params.append('status', filters.status);

        const response = await axios.get(`${API_BASE_URL}/contracts/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching contracts:", error);
        throw error;
    }
};

export const createContract = async (contractData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/contracts/`, contractData);
        return response.data;
    } catch (error) {
        console.error("Error creating contract:", error);
        throw error;
    }
};

export const updateContractStatus = async (contractId, status) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/contracts/${contractId}?status=${status}`);
        return response.data;
    } catch (error) {
        console.error("Error updating contract status:", error);
        throw error;
    }
};

// Ratings
export const getSupplierRatings = async (supplierId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/contracts/ratings/${supplierId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching ratings:", error);
        throw error;
    }
};

export const createRating = async (ratingData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/contracts/ratings/`, ratingData);
        return response.data;
    } catch (error) {
        console.error("Error creating rating:", error);
        throw error;
    }
};
