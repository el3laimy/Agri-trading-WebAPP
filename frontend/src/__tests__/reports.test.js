/**
 * Reports API Tests
 * 
 * Tests for reports.js - Financial, Dashboard, and Analytical Reports
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from reports.js
import {
    getGeneralLedger,
    getTrialBalance,
    getDashboardKpis,
    getIncomeStatement,
    getBalanceSheet,
    getEquityStatement,
    getCapitalDistribution,
    getCapitalBreakdown,
    getDashboardAlerts,
    getSalesByCrop,
    getCashFlowReport,
    getCashFlowDetails,
    getCropProfitability,
    getTopCustomers,
    getDebtAnalysis,
    getRecentActivities,
    getSeasonSummary,
    getAdvancedChartData,
    getBalanceCheck
} from '../api/reports';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// Financial Statements Tests
// =============================================================================

describe('Financial Statements', () => {

    test('getGeneralLedger should fetch data successfully', async () => {
        const mockData = { entries: [], total_debit: 0, total_credit: 0 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getGeneralLedger();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/general-ledger');
    });

    test('getTrialBalance should fetch data successfully', async () => {
        const mockData = { accounts: [], total_debit: 100, total_credit: 100 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getTrialBalance();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/trial-balance');
    });

    test('getIncomeStatement should fetch with date range', async () => {
        const mockData = { revenue: 5000, expenses: 2000, net_profit: 3000 };
        axios.get.mockResolvedValue({ data: mockData });

        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        const result = await getIncomeStatement(startDate, endDate);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/income-statement', {
            params: { start_date: startDate, end_date: endDate }
        });
    });

    test('getBalanceSheet should fetch with end date', async () => {
        const mockData = { assets: 10000, liabilities: 5000, equity: 5000 };
        axios.get.mockResolvedValue({ data: mockData });

        const endDate = '2024-12-31';
        const result = await getBalanceSheet(endDate);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/balance-sheet', {
            params: { end_date: endDate }
        });
    });

    test('getEquityStatement should fetch with date range', async () => {
        const mockData = { opening_equity: 5000, net_income: 1000, closing_equity: 6000 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getEquityStatement('2024-01-01', '2024-12-31');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/equity-statement', {
            params: { start_date: '2024-01-01', end_date: '2024-12-31' }
        });
    });

    test('getCashFlowReport should fetch with date range', async () => {
        const mockData = { operating: 1000, investing: -500, financing: 0 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getCashFlowReport('2024-01-01', '2024-12-31');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/cash-flow', {
            params: { start_date: '2024-01-01', end_date: '2024-12-31' }
        });
    });

    test('getCashFlowDetails should fetch with optional category', async () => {
        const mockData = { details: [] };
        axios.get.mockResolvedValue({ data: mockData });

        // With category
        await getCashFlowDetails('2024-01-01', '2024-12-31', 'OPERATING');
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/cash-flow-details', {
            params: { start_date: '2024-01-01', end_date: '2024-12-31', category: 'OPERATING' }
        });

        // Without category (null)
        await getCashFlowDetails('2024-01-01', '2024-12-31', null);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/cash-flow-details', {
            params: { start_date: '2024-01-01', end_date: '2024-12-31', category: null }
        });
    });
});

// =============================================================================
// Dashboard & Analytics Tests
// =============================================================================

describe('Dashboard & Analytics', () => {

    test('getDashboardKpis should fetch KPIs', async () => {
        const mockData = { total_sales: 1000, total_purchases: 800 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getDashboardKpis();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard-kpis');
    });

    test('getDashboardAlerts should fetch alerts', async () => {
        const mockData = { low_stock: [], unpaid_invoices: [] };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getDashboardAlerts();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard-alerts');
    });

    test('getRecentActivities should handle limit parameter', async () => {
        const mockData = [];
        axios.get.mockResolvedValue({ data: mockData });

        await getRecentActivities(5);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard/recent-activities', {
            params: { limit: 5 }
        });

        // Default limit
        await getRecentActivities();
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard/recent-activities', {
            params: { limit: 10 }
        });
    });

    test('getSeasonSummary should fetch season summary', async () => {
        const mockData = { season_name: 'Summer 2024', status: 'Active' };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getSeasonSummary();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard/season-summary');
    });

    test('getAdvancedChartData should pass params correctly', async () => {
        const mockData = { labels: [], datasets: [] };
        axios.get.mockResolvedValue({ data: mockData });

        const params = { type: 'bar', metric: 'sales' };
        const result = await getAdvancedChartData(params);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard/advanced-chart', { params });
    });
});

// =============================================================================
// Capital & Analytical Reports Tests
// =============================================================================

describe('Capital & Analytical Reports', () => {

    test('getCapitalDistribution should handle optional parameters', async () => {
        const mockData = { total_capital: 10000 };
        axios.get.mockResolvedValue({ data: mockData });

        // No params
        await getCapitalDistribution();
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/capital-distribution', { params: {} });

        // Both params
        await getCapitalDistribution('2024-12-31', '2024-01-01');
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/capital-distribution', {
            params: { report_date: '2024-12-31', start_date: '2024-01-01' }
        });
    });

    test('getCapitalBreakdown should fetch breakdown', async () => {
        const mockData = { cash: 5000, inventory: 5000 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getCapitalBreakdown();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/capital-breakdown');
    });

    test('getSalesByCrop should fetch sales analysis', async () => {
        const mockData = [];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getSalesByCrop();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/sales-by-crop');
    });

    test('getCropProfitability should handle seasonId parameter', async () => {
        const mockData = [];
        axios.get.mockResolvedValue({ data: mockData });

        // With seasonId
        await getCropProfitability(1);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/crop-profitability', {
            params: { season_id: 1 }
        });

        // Without seasonId
        await getCropProfitability();
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/crop-profitability', { params: {} });
    });

    test('getTopCustomers should handle limit parameter', async () => {
        const mockData = [];
        axios.get.mockResolvedValue({ data: mockData });

        await getTopCustomers(5);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/top-customers', {
            params: { limit: 5 }
        });
    });

    test('getDebtAnalysis should fetch debt report', async () => {
        const mockData = { total_debt: 0, aging: [] };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getDebtAnalysis();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/debt-analysis');
    });

    test('getBalanceCheck should fetch system balance status', async () => {
        const mockData = { balanced: true, difference: 0 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getBalanceCheck();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/reports/balance-check');
    });
});

// =============================================================================
// Error Handling Edge Cases
// =============================================================================

describe('Reports API Error Handling', () => {

    test('should throw error on network failure for all get requests', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getGeneralLedger()).rejects.toThrow('Network Error');
        await expect(getIncomeStatement('2024-01-01', '2024-01-31')).rejects.toThrow('Network Error');
        await expect(getDashboardKpis()).rejects.toThrow('Network Error');
    });

    test('should handle undefined/null parameters gracefully where applicable', async () => {
        // Some functions might send undefined params, checking if they don't crash before request
        axios.get.mockResolvedValue({ data: {} });

        // Passing nulls to functions that accept params
        await expect(getAdvancedChartData(null)).resolves.toBeDefined();
        await expect(getRecentActivities(null)).resolves.toBeDefined();
    });

    test('should propagate backend 500 errors', async () => {
        axios.get.mockRejectedValue({ response: { status: 500, data: { detail: 'Server Error' } } });

        await expect(getBalanceCheck()).rejects.toBeDefined();
    });
});
