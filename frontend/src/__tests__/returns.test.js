/**
 * Returns API Tests
 * 
 * Tests for api/purchase_returns.js and api/sale_returns.js
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as purchaseReturns from '../api/purchase_returns';
import * as saleReturns from '../api/sale_returns';

// vi.mock('axios'); removed to use setup.js mock

describe('Purchase Returns API', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('getPurchaseReturns', async () => {
        axios.get.mockResolvedValue({ data: [] });
        await purchaseReturns.getPurchaseReturns();
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/purchase-returns'));
    });

    test('createPurchaseReturn', async () => {
        axios.post.mockResolvedValue({ data: {} });
        await purchaseReturns.createPurchaseReturn({});
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/purchase-returns'), {});
    });
});

describe('Sale Returns API', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('getSaleReturns', async () => {
        axios.get.mockResolvedValue({ data: [] });
        await saleReturns.getSaleReturns();
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/sale-returns'));
    });

    test('createSaleReturn', async () => {
        axios.post.mockResolvedValue({ data: {} });
        await saleReturns.createSaleReturn({});
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/sale-returns'), {});
    });
});
