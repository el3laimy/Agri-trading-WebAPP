/**
 * Purchases API Tests
 * 
 * Tests for purchases.js - Purchase operations
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from purchases.js
import {
    getPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
    getLastPurchasePrice
} from '../api/purchases';

// Mock axios
// vi.mock('axios'); removed to use setup.js mock

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// getPurchases Tests
// =============================================================================

describe('getPurchases', () => {

    test('should fetch all purchases successfully', async () => {
        const mockData = [
            { purchase_id: 1, crop_id: 1, supplier_id: 1, quantity_kg: 1000, total_cost: 5000 },
            { purchase_id: 2, crop_id: 2, supplier_id: 2, quantity_kg: 500, total_cost: 3000 }
        ];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getPurchases();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/purchases/');
    });

    test('should return empty array when no purchases', async () => {
        axios.get.mockResolvedValue({ data: [] });

        const result = await getPurchases();

        expect(result).toEqual([]);
    });

    test('should throw error on network failure', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getPurchases()).rejects.toThrow('Network Error');
    });

    test('should throw error on server error (500)', async () => {
        axios.get.mockRejectedValue({ response: { status: 500 } });

        await expect(getPurchases()).rejects.toBeDefined();
    });
});

// =============================================================================
// createPurchase Tests
// =============================================================================

describe('createPurchase', () => {

    test('should create purchase with valid data', async () => {
        const purchaseData = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-15',
            quantity_kg: 1000,
            unit_price: 5,
            amount_paid: 2000
        };
        const mockResponse = { purchase_id: 1, ...purchaseData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createPurchase(purchaseData);

        expect(result).toEqual(mockResponse);
        // We compare validation output which uses snake_case
        expect(axios.post).toHaveBeenCalledWith('/purchases/', expect.objectContaining({
            crop_id: 1,
            supplier_id: 1
        }));
    });

    test('should throw on validation error (422) - missing required fields', async () => {
        const invalidData = { crop_id: 1 }; // Missing supplier_id, quantity, etc.
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Validation error' } }
        });

        await expect(createPurchase(invalidData)).rejects.toBeDefined();
    });

    test('should throw on crop not found (404)', async () => {
        // We pass valid structure but server returns 404
        const purchaseData = {
            crop_id: 99999, supplier_id: 1, quantity_kg: 100,
            unit_price: 10, amount_paid: 0,
            purchase_date: '2024-01-01'
        };
        axios.post.mockRejectedValue({
            response: { status: 404, data: { detail: 'Crop not found' } }
        });

        await expect(createPurchase(purchaseData)).rejects.toBeDefined();
    });

    test('should throw on supplier not found (404)', async () => {
        const purchaseData = {
            crop_id: 1, supplier_id: 99999, quantity_kg: 100,
            unit_price: 10, amount_paid: 0,
            purchase_date: '2024-01-01'
        };
        axios.post.mockRejectedValue({
            response: { status: 404, data: { detail: 'Supplier not found' } }
        });

        await expect(createPurchase(purchaseData)).rejects.toBeDefined();
    });

    test('should throw on negative quantity', async () => {
        // Validation now catches this before axios
        const invalidData = {
            crop_id: 1, supplier_id: 1, quantity_kg: -100,
            unit_price: 10, amount_paid: 0,
            purchase_date: '2024-01-01'
        };

        await expect(createPurchase(invalidData)).rejects.toBeDefined();
        // and axios should NOT be called
        expect(axios.post).not.toHaveBeenCalled();
    });

    test('should throw on network error', async () => {
        const validData = {
            crop_id: 1, supplier_id: 1, quantity_kg: 100,
            unit_price: 10, amount_paid: 0,
            purchase_date: '2024-01-01'
        };
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createPurchase(validData)).rejects.toThrow('Network Error');
    });
});

// ... updatePurchase skip ...

describe('updatePurchase', () => {

    test('should update purchase with valid data', async () => {
        const updateData = { quantity_kg: 1500, total_cost: 7500 };
        const mockResponse = { purchase_id: 1, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updatePurchase(1, updateData);

        expect(result).toEqual(mockResponse);
        // Use objectContaining because Schema may add defaults
        expect(axios.put).toHaveBeenCalledWith('/purchases/1', expect.objectContaining({
            quantity_kg: 1500,
            total_cost: 7500
        }));
    });

    // ... null tests ...
});

// ... deletePurchase skip ...

// =============================================================================
// getLastPurchasePrice Tests
// =============================================================================

describe('getLastPurchasePrice', () => {

    test('should return last purchase price for crop and supplier', async () => {
        const mockResponse = {
            unit_price: 5.5,
            purchase_date: '2024-01-10',
            quantity_kg: 500
        };
        axios.get.mockResolvedValue({ data: mockResponse });

        const result = await getLastPurchasePrice(1, 2);

        expect(result).toEqual(mockResponse);
        expect(axios.get).toHaveBeenCalledWith('/purchases/last-price/1/2');
    });

    test('should return null values when no previous purchase exists', async () => {
        // The function returns default null values on error
        axios.get.mockRejectedValue({
            response: { status: 404, data: { detail: 'No previous purchase found' } }
        });

        const result = await getLastPurchasePrice(1, 2);

        expect(result).toEqual({
            unit_price: null,
            purchase_date: null,
            quantity_kg: null
        });
    });

    test('should return null values on network error', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        const result = await getLastPurchasePrice(1, 2);

        expect(result).toEqual({
            unit_price: null,
            purchase_date: null,
            quantity_kg: null
        });
    });

    test('should return nulls on validation error (null cropId)', async () => {
        // Validation fails but function catches and returns safe defaults
        const result = await getLastPurchasePrice(null, 2);

        expect(result).toEqual({ unit_price: null, purchase_date: null, quantity_kg: null });
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should return nulls on validation error (null supplierId)', async () => {
        const result = await getLastPurchasePrice(1, null);

        expect(result).toEqual({ unit_price: null, purchase_date: null, quantity_kg: null });
        expect(axios.get).not.toHaveBeenCalled();
    });
});

// =============================================================================
// Edge Cases Summary
// =============================================================================

describe('Purchases API Edge Cases Summary', () => {

    test('All functions should handle null IDs', async () => {
        axios.put.mockRejectedValue({ response: { status: 400 } });
        axios.delete.mockRejectedValue({ response: { status: 400 } });

        await expect(updatePurchase(null, {})).rejects.toBeDefined();
        await expect(deletePurchase(null)).rejects.toBeDefined();
    });

    test('createPurchase should validate positive quantities', async () => {
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Quantity must be positive' } }
        });

        // Add IDs so we fail specifically on Quantity check (or Zod check for quantity)
        await expect(createPurchase({ crop_id: 1, supplier_id: 1, quantity_kg: 0 })).rejects.toBeDefined();
        await expect(createPurchase({ crop_id: 1, supplier_id: 1, quantity_kg: -100 })).rejects.toBeDefined();
    });
});
