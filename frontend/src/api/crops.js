import axios from 'axios';

const API_URL = '/api/v1/crops/';

export const getCrops = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching crops:", error);
        throw error;
    }
};

export const createCrop = async (cropData) => {
    try {
        const response = await axios.post(API_URL, cropData);
        return response.data;
    } catch (error) {
        console.error("Error creating crop:", error);
        throw error;
    }
};

export const updateCrop = async (cropId, cropData) => {
    try {
        const response = await axios.put(`${API_URL}${cropId}`, cropData);
        return response.data;
    } catch (error) {
        console.error("Error updating crop:", error);
        throw error;
    }
};

export const deleteCrop = async (cropId) => {
    try {
        const response = await axios.delete(`${API_URL}${cropId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting crop:", error);
        throw error;
    }
};
