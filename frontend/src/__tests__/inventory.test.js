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
// vi.mock('axios'); removed to use setup.js mock

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

        const result = await getInventory();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/inventory/');
    });

    test('getInventoryAdjustments should fetch adjustments history', async () => {
        const mockData = [{ id: 1, type: 'SHRINKAGE', amount: 50 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getInventoryAdjustments();

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/inventory/adjustments');
    });

    test('createInventoryAdjustment should post new adjustment', async () => {
        const adjData = { crop_id: 1, type: 'DAMAGE', quantity: 10 };
        const mockResponse = { id: 2, ...adjData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createInventoryAdjustment(adjData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/inventory/adjustments',
            adjData
        );
    });

    test('getCropBatches should fetch batches for a crop', async () => {
        const mockData = [{ batch_id: 'B1', quantity: 500 }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getCropBatches(5);

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/inventory/5/batches');
    });

    test('should propagate errors', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));
        await expect(getInventory('token')).rejects.toThrow('Network Error');
    });
});
