/**
 * Purchases Destructive Tests
 * 
 * RUTHLESS QA & SECURITY TESTING
 * These tests are designed to BREAK the application if validation is weak.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as purchasesApi from '../api/purchases';

// vi.mock('axios'); removed to use setup.js mock

describe('Purchases Destructive Security Tests', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('CHAOS: Data Types & Objects', () => {
        test('createPurchase should REJECT array instead of object', async () => {
            const payload = [{ amount: 100 }];
            axios.post.mockResolvedValue({ data: {} });

            await expect(purchasesApi.createPurchase(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('createPurchase should REJECT undefined cropId', async () => {
            const payload = { cropId: undefined, amount: 100 };
            axios.post.mockResolvedValue({ data: {} });

            await expect(purchasesApi.createPurchase(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });
    });

    describe('LOGICAL PARADOXES', () => {
        test('createPurchase should REJECT amount_paid > total_cost', async () => {
            const payload = {
                cropId: 1, supplierId: 1,
                quantity_kg: 100, unit_price: 1, purchase_date: new Date(),
                total_cost: 100, amount_paid: 200
            };
            axios.post.mockResolvedValue({ data: {} });

            await expect(purchasesApi.createPurchase(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });
    });

    describe('EXTREMES: Precision', () => {
        test('createPurchase should REJECT tiny decimal precision issues', async () => {
            const payload = {
                cropId: 1, supplierId: 1,
                quantity_kg: 100, unit_price: 1, purchase_date: new Date(),
                total_cost: 100, amount_paid: 0.000000001 // Too precise
            };
            axios.post.mockResolvedValue({ data: {} });

            await expect(purchasesApi.createPurchase(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('getLastPurchasePrice should return safe defaults for null IDs', async () => {
            const result = await purchasesApi.getLastPurchasePrice(null, null);
            expect(result).toEqual({ unit_price: null, purchase_date: null, quantity_kg: null });
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
});
