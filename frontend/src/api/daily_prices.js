import axios from 'axios';

const API_URL = '/api/v1';

export const getDailyPrices = async (cropId = null, startDate = null, endDate = null) => {
    let url = `${API_URL}/daily-prices?`;
    const params = [];

    if (cropId) params.push(`crop_id=${cropId}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);

    url += params.join('&');

    const response = await axios.get(url);
    return response.data;
};

export const createDailyPrice = async (data) => {
    const response = await axios.post(`${API_URL}/daily-prices`, data);
    return response.data;
};
