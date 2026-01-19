/**
 * Journal API Tests
 * 
 * Tests for journal.js - Journal Entry Operations
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual function
import { createManualEntry } from '../api/journal';

// Mock axios
vi.mock('axios');

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createManualEntry', () => {

    test('should create manual entry with valid data and auth token', async () => {
        const entryData = {
            date: '2024-01-15',
            description: 'Manual Correction',
            lines: [
                { account_id: 1, debit: 100, credit: 0 },
                { account_id: 2, debit: 0, credit: 100 }
            ]
        };

        const mockResponse = { id: 1, ...entryData, status: 'Draft' };

        // Mock token
        localStorageMock.getItem.mockReturnValue('fake-token-123');
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createManualEntry(entryData);

        expect(result).toEqual(mockResponse);
        expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
        expect(axios.post).toHaveBeenCalledWith('/api/v1/journal-entries/manual', entryData, {
            headers: {
                'Authorization': 'Bearer fake-token-123',
                'Content-Type': 'application/json'
            }
        });
    });

    test('should throw 422 for unbalanced entry', async () => {
        const unbalancedData = {
            date: '2024-01-15',
            description: 'Unbalanced',
            lines: [
                { account_id: 1, debit: 100, credit: 0 },
                { account_id: 2, debit: 0, credit: 50 } // Unbalanced
            ]
        };

        localStorageMock.getItem.mockReturnValue('fake-token');
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Entry lines are not balanced' } }
        });

        await expect(createManualEntry(unbalancedData)).rejects.toBeDefined();
    });

    test('should handle network error', async () => {
        localStorageMock.getItem.mockReturnValue('fake-token');
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createManualEntry({})).rejects.toThrow('Network Error');
    });

    test('should handle missing token gracefully (if API allows or rejects)', async () => {
        localStorageMock.getItem.mockReturnValue(null);
        axios.post.mockResolvedValue({ data: { success: false, message: 'Unauthorized' } });

        // Even if token is null, the function creates the header with "Bearer null"
        // We verify it proceeds to call axios
        await createManualEntry({});

        expect(axios.post).toHaveBeenCalledWith('/api/v1/journal-entries/manual', {}, {
            headers: {
                'Authorization': 'Bearer null',
                'Content-Type': 'application/json'
            }
        });
    });
});
