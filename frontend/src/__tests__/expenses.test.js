/**
 * Expenses API Tests
 * 
 * Tests for expenses.js - Expense Management
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from expenses.js
import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
} from '../api/expenses';

// Mock axios
// vi.mock('axios'); removed to use setup.js mock

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// getExpenses Tests
// =============================================================================

describe('getExpenses', () => {

    test('should fetch all expenses successfully', async () => {
        const mockData = [
            { expense_id: 1, amount: 500, description: 'Office Supplies' },
            { expense_id: 2, amount: 1200, description: 'Utilities' }
        ];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getExpenses();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/expenses/');
    });

    test('should return empty array when no expenses', async () => {
        axios.get.mockResolvedValue({ data: [] });

        const result = await getExpenses();

        expect(result).toEqual([]);
    });

    test('should throw error on network failure', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getExpenses()).rejects.toThrow('Network Error');
    });

    test('should throw error on server error (500)', async () => {
        axios.get.mockRejectedValue({ response: { status: 500 } });

        await expect(getExpenses()).rejects.toBeDefined();
    });
});

// =============================================================================
// createExpense Tests
// =============================================================================

describe('createExpense', () => {

    test('should create expense with valid data', async () => {
        const expenseData = {
            expense_category_id: 1,
            amount: 500,
            expense_date: '2024-01-15',
            description: 'Printing paper',
            payment_method: 'CASH'
        };
        const mockResponse = { expense_id: 3, ...expenseData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createExpense(expenseData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/expenses/', expenseData);
    });

    test('should throw on validation error (422) - missing description', async () => {
        const invalidData = { amount: 500 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'validation error' } }
        });

        await expect(createExpense(invalidData)).rejects.toBeDefined();
    });

    test('should throw on negative amount', async () => {
        const invalidData = { amount: -100 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Amount must be positive' } }
        });

        await expect(createExpense(invalidData)).rejects.toBeDefined();
    });

    test('should throw on network error', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createExpense({})).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// updateExpense Tests
// =============================================================================

describe('updateExpense', () => {

    test('should update expense with valid data', async () => {
        const updateData = { amount: 600, description: 'Updated desc' };
        const mockResponse = { expense_id: 1, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateExpense(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/expenses/1', updateData);
    });

    test('should throw on not found (404)', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Expense not found' } }
        });

        await expect(updateExpense(99999, {})).rejects.toBeDefined();
    });

    test('should handle null expenseId (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 404 } });

        await expect(updateExpense(null, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/expenses/null', {});
    });

    test('should handle undefined expenseId (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 404 } });

        await expect(updateExpense(undefined, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/expenses/undefined', {});
    });
});

// =============================================================================
// deleteExpense Tests
// =============================================================================

describe('deleteExpense', () => {

    test('should delete expense with valid ID', async () => {
        const mockResponse = { message: 'Expense deleted successfully' };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await deleteExpense(1);

        expect(result).toEqual(mockResponse);
        expect(axios.delete).toHaveBeenCalledWith('/expenses/1');
    });

    test('should throw on not found (404)', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 404, data: { detail: 'Expense not found' } }
        });

        await expect(deleteExpense(99999)).rejects.toBeDefined();
    });

    test('should handle null expenseId (edge case)', async () => {
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(deleteExpense(null)).rejects.toBeDefined();
        expect(axios.delete).toHaveBeenCalledWith('/expenses/null');
    });

    test('should throw on network error', async () => {
        axios.delete.mockRejectedValue(new Error('Network Error'));

        await expect(deleteExpense(1)).rejects.toThrow('Network Error');
    });
});
