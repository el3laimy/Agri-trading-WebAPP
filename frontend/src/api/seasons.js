import axios from 'axios';

const API_URL = '/api/v1';

export const getSeasons = async () => {
    const response = await axios.get(`${API_URL}/seasons`);
    return response.data;
};

export const getSeason = async (id) => {
    const response = await axios.get(`${API_URL}/seasons/${id}`);
    return response.data;
};

export const createSeason = async (data) => {
    const response = await axios.post(`${API_URL}/seasons`, data);
    return response.data;
};

export const updateSeason = async (id, data) => {
    const response = await axios.put(`${API_URL}/seasons/${id}`, data);
    return response.data;
};

export const deleteSeason = async (id) => {
    const response = await axios.delete(`${API_URL}/seasons/${id}`);
    return response.data;
};
