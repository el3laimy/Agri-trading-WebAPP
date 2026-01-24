import apiClient from './client';

export const getDailyPrices = async (cropId = null, startDate = null, endDate = null) => {
    const params = {};
    if (cropId) params.crop_id = cropId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await apiClient.get('/daily-prices', { params });
    return response.data;
};

export const createDailyPrice = async (data) => {
    const response = await apiClient.post('/daily-prices', data);
    return response.data;
};
