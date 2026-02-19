/**
 * usePurchases Hook Tests
 * 
 * Tests for usePurchases.js using React Query
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import usePurchases, { useCreatePurchase, useUpdatePurchase, useDeletePurchase, useLastPurchasePrice, purchasesKeys } from '../hooks/usePurchases';
import * as purchasesApi from '../api/purchases';

vi.mock('../api/purchases');

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('usePurchases Hooks', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test Query Keys
    test('purchasesKeys should generate correct keys', () => {
        expect(purchasesKeys.all).toEqual(['purchases']);
        expect(purchasesKeys.lists()).toEqual(['purchases', 'list']);
        expect(purchasesKeys.list({ page: 1 })).toEqual(['purchases', 'list', { page: 1 }]);
        expect(purchasesKeys.details()).toEqual(['purchases', 'detail']);
        expect(purchasesKeys.detail(1)).toEqual(['purchases', 'detail', 1]);
        expect(purchasesKeys.lastPrice(1, 2)).toEqual(['purchases', 'lastPrice', 1, 2]);
    });

    test('useLastPurchasePrice should fetch price', async () => {
        purchasesApi.getLastPurchasePrice.mockResolvedValue(100);

        const { result } = renderHook(() => useLastPurchasePrice(1, 1), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBe(100);
        expect(purchasesApi.getLastPurchasePrice).toHaveBeenCalledWith(1, 1);
    });

    test('usePurchases should fetch data', async () => {
        const mockData = [{ id: 1, amount: 100 }];
        purchasesApi.getPurchases.mockResolvedValue(mockData);

        const { result } = renderHook(() => usePurchases(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });

    test('useCreatePurchase should call mutation', async () => {
        purchasesApi.createPurchase.mockResolvedValue({ id: 2 });

        const { result } = renderHook(() => useCreatePurchase(), { wrapper: createWrapper() });

        result.current.mutate({ amount: 200 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // Expect exact match for payload, ignore potential second arg (React Query meta)
        expect(purchasesApi.createPurchase).toHaveBeenCalledWith({ amount: 200 }, expect.anything());
    });

    test('useUpdatePurchase should call mutation', async () => {
        purchasesApi.updatePurchase.mockResolvedValue({ id: 1, updated: true });

        const { result } = renderHook(() => useUpdatePurchase(), { wrapper: createWrapper() });

        result.current.mutate({ purchaseId: 1, data: { status: 'paid' } });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // The update hook explicitly destructures and calls updatePurchase with 2 args
        expect(purchasesApi.updatePurchase).toHaveBeenCalledWith(1, { status: 'paid' });
    });

    test('useDeletePurchase should call mutation', async () => {
        purchasesApi.deletePurchase.mockResolvedValue({ success: true });

        const { result } = renderHook(() => useDeletePurchase(), { wrapper: createWrapper() });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // Expect exact match for ID, ignore potential (React Query meta)
        expect(purchasesApi.deletePurchase).toHaveBeenCalledWith(1, expect.anything());
    });
});
