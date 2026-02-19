import apiClient from './client';

export const createManualEntry = async (entryData) => {
    const response = await apiClient.post('/journal-entries/manual', entryData);
    return response.data;
};
