/**
 * Financial Accounts API Tests
 * 
 * Tests for financialAccounts.js - Financial account operations
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from financialAccounts.js
import {
    getFinancialAccounts,
    createFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount
} from '../api/financialAccounts';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// getFinancialAccounts Tests
// =============================================================================

describe('getFinancialAccounts', () => {

    test('should fetch all financial accounts successfully', async () => {
        const mockData = [
            { account_id: 1, account_name: 'الخزينة الرئيسية', account_type: 'CASH', balance: 50000 },
            { account_id: 2, account_name: 'البنك الأهلي', account_type: 'BANK', balance: 100000 }
        ];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getFinancialAccounts();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/financial-accounts/');
    });

    test('should return empty array when no accounts', async () => {
        axios.get.mockResolvedValue({ data: [] });

        const result = await getFinancialAccounts();

        expect(result).toEqual([]);
    });

    test('should throw error on network failure', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getFinancialAccounts()).rejects.toThrow('Network Error');
    });

    test('should throw error on server error (500)', async () => {
        axios.get.mockRejectedValue({ response: { status: 500 } });

        await expect(getFinancialAccounts()).rejects.toBeDefined();
    });
});

// =============================================================================
// createFinancialAccount Tests
// =============================================================================

describe('createFinancialAccount', () => {

    test('should create financial account with valid data', async () => {
        const accountData = {
            account_name: 'خزينة فرعية',
            account_type: 'CASH',
            opening_balance: 10000
        };
        const mockResponse = { account_id: 3, ...accountData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createFinancialAccount(accountData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/api/v1/financial-accounts/', accountData);
    });

    test('should throw on validation error (422) - missing account_name', async () => {
        const invalidData = { account_type: 'CASH' };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'account_name is required' } }
        });

        await expect(createFinancialAccount(invalidData)).rejects.toBeDefined();
    });

    test('should throw on duplicate account name (409)', async () => {
        const accountData = { account_name: 'الخزينة الرئيسية', account_type: 'CASH' };
        axios.post.mockRejectedValue({
            response: { status: 409, data: { detail: 'Account with this name already exists' } }
        });

        await expect(createFinancialAccount(accountData)).rejects.toBeDefined();
    });

    test('should throw on invalid account type', async () => {
        const invalidData = { account_name: 'Test', account_type: 'INVALID' };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Invalid account type' } }
        });

        await expect(createFinancialAccount(invalidData)).rejects.toBeDefined();
    });

    test('should throw on negative opening balance', async () => {
        const invalidData = { account_name: 'Test', account_type: 'CASH', opening_balance: -1000 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Opening balance cannot be negative' } }
        });

        await expect(createFinancialAccount(invalidData)).rejects.toBeDefined();
    });

    test('should throw on network error', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createFinancialAccount({})).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// updateFinancialAccount Tests
// =============================================================================

describe('updateFinancialAccount', () => {

    test('should update financial account with valid data', async () => {
        const updateData = { account_name: 'الخزينة الرئيسية - محدث' };
        const mockResponse = { account_id: 1, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateFinancialAccount(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/financial-accounts/1', updateData);
    });

    test('should throw on not found (404)', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Account not found' } }
        });

        await expect(updateFinancialAccount(99999, {})).rejects.toBeDefined();
    });

    test('should throw on duplicate account name (409)', async () => {
        axios.put.mockRejectedValue({
            response: { status: 409, data: { detail: 'Account with this name already exists' } }
        });

        await expect(updateFinancialAccount(1, { account_name: 'البنك الأهلي' })).rejects.toBeDefined();
    });

    test('should handle null accountId (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 404 } });

        await expect(updateFinancialAccount(null, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/api/v1/financial-accounts/null', {});
    });

    test('should handle undefined accountId (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 404 } });

        await expect(updateFinancialAccount(undefined, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/api/v1/financial-accounts/undefined', {});
    });

    test('should handle negative accountId (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 400 } });

        await expect(updateFinancialAccount(-1, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/api/v1/financial-accounts/-1', {});
    });
});

// =============================================================================
// deleteFinancialAccount Tests
// =============================================================================

describe('deleteFinancialAccount', () => {

    test('should delete financial account with valid ID', async () => {
        const mockResponse = { message: 'Account deleted successfully' };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await deleteFinancialAccount(3);

        expect(result).toEqual(mockResponse);
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/financial-accounts/3');
    });

    test('should throw on not found (404)', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 404, data: { detail: 'Account not found' } }
        });

        await expect(deleteFinancialAccount(99999)).rejects.toBeDefined();
    });

    test('should throw on conflict (409) - account has balance', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 409, data: { detail: 'Cannot delete: account has non-zero balance' } }
        });

        await expect(deleteFinancialAccount(1)).rejects.toBeDefined();
    });

    test('should throw on conflict (409) - account has transactions', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 409, data: { detail: 'Cannot delete: account has linked transactions' } }
        });

        await expect(deleteFinancialAccount(1)).rejects.toBeDefined();
    });

    test('should handle null accountId (edge case)', async () => {
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(deleteFinancialAccount(null)).rejects.toBeDefined();
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/financial-accounts/null');
    });

    test('should handle undefined accountId (edge case)', async () => {
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(deleteFinancialAccount(undefined)).rejects.toBeDefined();
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/financial-accounts/undefined');
    });

    test('should throw on network error', async () => {
        axios.delete.mockRejectedValue(new Error('Network Error'));

        await expect(deleteFinancialAccount(1)).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// Edge Cases Summary
// =============================================================================

describe('Financial Accounts API Edge Cases Summary', () => {

    test('All functions should handle null IDs', async () => {
        axios.put.mockRejectedValue({ response: { status: 400 } });
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(updateFinancialAccount(null, {})).rejects.toBeDefined();
        await expect(deleteFinancialAccount(null)).rejects.toBeDefined();
    });

    test('createFinancialAccount should validate required fields', async () => {
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Validation error' } }
        });

        await expect(createFinancialAccount({})).rejects.toBeDefined();
        await expect(createFinancialAccount({ account_name: '' })).rejects.toBeDefined();
    });

    test('delete should fail if account has balance', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 409, data: { detail: 'Account has non-zero balance' } }
        });

        await expect(deleteFinancialAccount(1)).rejects.toBeDefined();
    });
});
