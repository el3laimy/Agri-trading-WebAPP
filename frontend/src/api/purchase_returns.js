import axios from 'axios';

const API_URL = '/api/v1';

export const getPurchaseReturns = async () => {
    const response = await axios.get(`${API_URL}/purchase-returns`);
    return response.data;
};

export const createPurchaseReturn = async (data) => {
    const response = await axios.post(`${API_URL}/purchase-returns`, data);
    return response.data;
};
