import axios from 'axios';

const API_URL = '/api/v1/journal-entries';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const createManualEntry = async (entryData) => {
    const response = await axios.post(`${API_URL}/manual`, entryData, {
        headers: getAuthHeaders()
    });
    return response.data;
};
