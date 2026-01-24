import apiClient from './client';

export const getSaleReturns = async () => {
    const response = await apiClient.get('/sale-returns');
    return response.data;
};

export const createSaleReturn = async (data) => {
    const response = await apiClient.post('/sale-returns', data);
    return response.data;
};
