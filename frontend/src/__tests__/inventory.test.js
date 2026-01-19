/**
 * Inventory API Tests
 * 
 * Tests for inventory.js - Inventory Management
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions
import {
    getInventory,
    getInventoryAdjustments,
    createInventoryAdjustment,
    getCropBatches
} from '../api/inventory';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Inventory Operations', () => {

    test('getInventory should fetch inventory list', async () => {
        const mockData = [{ id: 1, crop_name: 'Wheat', quantity: 1000 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getInventory('token');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/inventory/', {
            headers: { Authorization: 'Bearer token' }
        });
    });

    test('getInventoryAdjustments should fetch adjustments history', async () => {
        const mockData = [{ id: 1, type: 'SHRINKAGE', amount: 50 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getInventoryAdjustments('token');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/inventory/adjustments', {
            headers: { Authorization: 'Bearer token' }
        });
    });

    test('createInventoryAdjustment should post new adjustment', async () => {
        const adjData = { crop_id: 1, type: 'DAMAGE', quantity: 10 };
        const mockResponse = { id: 2, ...adjData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createInventoryAdjustment('token', adjData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/inventory/adjustments',
            adjData,
            { headers: { Authorization: 'Bearer token' } }
        );
    });

    test('getCropBatches should fetch batches for a crop', async () => {
        const mockData = [{ batch_id: 'B1', quantity: 500 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getCropBatches('token', 5);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/inventory/5/batches', {
            headers: { Authorization: 'Bearer token' }
        });
    });

    test('should propagate errors', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));
        await expect(getInventory('token')).rejects.toThrow('Network Error');
    });
});
