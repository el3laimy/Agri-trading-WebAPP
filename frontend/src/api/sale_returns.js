import axios from 'axios';

const API_URL = '/api/v1';

export const getSaleReturns = async () => {
    const response = await axios.get(`${API_URL}/sale-returns`);
    return response.data;
};

export const createSaleReturn = async (data) => {
    const response = await axios.post(`${API_URL}/sale-returns`, data);
    return response.data;
};
