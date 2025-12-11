import axios from 'axios';

const API_URL = '/api/v1/sales/';

export const getSales = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};

export const createSale = async (saleData) => {
    try {
        const response = await axios.post(API_URL, saleData);
        return response.data;
    } catch (error) {
        console.error("Error creating sale:", error);
        throw error;
    }
};
