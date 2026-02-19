import apiClient from './client';

const API_URL = '/reports';

export const getGeneralLedger = async (startDate = null, endDate = null, accountId = null) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (accountId) params.account_id = accountId;
    const response = await apiClient.get(`${API_URL}/general-ledger`, { params });
    return response.data;
};

export const getTrialBalance = async (endDate = null) => {
    const params = {};
    if (endDate) params.end_date = endDate;
    const response = await apiClient.get(`${API_URL}/trial-balance`, { params });
    return response.data;
};

export const getDashboardKpis = async () => {
    const response = await apiClient.get(`${API_URL}/dashboard-kpis`);
    return response.data;
};

export const getIncomeStatement = async (startDate, endDate) => {
    const response = await apiClient.get(`${API_URL}/income-statement`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getBalanceSheet = async (endDate) => {
    const response = await apiClient.get(`${API_URL}/balance-sheet`, {
        params: { end_date: endDate }
    });
    return response.data;
};

export const getEquityStatement = async (startDate, endDate) => {
    const response = await apiClient.get(`${API_URL}/equity-statement`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getCapitalDistribution = async (reportDate = null, startDate = null) => {
    const params = {};
    if (reportDate) params.report_date = reportDate;
    if (startDate) params.start_date = startDate;
    const response = await apiClient.get(`${API_URL}/capital-distribution`, { params });
    return response.data;
};

export const getCapitalBreakdown = async () => {
    const response = await apiClient.get(`${API_URL}/capital-breakdown`);
    return response.data;
};

export const getDashboardAlerts = async () => {
    const response = await apiClient.get(`${API_URL}/dashboard-alerts`);
    return response.data;
};

export const getSalesByCrop = async () => {
    const response = await apiClient.get(`${API_URL}/sales-by-crop`);
    return response.data;
};

export const getCashFlowReport = async (startDate, endDate) => {
    const response = await apiClient.get(`${API_URL}/cash-flow`, {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
};

export const getCashFlowDetails = async (startDate, endDate, category = null) => {
    const response = await apiClient.get(`${API_URL}/cash-flow-details`, {
        params: { start_date: startDate, end_date: endDate, category }
    });
    return response.data;
};

// Advanced Reports
export const getCropProfitability = async (seasonId = null) => {
    const params = {};
    if (seasonId) params.season_id = seasonId;
    const response = await apiClient.get(`${API_URL}/crop-profitability`, { params });
    return response.data;
};

export const getTopCustomers = async (limit = 10) => {
    const response = await apiClient.get(`${API_URL}/top-customers`, { params: { limit } });
    return response.data;
};

export const getDebtAnalysis = async () => {
    const response = await apiClient.get(`${API_URL}/debt-analysis`);
    return response.data;
};

// Dashboard Enhanced APIs

export const getRecentActivities = async (limit = 10) => {
    const response = await apiClient.get(`${API_URL}/dashboard/recent-activities`, { params: { limit } });
    return response.data;
};

export const getSeasonSummary = async () => {
    const response = await apiClient.get(`${API_URL}/dashboard/season-summary`);
    return response.data;
};

export const getAdvancedChartData = async (params) => {
    const response = await apiClient.get(`${API_URL}/dashboard/advanced-chart`, { params });
    return response.data;
};

// Balance Check - التحقق من توازن النظام المحاسبي
export const getBalanceCheck = async () => {
    const response = await apiClient.get(`${API_URL}/balance-check`);
    return response.data;
};
