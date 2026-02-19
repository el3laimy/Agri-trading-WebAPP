/**
 * useSales Hook Tests
 * 
 * Tests for useSales.js using React Query
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useSales, { useCreateSale, useUpdateSale, useDeleteSale, useLastSalePrice, salesKeys } from '../hooks/useSales';
import * as salesApi from '../api/sales';

vi.mock('../api/sales');

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useSales Hooks', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test Query Keys
    test('salesKeys should generate correct keys', () => {
        expect(salesKeys.all).toEqual(['sales']);
        expect(salesKeys.lists()).toEqual(['sales', 'list']);
        expect(salesKeys.list({ page: 1 })).toEqual(['sales', 'list', { page: 1 }]);
        expect(salesKeys.details()).toEqual(['sales', 'detail']);
        expect(salesKeys.detail(1)).toEqual(['sales', 'detail', 1]);
        expect(salesKeys.lastPrice(1, 2)).toEqual(['sales', 'lastPrice', 1, 2]);
    });

    test('useLastSalePrice should fetch price', async () => {
        salesApi.getLastSalePrice.mockResolvedValue(200);

        const { result } = renderHook(() => useLastSalePrice(1, 1), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBe(200);
        expect(salesApi.getLastSalePrice).toHaveBeenCalledWith(1, 1);
    });

    test('useSales should fetch data', async () => {
        const mockData = [{ id: 1, total: 500 }];
        salesApi.getSales.mockResolvedValue(mockData);

        const { result } = renderHook(() => useSales(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });

    test('useCreateSale should call mutation', async () => {
        salesApi.createSale.mockResolvedValue({ id: 2 });

        const { result } = renderHook(() => useCreateSale(), { wrapper: createWrapper() });

        result.current.mutate({ total: 1000 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // Expect exact match for payload, ignore potential second arg
        expect(salesApi.createSale).toHaveBeenCalledWith({ total: 1000 }, expect.anything());
    });

    test('useUpdateSale should call mutation', async () => {
        salesApi.updateSale.mockResolvedValue({ id: 1, updated: true });

        const { result } = renderHook(() => useUpdateSale(), { wrapper: createWrapper() });

        result.current.mutate({ saleId: 1, data: { status: 'completed' } });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // The update hook explicitly destructures and calls updateSale with 2 args
        expect(salesApi.updateSale).toHaveBeenCalledWith(1, { status: 'completed' });
    });

    test('useDeleteSale should call mutation', async () => {
        salesApi.deleteSale.mockResolvedValue({ success: true });

        const { result } = renderHook(() => useDeleteSale(), { wrapper: createWrapper() });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // Expect exact match for ID, ignore potential second arg
        expect(salesApi.deleteSale).toHaveBeenCalledWith(1, expect.anything());
    });
});
