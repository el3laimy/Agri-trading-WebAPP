/**
 * Treasury API Tests
 * 
 * Tests for treasury.js - Cash receipts, payments, expenses, and transactions
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from treasury.js
import {
    getTreasurySummary,
    getTreasuryTransactions,
    createCashReceipt,
    createCashPayment,
    createQuickExpense,
    updateCashReceipt,
    updateCashPayment,
    updateQuickExpense,
    deleteTransaction
} from '../api/treasury';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// getTreasurySummary Tests
// =============================================================================

describe('getTreasurySummary', () => {

    test('should fetch treasury summary with valid date', async () => {
        const mockData = {
            opening_balance: 100000,
            total_receipts: 50000,
            total_payments: 30000,
            closing_balance: 120000
        };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getTreasurySummary('2024-01-15');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/treasury/summary', {
            params: { target_date: '2024-01-15' }
        });
    });

    test('should fetch treasury summary with null date', async () => {
        const mockData = { opening_balance: 0, closing_balance: 0 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getTreasurySummary(null);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/treasury/summary', {
            params: { target_date: null }
        });
    });

    test('should throw error on network failure', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getTreasurySummary('2024-01-15')).rejects.toThrow('Network Error');
    });

    test('should throw error on 500 response', async () => {
        axios.get.mockRejectedValue({ response: { status: 500, data: { detail: 'Server Error' } } });

        await expect(getTreasurySummary('2024-01-15')).rejects.toBeDefined();
    });
});

// =============================================================================
// getTreasuryTransactions Tests
// =============================================================================

describe('getTreasuryTransactions', () => {

    test('should fetch transactions with date and default limit', async () => {
        const mockData = [
            { id: 1, type: 'receipt', amount: 5000 },
            { id: 2, type: 'payment', amount: 2000 }
        ];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getTreasuryTransactions('2024-01-15');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/treasury/transactions', {
            params: { target_date: '2024-01-15', limit: 100 }
        });
    });

    test('should fetch transactions with custom limit', async () => {
        const mockData = [];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getTreasuryTransactions('2024-01-15', 50);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/treasury/transactions', {
            params: { target_date: '2024-01-15', limit: 50 }
        });
    });

    test('should throw error on failure', async () => {
        axios.get.mockRejectedValue(new Error('Connection refused'));

        await expect(getTreasuryTransactions('2024-01-15')).rejects.toThrow('Connection refused');
    });
});

// =============================================================================
// createCashReceipt Tests
// =============================================================================

describe('createCashReceipt', () => {

    test('should create cash receipt with valid data', async () => {
        const receiptData = {
            contact_id: 1,
            amount: 5000,
            payment_date: '2024-01-15',
            description: 'Payment received'
        };
        const mockResponse = { id: 1, ...receiptData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createCashReceipt(receiptData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/api/v1/treasury/cash-receipt', receiptData);
    });

    test('should throw on validation error (422)', async () => {
        const invalidData = { amount: -100 }; // Negative amount
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Amount must be positive' } }
        });

        await expect(createCashReceipt(invalidData)).rejects.toBeDefined();
    });

    test('should throw on contact not found (404)', async () => {
        const receiptData = { contact_id: 99999, amount: 5000 };
        axios.post.mockRejectedValue({
            response: { status: 404, data: { detail: 'Contact not found' } }
        });

        await expect(createCashReceipt(receiptData)).rejects.toBeDefined();
    });

    test('should throw on network error', async () => {
        const validData = { amount: 100, contact_id: 1 };
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createCashReceipt(validData)).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// createCashPayment Tests
// =============================================================================

describe('createCashPayment', () => {

    test('should create cash payment with valid data', async () => {
        const paymentData = {
            contact_id: 2,
            amount: 3000,
            payment_date: '2024-01-15',
            description: 'Supplier payment'
        };
        const mockResponse = { id: 2, ...paymentData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createCashPayment(paymentData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/api/v1/treasury/cash-payment', paymentData);
    });

    test('should throw on insufficient balance', async () => {
        const paymentData = { contact_id: 1, amount: 999999999 };
        axios.post.mockRejectedValue({
            response: { status: 400, data: { detail: 'Insufficient balance' } }
        });

        await expect(createCashPayment(paymentData)).rejects.toBeDefined();
    });

    test('should throw on validation error', async () => {
        const invalidData = { amount: 0 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Amount must be greater than zero' } }
        });

        await expect(createCashPayment(invalidData)).rejects.toBeDefined();
    });
});

// =============================================================================
// createQuickExpense Tests
// =============================================================================

describe('createQuickExpense', () => {

    test('should create quick expense with valid data', async () => {
        const expenseData = {
            description: 'Office supplies',
            amount: 500,
            expense_date: '2024-01-15'
        };
        // Zod coercing string date to Date object
        const receivedDate = new Date('2024-01-15');
        const mockResponse = { id: 3, ...expenseData, expense_date: receivedDate };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createQuickExpense(expenseData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/api/v1/treasury/quick-expense', {
            ...expenseData,
            expense_date: expect.any(Date) // Match Date object
        });
    });
});
    });

test('should throw on validation error', async () => {
    const invalidData = { description: '', amount: 100 };
    axios.post.mockRejectedValue({
        response: { status: 422, data: { detail: 'Description is required' } }
    });

    await expect(createQuickExpense(invalidData)).rejects.toBeDefined();
});

test('should throw on network error', async () => {
    const validData = { amount: 100, description: 'Test' };
    axios.post.mockRejectedValue(new Error('Network Error'));

    await expect(createQuickExpense(validData)).rejects.toThrow('Network Error');
});
});

// =============================================================================
// updateCashReceipt Tests
// =============================================================================

describe('updateCashReceipt', () => {

    test('should update cash receipt with valid data', async () => {
        const updateData = { amount: 6000, description: 'Updated receipt' };
        const mockResponse = { id: 1, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateCashReceipt(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/treasury/cash-receipt/1', updateData);
    });

    test('should throw on not found (404)', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Receipt not found' } }
        });

        await expect(updateCashReceipt(99999, {})).rejects.toBeDefined();
    });

    test('should handle null ID (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 404 } });

        await expect(updateCashReceipt(null, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/api/v1/treasury/cash-receipt/null', {});
    });
});

// =============================================================================
// updateCashPayment Tests
// =============================================================================

describe('updateCashPayment', () => {

    test('should update cash payment with valid data', async () => {
        const updateData = { amount: 4000 };
        const mockResponse = { id: 2, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateCashPayment(2, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/treasury/cash-payment/2', updateData);
    });

    test('should throw on not found', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Payment not found' } }
        });

        await expect(updateCashPayment(99999, {})).rejects.toBeDefined();
    });
});

// =============================================================================
// updateQuickExpense Tests
// =============================================================================

describe('updateQuickExpense', () => {

    test('should update quick expense with valid data', async () => {
        const updateData = { description: 'Updated expense', amount: 600 };
        const mockResponse = { id: 3, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateQuickExpense(3, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/treasury/quick-expense/3', updateData);
    });

    test('should throw on not found', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Expense not found' } }
        });

        await expect(updateQuickExpense(99999, {})).rejects.toBeDefined();
    });

    test('should handle negative ID (edge case)', async () => {
        axios.put.mockRejectedValue({ response: { status: 400 } });

        await expect(updateQuickExpense(-1, {})).rejects.toBeDefined();
        expect(axios.put).toHaveBeenCalledWith('/api/v1/treasury/quick-expense/-1', {});
    });
});

// =============================================================================
// deleteTransaction Tests
// =============================================================================

describe('deleteTransaction', () => {

    test('should delete transaction with valid ID', async () => {
        const mockResponse = { message: 'Transaction deleted successfully' };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await deleteTransaction(1);

        expect(result).toEqual(mockResponse);
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/treasury/1');
    });

    test('should throw on not found (404)', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 404, data: { detail: 'Transaction not found' } }
        });

        await expect(deleteTransaction(99999)).rejects.toBeDefined();
    });

    test('should throw on conflict (409) - transaction has dependencies', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 409, data: { detail: 'Cannot delete: transaction is linked to journal entries' } }
        });

        await expect(deleteTransaction(1)).rejects.toBeDefined();
    });

    test('should handle null ID (edge case)', async () => {
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(deleteTransaction(null)).rejects.toBeDefined();
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/treasury/null');
    });

    test('should handle undefined ID (edge case)', async () => {
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(deleteTransaction(undefined)).rejects.toBeDefined();
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/treasury/undefined');
    });

    test('should throw on network error', async () => {
        axios.delete.mockRejectedValue(new Error('Network Error'));

        await expect(deleteTransaction(1)).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// Edge Cases Summary
// =============================================================================

describe('Treasury API Edge Cases Summary', () => {

    test('All create functions should validate positive amounts', async () => {
        // This documents the expected behavior
        const negativeAmount = { amount: -100 };

        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Amount must be positive' } }
        });

        await expect(createCashReceipt(negativeAmount)).rejects.toBeDefined();
        await expect(createCashPayment(negativeAmount)).rejects.toBeDefined();
        await expect(createQuickExpense(negativeAmount)).rejects.toBeDefined();
    });

    test('All update functions should handle non-existent IDs', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Not found' } }
        });

        await expect(updateCashReceipt(0, {})).rejects.toBeDefined();
        await expect(updateCashPayment(0, {})).rejects.toBeDefined();
        await expect(updateQuickExpense(0, {})).rejects.toBeDefined();
    });
});
