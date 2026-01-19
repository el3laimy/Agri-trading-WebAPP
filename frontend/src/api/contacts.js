import axios from 'axios';

const API_URL = '/api/v1/contacts/';

export const getContacts = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
    }
};

export const createContact = async (contactData) => {
    try {
        const response = await axios.post(API_URL, contactData);
        return response.data;
    } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
    }
};

export const updateContact = async (contactId, contactData) => {
    try {
        const response = await axios.put(`${API_URL}${contactId}`, contactData);
        return response.data;
    } catch (error) {
        console.error("Error updating contact:", error);
        throw error;
    }
};

export const deleteContact = async (contactId) => {
    try {
        const response = await axios.delete(`${API_URL}${contactId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting contact:", error);
        throw error;
    }
};

// --- كشوفات الحسابات ---

export const getContactSummary = async (contactId) => {
    try {
        const response = await axios.get(`${API_URL}${contactId}/summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching contact summary:", error);
        throw error;
    }
};

export const getContactStatement = async (contactId, startDate = null, endDate = null) => {
    try {
        let url = `${API_URL}${contactId}/statement`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching contact statement:", error);
        throw error;
    }
};

export const getCustomersBalances = async () => {
    try {
        const response = await axios.get(`${API_URL}customers/balances`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customers balances:", error);
        throw error;
    }
};

export const getSuppliersBalances = async () => {
    try {
        const response = await axios.get(`${API_URL}suppliers/balances`);
        return response.data;
    } catch (error) {
        console.error("Error fetching suppliers balances:", error);
        throw error;
    }
};

// --- حذف جهات التعامل المرتبطة بعمليات ---

export const migrateAndDeleteContact = async (contactId, targetContactId) => {
    try {
        const response = await axios.post(`${API_URL}${contactId}/migrate-and-delete`, {
            target_contact_id: targetContactId
        });
        return response.data;
    } catch (error) {
        console.error("Error migrating and deleting contact:", error);
        throw error;
    }
};

export const forceDeleteContact = async (contactId) => {
    try {
        const response = await axios.delete(`${API_URL}${contactId}/force`);
        return response.data;
    } catch (error) {
        console.error("Error force deleting contact:", error);
        throw error;
    }
};

