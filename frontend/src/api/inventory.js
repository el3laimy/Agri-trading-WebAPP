import axios from 'axios';

const API_BASE_URL = '/api/v1';

const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getInventory = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/inventory/`, getAuthHeader(token));
    return response.data;
};

export const getInventoryAdjustments = async (token) => {
    const response = await axios.get(`${API_BASE_URL}/inventory/adjustments`, getAuthHeader(token));
    return response.data;
};

export const createInventoryAdjustment = async (token, data) => {
    const response = await axios.post(`${API_BASE_URL}/inventory/adjustments`, data, getAuthHeader(token));
    return response.data;
};

export const getCropBatches = async (token, cropId) => {
    const response = await axios.get(`${API_BASE_URL}/inventory/${cropId}/batches`, getAuthHeader(token));
    return response.data;
};
