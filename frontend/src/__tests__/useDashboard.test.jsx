/**
 * useDashboard Hook Tests
 * 
 * Tests for useDashboard.js using React Query
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboard from '../hooks/useDashboard';

// Mock API functions
import * as reportsApi from '../api/reports';

vi.mock('../api/reports');

// Mock wrapper
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDashboard Hook', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should fetch and return aggregated dashboard data', async () => {
        // Setup mocks
        reportsApi.getDashboardKpis.mockResolvedValue({ total_sales: 1000 });
        reportsApi.getDashboardAlerts.mockResolvedValue([{ id: 1, message: 'Low Stock' }]);
        reportsApi.getSalesByCrop.mockResolvedValue([]);
        reportsApi.getTopCustomers.mockResolvedValue([]);
        reportsApi.getRecentActivities.mockResolvedValue([]);
        reportsApi.getSeasonSummary.mockResolvedValue({ season_name: 'Summer 2024' });
        reportsApi.getBalanceCheck.mockResolvedValue({ is_balanced: true });

        const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

        // Wait for data
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Verify data
        expect(result.current.kpis).toEqual({ total_sales: 1000 });
        expect(result.current.alerts).toHaveLength(1);
        expect(result.current.seasonSummary).toEqual({ season_name: 'Summer 2024' });
        expect(result.current.balanceCheck).toEqual({ is_balanced: true });

        // Verify states
        expect(result.current.isError).toBe(false);
    });

    test('should handle loading state', () => {
        // Mock slow response
        reportsApi.getDashboardKpis.mockImplementation(() => new Promise(() => { }));

        const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

        expect(result.current.isLoading).toBe(true);
    });

    test('should handle API errors gracefully', async () => {
        // Mock errors
        const error = new Error('Failed to fetch');
        reportsApi.getDashboardKpis.mockRejectedValue(error);

        // Other API calls might succeed or fail, useDashboard handles some with catch()
        reportsApi.getDashboardAlerts.mockRejectedValue(new Error('Ignored error'));

        const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isError).toBe(true);
        // Alerts should be empty array due to .catch(() => []) in hook
        expect(result.current.alerts).toEqual([]);
    });

    test('should support refetching', async () => {
        reportsApi.getDashboardKpis.mockResolvedValue({ total_sales: 1000 });

        const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Mock new value for refetch
        reportsApi.getDashboardKpis.mockResolvedValue({ total_sales: 2000 });

        await result.current.refetchKpis();

        await waitFor(() => {
            expect(result.current.kpis).toEqual({ total_sales: 2000 });
        });
    });
});
