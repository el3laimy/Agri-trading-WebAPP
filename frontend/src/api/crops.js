import apiClient from './client';

const API_URL = '/crops/';

export const getCrops = async () => {
    try {
        const response = await apiClient.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching crops:", error);
        throw error;
    }
};

export const createCrop = async (cropData) => {
    try {
        const response = await apiClient.post(API_URL, cropData);
        return response.data;
    } catch (error) {
        console.error("Error creating crop:", error);
        throw error;
    }
};

export const updateCrop = async (cropId, cropData) => {
    if (!cropId) throw new Error('Crop ID is required');
    try {
        const response = await apiClient.put(`${API_URL}${cropId}`, cropData);
        return response.data;
    } catch (error) {
        console.error("Error updating crop:", error);
        throw error;
    }
};

export const deleteCrop = async (cropId) => {
    if (!cropId) throw new Error('Crop ID is required');
    try {
        const response = await apiClient.delete(`${API_URL}${cropId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting crop:", error);
        throw error;
    }
};

export const migrateAndDeleteCrop = async (cropId, targetCropId) => {
    if (!cropId) throw new Error('Crop ID is required');
    if (!targetCropId) throw new Error('Target Crop ID is required');
    try {
        // We match schemas.CropMigrationRequest on backend: { target_crop_id: int }
        const response = await apiClient.post(`${API_URL}${cropId}/migrate-and-delete`, {
            target_crop_id: targetCropId
        });
        return response.data;
    } catch (error) {
        console.error("Error migrating crop:", error);
        throw error;
    }
};

export const forceDeleteCrop = async (cropId) => {
    if (!cropId) throw new Error('Crop ID is required');
    try {
        const response = await apiClient.delete(`${API_URL}${cropId}/force`);
        return response.data;
    } catch (error) {
        console.error("Error force deleting crop:", error);
        throw error;
    }
};
