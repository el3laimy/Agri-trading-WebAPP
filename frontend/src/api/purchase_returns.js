import apiClient from './client';

export const getPurchaseReturns = async () => {
    const response = await apiClient.get('/purchase-returns');
    return response.data;
};

export const createPurchaseReturn = async (data) => {
    const response = await apiClient.post('/purchase-returns', data);
    return response.data;
};
