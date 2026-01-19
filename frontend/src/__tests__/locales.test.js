/**
 * Locales Tests
 * 
 * Tests for locales/ar.js to ensure translation integrity
 * Target coverage: 100% for this file
 */

import { describe, test, expect } from 'vitest';
import ar, { t } from '../locales/ar';

describe('Arabic Locale Structure', () => {

    test('should have valid top-level sections', () => {
        expect(ar).toBeDefined();
        expect(typeof ar).toBe('object');

        // Check actual sections found in file
        expect(ar.app).toBeDefined();
        expect(ar.actions).toBeDefined();
        expect(ar.labels).toBeDefined();
        expect(ar.nav).toBeDefined();
        expect(ar.auth).toBeDefined();
        expect(ar.dashboard).toBeDefined();
        expect(ar.sales).toBeDefined();
        expect(ar.purchases).toBeDefined();
        expect(ar.inventory).toBeDefined();
        expect(ar.treasury).toBeDefined();
        expect(ar.contacts).toBeDefined();
        expect(ar.reports).toBeDefined();
        expect(ar.errors).toBeDefined();
        expect(ar.confirmations).toBeDefined();
        expect(ar.empty).toBeDefined();
        expect(ar.units).toBeDefined();
    });

    test('should contain critical keys in sections', () => {
        // Actions (Common)
        expect(ar.actions.save).toBeDefined();
        expect(ar.actions.cancel).toBeDefined();
        expect(ar.actions.delete).toBeDefined();

        // Dashboard
        expect(ar.dashboard.title).toBeDefined();
        expect(ar.dashboard.kpis).toBeDefined();

        // Auth
        expect(ar.auth.login).toBeDefined();
        expect(ar.auth.logout).toBeDefined();
    });

    test('should not have empty translations', () => {
        // Recursively check for empty strings
        function checkValues(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    checkValues(obj[key]);
                } else {
                    expect(obj[key]).not.toBe('');
                }
            }
        }
        checkValues(ar);
    });
});

describe('Translation Helper (t function)', () => {

    test('should return translation for existing key', () => {
        expect(t('actions.save')).toBe('حفظ');
        expect(t('dashboard.title')).toBe('لوحة التحكم');
    });

    test('should return nested translation', () => {
        expect(t('dashboard.kpis.netProfit')).toBe('صافي الربح');
    });

    test('should return key if not found', () => {
        expect(t('non.existent.key')).toBe('non.existent.key');
        expect(t('actions.unknown')).toBe('actions.unknown');
    });

    test('should replace parameters', () => {
        // Mock a translation string with param for testing logic if needed, 
        // or use existing one key if known.
        // Assuming 'confirmations.deleteItem' is 'هل أنت متأكد من حذف {item}؟'
        expect(t('confirmations.deleteItem', { item: 'المستخدم' })).toBe('هل أنت متأكد من حذف المستخدم؟');

        // Test missing param -> keeps placeholder
        expect(t('confirmations.deleteItem', {})).toBe('هل أنت متأكد من حذف {item}؟');
    });
});
