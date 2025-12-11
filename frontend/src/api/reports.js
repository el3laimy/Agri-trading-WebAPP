import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/reports';

export const getGeneralLedger = async () => {
    const response = await axios.get(`${API_URL}/general-ledger`);
    return response.data;
};

export const getTrialBalance = async () => {
    const response = await axios.get(`${API_URL}/trial-balance`);
    return response.data;
};

export const getDashboardKpis = async () => {
    const response = await axios.get(`${API_URL}/dashboard-kpis`);
    return response.data;
};

export const getIncomeStatement = async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/income-statement`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getBalanceSheet = async (endDate) => {
    const response = await axios.get(`${API_URL}/balance-sheet`, {
        params: { end_date: endDate }
    });
    return response.data;
};

export const getEquityStatement = async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/equity-statement`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getCapitalDistribution = async (reportDate = null, startDate = null) => {
    const params = {};
    if (reportDate) params.report_date = reportDate;
    if (startDate) params.start_date = startDate;
    const response = await axios.get(`${API_URL}/capital-distribution`, { params });
    return response.data;
};

export const getCapitalBreakdown = async () => {
    const response = await axios.get(`${API_URL}/capital-breakdown`);
    return response.data;
};

export const getDashboardAlerts = async () => {
    const response = await axios.get(`${API_URL}/dashboard-alerts`);
    return response.data;
};

export const getSalesByCrop = async () => {
    const response = await axios.get(`${API_URL}/sales-by-crop`);
    return response.data;
};

export const getCashFlowReport = async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/cash-flow`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getCashFlowDetails = async (startDate, endDate, category = null) => {
    const response = await axios.get(`${API_URL}/cash-flow-details`, {
        params: { start_date: startDate, end_date: endDate, category }
    });
    return response.data;
};

