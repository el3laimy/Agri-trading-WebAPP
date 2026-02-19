import apiClient from './client';

export const getInventory = async () => {
    const response = await apiClient.get('/inventory/');
    return response.data;
};

export const getInventoryAdjustments = async () => {
    const response = await apiClient.get('/inventory/adjustments');
    return response.data;
};

export const createInventoryAdjustment = async (data) => {
    const response = await apiClient.post('/inventory/adjustments', data);
    return response.data;
};

export const getCropBatches = async (cropId) => {
    const response = await apiClient.get(`/inventory/${cropId}/batches`);
    return response.data;
};

export const deleteInventoryAdjustment = async (adjustmentId) => {
    const response = await apiClient.delete(`/inventory/adjustments/${adjustmentId}`);
    return response.data;
};
