/**
 * Sales API Tests
 * 
 * Tests for sales.js - Sale operations and invoices
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from sales.js
import {
    getSales,
    createSale,
    updateSale,
    deleteSale,
    downloadInvoice,
    getLastSalePrice
} from '../api/sales';

// Mock axios
// vi.mock('axios'); removed to use setup.js mock

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// getSales Tests
// =============================================================================

describe('getSales', () => {

    test('should fetch all sales successfully', async () => {
        const mockData = [
            { sale_id: 1, crop_id: 1, customer_id: 1, quantity_sold_kg: 500, total_revenue: 3000 },
            { sale_id: 2, crop_id: 2, customer_id: 2, quantity_sold_kg: 800, total_revenue: 6000 }
        ];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getSales();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/sales/');
    });

    test('should return empty array when no sales', async () => {
        axios.get.mockResolvedValue({ data: [] });

        const result = await getSales();

        expect(result).toEqual([]);
    });

    test('should throw error on network failure', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getSales()).rejects.toThrow('Network Error');
    });

    test('should throw error on server error (500)', async () => {
        axios.get.mockRejectedValue({ response: { status: 500 } });

        await expect(getSales()).rejects.toBeDefined();
    });
});

// =============================================================================
// createSale Tests
// =============================================================================

describe('createSale', () => {

    test('should create sale with valid data', async () => {
        const saleData = {
            crop_id: 1,
            customer_id: 1,
            sale_date: '2024-01-15',
            quantity_sold_kg: 500,
            selling_unit_price: 6,
            total_revenue: 3000,
            amount_received: 1500
        };
        const mockResponse = { sale_id: 1, ...saleData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createSale(saleData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith('/sales/', saleData);
    });

    test('should throw on validation error (422)', async () => {
        const invalidData = { crop_id: 1 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Validation error' } }
        });

        await expect(createSale(invalidData)).rejects.toBeDefined();
    });

    test('should throw on insufficient inventory', async () => {
        const saleData = { crop_id: 1, customer_id: 1, quantity_sold_kg: 99999999 };
        axios.post.mockRejectedValue({
            response: { status: 400, data: { detail: 'Insufficient inventory' } }
        });

        await expect(createSale(saleData)).rejects.toBeDefined();
    });

    test('should throw on crop not found (404)', async () => {
        const saleData = { crop_id: 99999, customer_id: 1, quantity_sold_kg: 100 };
        axios.post.mockRejectedValue({
            response: { status: 404, data: { detail: 'Crop not found' } }
        });

        await expect(createSale(saleData)).rejects.toBeDefined();
    });

    test('should throw on customer not found (404)', async () => {
        const saleData = { crop_id: 1, customer_id: 99999, quantity_sold_kg: 100 };
        axios.post.mockRejectedValue({
            response: { status: 404, data: { detail: 'Customer not found' } }
        });

        await expect(createSale(saleData)).rejects.toBeDefined();
    });

    test('should throw on negative quantity', async () => {
        const invalidData = { crop_id: 1, customer_id: 1, quantity_sold_kg: -100 };
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Quantity must be positive' } }
        });

        await expect(createSale(invalidData)).rejects.toBeDefined();
    });

    test('should throw on network error', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(createSale({})).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// updateSale Tests
// =============================================================================

describe('updateSale', () => {

    test('should update sale with valid data', async () => {
        const updateData = { quantity_sold_kg: 600, total_revenue: 3600 };
        const mockResponse = { sale_id: 1, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateSale(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith('/sales/1', updateData);
    });

    test('should throw on not found (404)', async () => {
        axios.put.mockRejectedValue({
            response: { status: 404, data: { detail: 'Sale not found' } }
        });

        await expect(updateSale(99999, {})).rejects.toBeDefined();
    });

    test('should handle null saleId (edge case)', async () => {
        await expect(updateSale(null, {})).rejects.toThrow('Sale ID is required');
        expect(axios.put).not.toHaveBeenCalled();
    });

    test('should handle undefined saleId (edge case)', async () => {
        await expect(updateSale(undefined, {})).rejects.toThrow('Sale ID is required');
        expect(axios.put).not.toHaveBeenCalled();
    });

    test('should throw on validation error', async () => {
        axios.put.mockRejectedValue({
            response: { status: 422, data: { detail: 'Invalid data' } }
        });

        await expect(updateSale(1, { quantity_sold_kg: -100 })).rejects.toBeDefined();
    });
});

// =============================================================================
// deleteSale Tests
// =============================================================================

describe('deleteSale', () => {

    test('should delete sale with valid ID', async () => {
        const mockResponse = { message: 'Sale deleted successfully' };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await deleteSale(1);

        expect(result).toEqual(mockResponse);
        expect(axios.delete).toHaveBeenCalledWith('/sales/1');
    });

    test('should throw on not found (404)', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 404, data: { detail: 'Sale not found' } }
        });

        await expect(deleteSale(99999)).rejects.toBeDefined();
    });

    test('should throw on conflict (409) - has related journal entries', async () => {
        axios.delete.mockRejectedValue({
            response: { status: 409, data: { detail: 'Cannot delete: sale has related entries' } }
        });

        await expect(deleteSale(1)).rejects.toBeDefined();
    });

    test('should handle null saleId (edge case)', async () => {
        await expect(deleteSale(null)).rejects.toThrow('Sale ID is required');
        expect(axios.delete).not.toHaveBeenCalled();
    });

    test('should throw on network error', async () => {
        axios.delete.mockRejectedValue(new Error('Network Error'));

        await expect(deleteSale(1)).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// downloadInvoice Tests
// =============================================================================

describe('downloadInvoice', () => {

    test('should download invoice as blob', async () => {
        const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
        axios.get.mockResolvedValue({ data: mockBlob });

        const result = await downloadInvoice(1);

        expect(result).toEqual(mockBlob);
        expect(axios.get).toHaveBeenCalledWith('/sales/1/invoice', {
            responseType: 'blob'
        });
    });

    test('should throw on sale not found (404)', async () => {
        axios.get.mockRejectedValue({
            response: { status: 404, data: { detail: 'Sale not found' } }
        });

        await expect(downloadInvoice(99999)).rejects.toBeDefined();
    });

    test('should throw on invoice generation error', async () => {
        axios.get.mockRejectedValue({
            response: { status: 500, data: { detail: 'Failed to generate invoice' } }
        });

        await expect(downloadInvoice(1)).rejects.toBeDefined();
    });

    test('should handle null saleId (edge case)', async () => {
        await expect(downloadInvoice(null)).rejects.toThrow('Sale ID is required');
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should throw on network error', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        await expect(downloadInvoice(1)).rejects.toThrow('Network Error');
    });
});

// =============================================================================
// getLastSalePrice Tests
// =============================================================================

describe('getLastSalePrice', () => {

    test('should return last sale price for crop and customer', async () => {
        const mockResponse = {
            selling_unit_price: 6.5,
            sale_date: '2024-01-10',
            quantity_sold_kg: 500
        };
        axios.get.mockResolvedValue({ data: mockResponse });

        const result = await getLastSalePrice(1, 2);

        expect(result).toEqual(mockResponse);
        expect(axios.get).toHaveBeenCalledWith('/sales/last-price/1/2');
    });

    test('should return null values when no previous sale exists', async () => {
        axios.get.mockRejectedValue({
            response: { status: 404, data: { detail: 'No previous sale found' } }
        });

        const result = await getLastSalePrice(1, 2);

        expect(result).toEqual({
            selling_unit_price: null,
            sale_date: null,
            quantity_sold_kg: null
        });
    });

    test('should return null values on network error', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        const result = await getLastSalePrice(1, 2);

        expect(result).toEqual({
            selling_unit_price: null,
            sale_date: null,
            quantity_sold_kg: null
        });
    });

    test('should handle null cropId (edge case)', async () => {
        await expect(getLastSalePrice(null, 2)).rejects.toThrow();
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should handle null customerId (edge case)', async () => {
        await expect(getLastSalePrice(1, null)).rejects.toThrow();
        expect(axios.get).not.toHaveBeenCalled();
    });
});

// =============================================================================
// Edge Cases Summary
// =============================================================================

describe('Sales API Edge Cases Summary', () => {

    test('All functions should handle null IDs', async () => {
        await expect(updateSale(null, {})).rejects.toThrow();
        await expect(deleteSale(null)).rejects.toThrow();
        await expect(downloadInvoice(null)).rejects.toThrow();
    });

    test('createSale should validate positive quantities', async () => {
        axios.post.mockRejectedValue({
            response: { status: 422, data: { detail: 'Quantity must be positive' } }
        });

        await expect(createSale({ quantity_sold_kg: 0 })).rejects.toBeDefined();
        await expect(createSale({ quantity_sold_kg: -100 })).rejects.toBeDefined();
    });
});
