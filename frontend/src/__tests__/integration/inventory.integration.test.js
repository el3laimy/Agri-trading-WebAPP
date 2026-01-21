/**
 * Inventory Integration Tests
 * 
 * اختبار التدفق الكامل: DataContext → API → Component
 * هذه الاختبارات تتطلب تشغيل Backend
 */

import { describe, test, expect } from 'vitest';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

// Check if backend is available
const checkBackend = async () => {
    try {
        await axios.get(`${API_BASE}/inventory/`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
};

describe.skipIf(!await checkBackend())('Inventory Integration Tests', () => {

    // =========================================================================
    // API Response Contract
    // =========================================================================
    describe('API Response Contract', () => {

        test('Inventory API returns current_stock_kg (not quantity_kg)', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);

            if (response.data.length > 0) {
                const item = response.data[0];

                // Backend should return current_stock_kg
                expect(item).toHaveProperty('current_stock_kg');

                // Should NOT have old field name
                expect(item).not.toHaveProperty('quantity_kg');
                expect(item).not.toHaveProperty('quantity');
                expect(item).not.toHaveProperty('stock');
            }
        });

        test('Inventory API returns crop object with crop_name', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);

            if (response.data.length > 0) {
                const item = response.data[0];

                expect(item).toHaveProperty('crop');
                expect(item.crop).toHaveProperty('crop_name');
                expect(item.crop).toHaveProperty('crop_id');
            }
        });

        test('current_stock_kg is a valid number', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);

            if (response.data.length > 0) {
                const item = response.data[0];
                const stockKg = parseFloat(item.current_stock_kg);

                expect(Number.isNaN(stockKg)).toBe(false);
                expect(stockKg).toBeGreaterThanOrEqual(0);
            }
        });
    });

    // =========================================================================
    // DataContext → Component Integration
    // =========================================================================
    describe('DataContext → Component Field Mapping', () => {

        test('Component should use current_stock_kg for display', async () => {
            // Simulate what DataContext fetches
            const response = await axios.get(`${API_BASE}/inventory/`);
            const inventoryData = response.data;

            // Simulate what InventoryView component does
            const stats = {
                totalItems: inventoryData.length,
                totalQuantity: inventoryData.reduce(
                    (sum, item) => sum + (parseFloat(item.current_stock_kg) || 0),
                    0
                ),
                inStock: inventoryData.filter(
                    i => parseFloat(i.current_stock_kg) > 0
                ).length,
                outOfStock: inventoryData.filter(
                    i => parseFloat(i.current_stock_kg) <= 0
                ).length
            };

            // Verify calculations work
            expect(stats.totalItems).toBeGreaterThanOrEqual(0);
            expect(stats.totalQuantity).toBeGreaterThanOrEqual(0);
            expect(stats.inStock + stats.outOfStock).toBe(stats.totalItems);
        });

        test('Filtered inventory uses correct field', async () => {
            const response = await axios.get(`${API_BASE}/inventory/`);
            const inventoryData = response.data;

            // Filter for in-stock items using correct field
            const inStock = inventoryData.filter(
                item => parseFloat(item.current_stock_kg) > 0
            );

            // Each filtered item should have positive stock
            inStock.forEach(item => {
                expect(parseFloat(item.current_stock_kg)).toBeGreaterThan(0);
            });
        });
    });

    // =========================================================================
    // Cardex Report Integration
    // =========================================================================
    describe('Cardex Report Integration', () => {

        test('Cardex endpoint returns correct structure', async () => {
            // Get first crop ID
            const inventory = await axios.get(`${API_BASE}/inventory/`);

            if (inventory.data.length > 0) {
                const cropId = inventory.data[0].crop.crop_id;

                const cardex = await axios.get(`${API_BASE}/inventory/${cropId}/cardex`);

                expect(cardex.data).toHaveProperty('crop_id');
                expect(cardex.data).toHaveProperty('crop_name');
                expect(cardex.data).toHaveProperty('movements');
                expect(cardex.data).toHaveProperty('total_in');
                expect(cardex.data).toHaveProperty('total_out');
                expect(cardex.data).toHaveProperty('current_balance');

                // Each movement should have required fields
                if (cardex.data.movements.length > 0) {
                    const movement = cardex.data.movements[0];
                    expect(movement).toHaveProperty('date');
                    expect(movement).toHaveProperty('type');
                    expect(movement).toHaveProperty('quantity_kg');
                    expect(movement).toHaveProperty('direction');
                }
            }
        });
    });
});

// =========================================================================
// Field Name Documentation Test
// =========================================================================
describe('Inventory Field Names Documentation', () => {

    test('Document expected inventory field names for developers', () => {
        const expectedFields = {
            // From Backend API
            'current_stock_kg': 'الكمية المتاحة من المخزون (Backend)',
            'average_cost_per_kg': 'متوسط تكلفة الكيلو (Backend)',
            'crop': 'كائن المحصول (Backend)',
            'crop.crop_id': 'معرف المحصول (Backend)',
            'crop.crop_name': 'اسم المحصول (Backend)',

            // NOT expected (old/wrong names)
            'quantity_kg': '❌ خطأ - استخدم current_stock_kg',
            'quantity': '❌ خطأ - استخدم current_stock_kg',
            'stock': '❌ خطأ - استخدم current_stock_kg'
        };

        // This test always passes - it's documentation
        expect(true).toBe(true);
        console.log('Expected Inventory Fields:', expectedFields);
    });
});
