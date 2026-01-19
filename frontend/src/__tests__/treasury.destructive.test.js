/**
 * Treasury Destructive Tests
 * 
 * RUTHLESS QA & SECURITY TESTING
 * These tests are designed to BREAK the application if validation is weak.
 * 
 * Objectives:
 * 1. Data Type Chaos (null, undefined, NaN)
 * 2. Numeric Extremes (Overflows, Precision)
 * 3. Injection Attacks (XSS)
 * 4. Logical Paradoxes
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as treasuryApi from '../api/treasury';

vi.mock('axios');

describe('Treasury Destructive Security Tests', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('CHAOS: Data Types & Strings', () => {
        test('createCashReceipt should REJECT null/undefined amount', async () => {
            const payload = { amount: null, description: 'Chaos' };
            axios.post.mockResolvedValue({ data: {} });

            await expect(treasuryApi.createCashReceipt(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('createCashPayment should REJECT NaN amount', async () => {
            const payload = { amount: NaN, description: 'Chaos' };
            axios.post.mockResolvedValue({ data: {} });

            await expect(treasuryApi.createCashPayment(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('createQuickExpense should REJECT non-numeric amount string', async () => {
            const payload = { amount: "100abc", description: 'Chaos' };
            axios.post.mockResolvedValue({ data: {} });

            await expect(treasuryApi.createQuickExpense(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });
    });

    describe('SECURITY: Injection & XSS', () => {
        test('createCashReceipt should REJECT XSS injection in description', async () => {
            const xssPayload = "<script>alert('pwned')</script>";
            const payload = { amount: 100, description: xssPayload };
            axios.post.mockResolvedValue({ data: {} });

            // Should fail due to regex check in schema
            await expect(treasuryApi.createCashReceipt(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('updateCashPayment should REJECT huge payload (Buffer Overflow attempt)', async () => {
            const hugeString = "A".repeat(100000); // 100KB string
            const payload = { amount: 100, description: hugeString };
            axios.put.mockResolvedValue({ data: {} });

            await expect(treasuryApi.updateCashPayment(1, payload)).rejects.toThrow();
            expect(axios.put).not.toHaveBeenCalled();
        });
    });

    describe('EXTREMES: Numeric Precision & Overflow', () => {
        test('createCashReceipt should REJECT unsafe integer (Overflow)', async () => {
            const unsafeInt = Number.MAX_SAFE_INTEGER + 1;
            const payload = { amount: unsafeInt };
            axios.post.mockResolvedValue({ data: {} });

            await expect(treasuryApi.createCashReceipt(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });

        test('createCashPayment should REJECT negative amount', async () => {
            const payload = { amount: -500 };
            axios.post.mockResolvedValue({ data: {} });

            await expect(treasuryApi.createCashPayment(payload)).rejects.toThrow();
            expect(axios.post).not.toHaveBeenCalled();
        });
    });
});
