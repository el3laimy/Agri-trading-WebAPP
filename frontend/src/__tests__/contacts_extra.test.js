/**
 * Contacts Extra API Tests
 * 
 * Tests for remaining contacts.js functions (Statements, Balances, Force Delete)
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from contacts.js
import {
    getContactSummary,
    getContactStatement,
    getCustomersBalances,
    getSuppliersBalances,
    migrateAndDeleteContact,
    forceDeleteContact
} from '../api/contacts';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// Contact Statements & Summaries Tests
// =============================================================================

describe('Contact Statements & Summaries', () => {

    test('getContactSummary should fetch summary successfully', async () => {
        const mockData = { total_purchases: 5000, total_payments: 2000, balance: 3000 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getContactSummary(1);
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/contacts/1/summary');
    });

    test('getContactStatement should fetch without optional dates', async () => {
        const mockData = { transactions: [] };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getContactStatement(1);
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/contacts/1/statement'));
    });

    test('getContactStatement should fetch WITH dates', async () => {
        const mockData = { transactions: [] };
        axios.get.mockResolvedValue({ data: mockData });

        const startDate = '2024-01-01';
        const endDate = '2024-01-31';
        await getContactStatement(1, startDate, endDate);

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('start_date=2024-01-01'));
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('end_date=2024-01-31'));
    });

    test('getCustomersBalances should fetch balances', async () => {
        const mockData = [{ name: 'Customer A', balance: 500 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getCustomersBalances();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/contacts/customers/balances');
    });

    test('getSuppliersBalances should fetch balances', async () => {
        const mockData = [{ name: 'Supplier B', balance: 1000 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getSuppliersBalances();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/contacts/suppliers/balances');
    });
});

// =============================================================================
// Advanced Deletion Tests
// =============================================================================

describe('Advanced Deletion', () => {

    test('migrateAndDeleteContact should call correct endpoint', async () => {
        const mockResponse = { message: 'Migrated successfully' };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await migrateAndDeleteContact(1, 2);
        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/api/v1/contacts/1/migrate-and-delete', {
            target_contact_id: 2
        });
    });

    test('forceDeleteContact should call force endpoint', async () => {
        const mockResponse = { message: 'Force deleted successfully' };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await forceDeleteContact(1);
        expect(result).toEqual(mockResponse);
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/contacts/1/force');
    });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Contact Extra Error Handling', () => {

    test('should propagate errors', async () => {
        // We set up specific mocks for specific calls if needed, or generic rejections
        // Note: axios.get, axios.delete, etc. share the same mock unless using mockImplementationOnce
        // Here we can use mockRejectedValue for all since we test them sequentially or expecting failures.

        axios.get.mockRejectedValue(new Error('Network Error'));
        axios.delete.mockRejectedValue(new Error('Network Error'));
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(getContactSummary(1)).rejects.toThrow('Network Error');
        await expect(getCustomersBalances()).rejects.toThrow('Network Error');
        await expect(getContactStatement(1)).rejects.toThrow('Network Error');
        await expect(getSuppliersBalances()).rejects.toThrow('Network Error');

        await expect(forceDeleteContact(1)).rejects.toThrow('Network Error');
        await expect(migrateAndDeleteContact(1, 2)).rejects.toThrow('Network Error');
    });

    test('should handle validation errors on migration', async () => {
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Cannot migrate to same contact' } }
        });

        await expect(migrateAndDeleteContact(1, 1)).rejects.toBeDefined();
    });
});
