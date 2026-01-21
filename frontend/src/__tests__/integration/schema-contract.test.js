/**
 * Schema Contract Tests
 * 
 * التأكد من توافق أسماء الحقول بين Frontend Schemas و Backend API
 * هذه الاختبارات تمنع تكرار مشاكل مثل cropId vs crop_id
 */

import { describe, test, expect, beforeAll } from 'vitest';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

// Skip if backend not running
const backendAvailable = async () => {
    try {
        await axios.get(`${API_BASE}/crops/`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
};

describe.skipIf(!await backendAvailable())('Schema Contract Tests', () => {

    // =========================================================================
    // Purchase Schema Contract
    // =========================================================================
    describe('Purchase Schema Contract', () => {

        test('Backend expects snake_case field names for purchases', async () => {
            // Get OpenAPI schema to verify expected field names
            const response = await axios.get('http://localhost:8000/openapi.json');
            const schemas = response.data.components.schemas;

            // Find PurchaseCreate schema
            const purchaseCreate = schemas.PurchaseCreate;
            expect(purchaseCreate).toBeDefined();

            // Verify field names are snake_case
            const properties = purchaseCreate.properties;
            expect(properties).toHaveProperty('crop_id');
            expect(properties).toHaveProperty('supplier_id');
            expect(properties).toHaveProperty('quantity_kg');
            expect(properties).toHaveProperty('unit_price');
            expect(properties).toHaveProperty('purchase_date');

            // Ensure camelCase versions are NOT expected
            expect(properties).not.toHaveProperty('cropId');
            expect(properties).not.toHaveProperty('supplierId');
        });

        test('Frontend PurchaseSchema uses matching snake_case names', async () => {
            // Import the schema dynamically
            const { PurchaseSchema } = await import('../../schemas/purchases.js');

            // Test that schema accepts snake_case
            const validData = {
                crop_id: 1,
                supplier_id: 1,
                quantity_kg: 100,
                unit_price: 10,
                purchase_date: '2024-01-01'
            };

            const result = PurchaseSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('Frontend PurchaseSchema rejects camelCase (old format)', async () => {
            const { PurchaseSchema } = await import('../../schemas/purchases.js');

            // This should fail because we now expect snake_case
            const invalidData = {
                cropId: 1,       // Wrong! Should be crop_id
                supplierId: 1,  // Wrong! Should be supplier_id
                quantity_kg: 100,
                unit_price: 10,
                purchase_date: '2024-01-01'
            };

            const result = PurchaseSchema.safeParse(invalidData);
            // crop_id and supplier_id will be undefined, so validation should fail
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Inventory Schema Contract
    // =========================================================================
    describe('Inventory Schema Contract', () => {

        test('Backend returns current_stock_kg for inventory items', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);

            if (response.data.length > 0) {
                const item = response.data[0];
                // Ensure backend uses current_stock_kg
                expect(item).toHaveProperty('current_stock_kg');
                // Ensure it's NOT using quantity_kg
                expect(item).not.toHaveProperty('quantity_kg');
            }
        });

        test('Backend returns crop object with crop_name', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);

            if (response.data.length > 0) {
                const item = response.data[0];
                expect(item).toHaveProperty('crop');
                expect(item.crop).toHaveProperty('crop_name');
            }
        });
    });

    // =========================================================================
    // Treasury Schema Contract
    // =========================================================================
    describe('Treasury Schema Contract', () => {

        test('Frontend Treasury schemas use snake_case', async () => {
            const { CashReceiptSchema, CashPaymentSchema } = await import('../../schemas/treasury.js');

            // Test snake_case field names work
            const validReceipt = {
                amount: 100,
                contact_id: 1
            };

            const result = CashReceiptSchema.safeParse(validReceipt);
            expect(result.success).toBe(true);
        });
    });
});

// =========================================================================
// Field Name Consistency Check
// =========================================================================
describe('Field Name Consistency', () => {

    test('All ID fields should use snake_case convention', async () => {
        // Import all schemas
        const { PurchaseSchema } = await import('../../schemas/purchases.js');
        const { CashReceiptSchema } = await import('../../schemas/treasury.js');

        // Get schema shapes
        const purchaseShape = PurchaseSchema.shape || PurchaseSchema._def.schema.shape;
        const treasuryShape = CashReceiptSchema.shape;

        // Check for snake_case ID fields
        const checkSnakeCase = (shape, schemaName) => {
            const keys = Object.keys(shape);
            const idFields = keys.filter(k => k.includes('id') || k.includes('Id'));

            idFields.forEach(field => {
                // Should be snake_case: crop_id, not cropId
                expect(field).not.toMatch(/[a-z]Id$/);  // Fails if cropId pattern found
            });
        };

        checkSnakeCase(purchaseShape, 'PurchaseSchema');
        checkSnakeCase(treasuryShape, 'CashReceiptSchema');
    });
});
