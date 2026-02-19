/**
 * Purchases Integration Tests
 * 
 * اختبار التدفق الكامل: Form → Schema → API → Backend
 * هذه الاختبارات تتطلب تشغيل Backend
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { PurchaseSchema } from '../../schemas/purchases.js';

const API_BASE = 'http://localhost:8000/api/v1';

// Test data
let testCropId = null;
let testSupplierId = null;
let createdPurchaseId = null;

// Check if backend is available
const checkBackend = async () => {
    try {
        await axios.get(`${API_BASE}/crops/`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
};

describe.skipIf(!await checkBackend())('Purchases Integration Tests', () => {

    beforeAll(async () => {
        // Get existing crop and supplier for testing
        const crops = await axios.get(`${API_BASE}/crops/`);
        const contacts = await axios.get(`${API_BASE}/contacts/`);

        if (crops.data.length > 0) {
            testCropId = crops.data[0].crop_id;
        }

        const suppliers = contacts.data.filter(c => c.is_supplier);
        if (suppliers.length > 0) {
            testSupplierId = suppliers[0].contact_id;
        }
    });

    afterAll(async () => {
        // Cleanup: Delete created purchase if any
        if (createdPurchaseId) {
            try {
                await axios.delete(`${API_BASE}/purchases/${createdPurchaseId}`);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    // =========================================================================
    // Form → Schema Integration
    // =========================================================================
    describe('Form → Schema Integration', () => {

        test('Form data format matches Schema expectations', () => {
            // Simulate what the form sends
            const formData = {
                crop_id: testCropId || 1,
                supplier_id: testSupplierId || 1,
                quantity_kg: 500,
                unit_price: 10,
                purchase_date: new Date().toISOString().split('T')[0],
                amount_paid: 0
            };

            // Validate with Schema
            const result = PurchaseSchema.safeParse(formData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.crop_id).toBe(formData.crop_id);
                expect(result.data.supplier_id).toBe(formData.supplier_id);
            }
        });

        test('Schema rejects old camelCase format from legacy forms', () => {
            const oldFormData = {
                cropId: 1,      // Old camelCase format
                supplierId: 1,  // Old camelCase format
                quantity_kg: 500,
                unit_price: 10,
                purchase_date: '2024-01-01'
            };

            const result = PurchaseSchema.safeParse(oldFormData);

            // Should fail because crop_id and supplier_id are missing
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Schema → Backend Integration
    // =========================================================================
    describe('Schema → Backend Integration', () => {

        test('Data validated by Schema is accepted by Backend', async () => {
            if (!testCropId || !testSupplierId) {
                console.warn('Skipping: No test crop or supplier available');
                return;
            }

            const formData = {
                crop_id: testCropId,
                supplier_id: testSupplierId,
                quantity_kg: 100,
                unit_price: 5,
                purchase_date: new Date().toISOString().split('T')[0],
                amount_paid: 0
            };

            // Validate with Schema
            const validationResult = PurchaseSchema.safeParse(formData);
            expect(validationResult.success).toBe(true);

            // Send to Backend
            const response = await axios.post(`${API_BASE}/purchases/`, validationResult.data);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('purchase_id');

            // Save for cleanup
            createdPurchaseId = response.data.purchase_id;
        });

        test('Backend response contains expected field names', async () => {
            const response = await axios.get(`${API_BASE}/purchases/`);

            if (response.data.length > 0) {
                const purchase = response.data[0];

                // Check snake_case field names
                expect(purchase).toHaveProperty('purchase_id');
                expect(purchase).toHaveProperty('crop_id');
                expect(purchase).toHaveProperty('supplier_id');
                expect(purchase).toHaveProperty('quantity_kg');

                // Ensure no camelCase
                expect(purchase).not.toHaveProperty('purchaseId');
                expect(purchase).not.toHaveProperty('cropId');
                expect(purchase).not.toHaveProperty('supplierId');
            }
        });
    });

    // =========================================================================
    // Full Flow Integration
    // =========================================================================
    describe('Full Flow: Form → Schema → API → Backend', () => {

        test('Complete purchase creation flow succeeds', async () => {
            if (!testCropId || !testSupplierId) {
                console.warn('Skipping: No test data available');
                return;
            }

            // Step 1: Simulate form input
            const userInput = {
                crop_id: testCropId,
                supplier_id: testSupplierId,
                quantity_kg: 50,
                unit_price: 8,
                purchase_date: new Date().toISOString().split('T')[0],
                amount_paid: 0,
                notes: 'Integration test purchase'
            };

            // Step 2: Validate with Schema
            const validated = PurchaseSchema.parse(userInput);

            // Step 3: Send to API
            const response = await axios.post(`${API_BASE}/purchases/`, validated);

            // Step 4: Verify response
            expect(response.status).toBe(200);
            expect(response.data.crop_id).toBe(testCropId);
            expect(response.data.supplier_id).toBe(testSupplierId);
            expect(parseFloat(response.data.quantity_kg)).toBe(50);

            // Cleanup
            await axios.delete(`${API_BASE}/purchases/${response.data.purchase_id}`);
        });
    });
});
