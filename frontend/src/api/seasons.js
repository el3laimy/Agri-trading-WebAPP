import apiClient from './client';

export const getSeasons = async () => {
    const response = await apiClient.get('/seasons');
    return response.data;
};

export const getSeason = async (id) => {
    const response = await apiClient.get(`/seasons/${id}`);
    return response.data;
};

export const createSeason = async (data) => {
    const response = await apiClient.post('/seasons', data);
    return response.data;
};

export const updateSeason = async (id, data) => {
    const response = await apiClient.put(`/seasons/${id}`, data);
    return response.data;
};

export const deleteSeason = async (id) => {
    const response = await apiClient.delete(`/seasons/${id}`);
    return response.data;
};

export const activateSeason = async (id) => {
    const response = await apiClient.post(`/seasons/${id}/activate`);
    return response.data;
};
