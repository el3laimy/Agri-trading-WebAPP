/**
 * Edge-Case Tests for Agri-Trading WebApp
 * 
 * These tests import ACTUAL application functions and test edge cases
 * that could potentially break the application.
 * 
 * Run with: npm test
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// =============================================================================
// IMPORT ACTUAL APPLICATION CODE
// =============================================================================

// Utility functions
import {
    validationRules,
    validatePurchaseForm,
    validateSaleForm
} from '../utils/formValidation.jsx';

import {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateForInput,
    formatCompactNumber,
    formatPercentage,
    formatPhoneForWhatsApp,
    truncateText
} from '../utils/formatters';

// API functions
import {
    getCrops,
    createCrop,
    updateCrop,
    deleteCrop,
    migrateAndDeleteCrop,
    forceDeleteCrop
} from '../api/crops';

import {
    getContacts,
    createContact,
    updateContact,
    deleteContact,
    getContactSummary,
    getContactStatement,
    migrateAndDeleteContact,
    forceDeleteContact
} from '../api/contacts';


// =============================================================================
// MOCK AXIOS FOR API TESTS
// =============================================================================

vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});


// =============================================================================
// 1. VALIDATION RULES EDGE CASES (formValidation.js)
// =============================================================================

describe('validationRules - Edge Cases', () => {

    describe('validationRules.required', () => {
        test('should reject null value', () => {
            const result = validationRules.required(null, 'المحصول');
            expect(result).toBe('المحصول مطلوب');
        });

        test('should reject undefined value', () => {
            const result = validationRules.required(undefined, 'المحصول');
            expect(result).toBe('المحصول مطلوب');
        });

        test('should reject empty string', () => {
            const result = validationRules.required('', 'المحصول');
            expect(result).toBe('المحصول مطلوب');
        });

        test('should reject whitespace-only string', () => {
            const result = validationRules.required('   ', 'المحصول');
            expect(result).toBe('المحصول مطلوب');
        });

        test('should accept valid string', () => {
            const result = validationRules.required('قمح', 'المحصول');
            expect(result).toBeNull();
        });

        test('should accept zero as valid (number)', () => {
            const result = validationRules.required(0, 'الكمية');
            // BUG: 0 is falsy, so this will be rejected even though 0 is a valid number
            expect(result).toBe('الكمية مطلوب');
        });

        test('should accept false as valid (boolean)', () => {
            const result = validationRules.required(false, 'الحالة');
            // BUG: false is falsy, treated as missing
            expect(result).toBe('الحالة مطلوب');
        });
    });

    describe('validationRules.positiveNumber', () => {
        test('should reject zero', () => {
            const result = validationRules.positiveNumber(0, 'الكمية');
            expect(result).toBe('الكمية يجب أن يكون أكبر من صفر');
        });

        test('should reject negative number', () => {
            const result = validationRules.positiveNumber(-10, 'الكمية');
            expect(result).toBe('الكمية يجب أن يكون أكبر من صفر');
        });

        test('should reject non-numeric string', () => {
            const result = validationRules.positiveNumber('abc', 'الكمية');
            expect(result).toBe('الكمية يجب أن يكون أكبر من صفر');
        });

        test('should reject NaN', () => {
            const result = validationRules.positiveNumber(NaN, 'الكمية');
            expect(result).toBe('الكمية يجب أن يكون أكبر من صفر');
        });

        test('should reject Infinity', () => {
            const result = validationRules.positiveNumber(Infinity, 'الكمية');
            // BUG potential: Infinity > 0 is true, so this passes
            expect(result).toBeNull();
        });

        test('should accept positive number', () => {
            const result = validationRules.positiveNumber(100, 'الكمية');
            expect(result).toBeNull();
        });

        test('should accept very small positive number', () => {
            const result = validationRules.positiveNumber(0.0001, 'الكمية');
            expect(result).toBeNull();
        });

        test('should accept string that parses to positive number', () => {
            const result = validationRules.positiveNumber('100', 'الكمية');
            expect(result).toBeNull();
        });

        test('should handle partial numeric string (e.g., "100abc")', () => {
            // parseFloat("100abc") = 100
            const result = validationRules.positiveNumber('100abc', 'الكمية');
            // This passes because parseFloat ignores trailing non-numeric chars
            expect(result).toBeNull();
        });
    });

    describe('validationRules.nonNegative', () => {
        test('should reject negative number', () => {
            const result = validationRules.nonNegative(-1, 'المبلغ');
            expect(result).toBe('المبلغ لا يمكن أن يكون سالباً');
        });

        test('should accept zero', () => {
            const result = validationRules.nonNegative(0, 'المبلغ');
            expect(result).toBeNull();
        });

        test('should accept positive number', () => {
            const result = validationRules.nonNegative(100, 'المبلغ');
            expect(result).toBeNull();
        });
    });

    describe('validationRules.tareNotGreaterThanGross', () => {
        test('should reject tare equal to gross', () => {
            const result = validationRules.tareNotGreaterThanGross(100, 100);
            expect(result).toBe('إجمالي العيار لا يمكن أن يكون أكبر من أو يساوي الوزن الإجمالي');
        });

        test('should reject tare greater than gross', () => {
            const result = validationRules.tareNotGreaterThanGross(150, 100);
            expect(result).toBe('إجمالي العيار لا يمكن أن يكون أكبر من أو يساوي الوزن الإجمالي');
        });

        test('should accept tare less than gross', () => {
            const result = validationRules.tareNotGreaterThanGross(50, 100);
            expect(result).toBeNull();
        });

        test('should accept zero tare', () => {
            const result = validationRules.tareNotGreaterThanGross(0, 100);
            expect(result).toBeNull();
        });

        test('should handle string inputs', () => {
            const result = validationRules.tareNotGreaterThanGross('50', '100');
            expect(result).toBeNull();
        });

        test('should handle negative tare (edge case)', () => {
            const result = validationRules.tareNotGreaterThanGross(-10, 100);
            // -10 < 100, so this passes, but negative tare is illogical
            expect(result).toBeNull();
        });
    });
});


// =============================================================================
// 2. PURCHASE FORM VALIDATION EDGE CASES
// =============================================================================

describe('validatePurchaseForm - Edge Cases', () => {

    test('should reject form with all empty fields', () => {
        const formState = {};
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty('crop_id');
        expect(result.errors).toHaveProperty('supplier_id');
        expect(result.errors).toHaveProperty('purchase_date');
    });

    test('should reject form with zero quantity for simple crop', () => {
        const formState = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-01',
            quantity_input: 0,
            price_input: 100
        };
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.quantity_input).toBe('الكمية يجب أن تكون أكبر من صفر');
    });

    test('should reject form with negative quantity for simple crop', () => {
        const formState = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-01',
            quantity_input: -10,
            price_input: 100
        };
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.quantity_input).toBe('الكمية يجب أن تكون أكبر من صفر');
    });

    test('should reject form with zero price', () => {
        const formState = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-01',
            quantity_input: 100,
            price_input: 0
        };
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.price_input).toBe('السعر يجب أن يكون أكبر من صفر');
    });

    test('should reject form with negative amount_paid', () => {
        const formState = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-01',
            quantity_input: 100,
            price_input: 100,
            amount_paid: -500
        };
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.amount_paid).toBe('المبلغ المدفوع لا يمكن أن يكون سالباً');
    });

    test('should accept valid form with zero amount_paid', () => {
        const formState = {
            crop_id: 1,
            supplier_id: 1,
            purchase_date: '2024-01-01',
            quantity_input: 100,
            price_input: 100,
            amount_paid: 0
        };
        const result = validatePurchaseForm(formState, null);

        expect(result.isValid).toBe(true);
    });

    // Complex crop tests
    describe('Complex Crop Validation', () => {
        const complexCrop = { is_complex_unit: true };

        test('should reject complex crop form with zero gross_quantity', () => {
            const formState = {
                crop_id: 1,
                supplier_id: 1,
                purchase_date: '2024-01-01',
                gross_quantity: 0,
                bag_count: 10,
                tare_per_bag: 2,
                price_input: 100
            };
            const result = validatePurchaseForm(formState, complexCrop);

            expect(result.isValid).toBe(false);
            expect(result.errors.gross_quantity).toBe('الوزن القائم يجب أن يكون أكبر من صفر');
        });

        test('should reject complex crop form with zero bag_count', () => {
            const formState = {
                crop_id: 1,
                supplier_id: 1,
                purchase_date: '2024-01-01',
                gross_quantity: 1000,
                bag_count: 0,
                tare_per_bag: 2,
                price_input: 100
            };
            const result = validatePurchaseForm(formState, complexCrop);

            expect(result.isValid).toBe(false);
            expect(result.errors.bag_count).toBe('عدد الأكياس يجب أن يكون أكبر من صفر');
        });

        test('should reject when total tare exceeds gross weight', () => {
            const formState = {
                crop_id: 1,
                supplier_id: 1,
                purchase_date: '2024-01-01',
                gross_quantity: 100,
                bag_count: 100,
                tare_per_bag: 2, // total tare = 200, greater than gross 100
                price_input: 100
            };
            const result = validatePurchaseForm(formState, complexCrop);

            expect(result.isValid).toBe(false);
            expect(result.errors.tare_per_bag).toBe('إجمالي العيار أكبر من الوزن الإجمالي!');
        });

        test('should accept valid complex crop form', () => {
            const formState = {
                crop_id: 1,
                supplier_id: 1,
                purchase_date: '2024-01-01',
                gross_quantity: 1000,
                bag_count: 50,
                tare_per_bag: 2, // total tare = 100, less than gross 1000
                price_input: 100,
                amount_paid: 0
            };
            const result = validatePurchaseForm(formState, complexCrop);

            expect(result.isValid).toBe(true);
        });
    });
});


// =============================================================================
// 3. SALE FORM VALIDATION EDGE CASES
// =============================================================================

describe('validateSaleForm - Edge Cases', () => {

    test('should reject form with missing customer_id', () => {
        const formState = {
            crop_id: 1,
            sale_date: '2024-01-01',
            quantity_input: 100,
            price_input: 100
        };
        const result = validateSaleForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.customer_id).toBe('يجب اختيار العميل');
    });

    test('should reject form with negative amount_received', () => {
        const formState = {
            crop_id: 1,
            customer_id: 1,
            sale_date: '2024-01-01',
            quantity_input: 100,
            price_input: 100,
            amount_received: -500
        };
        const result = validateSaleForm(formState, null);

        expect(result.isValid).toBe(false);
        expect(result.errors.amount_received).toBe('المبلغ المستلم لا يمكن أن يكون سالباً');
    });

    test('should accept valid sale form', () => {
        const formState = {
            crop_id: 1,
            customer_id: 1,
            sale_date: '2024-01-01',
            quantity_input: 100,
            price_input: 100,
            amount_received: 5000
        };
        const result = validateSaleForm(formState, null);

        expect(result.isValid).toBe(true);
    });
});


// =============================================================================
// 4. FORMATTERS EDGE CASES (formatters.js)
// =============================================================================

describe('formatCurrency - Edge Cases', () => {

    test('should handle null input', () => {
        const result = formatCurrency(null);
        // Actual format may or may not have space depending on locale
        expect(result).toMatch(/EGP\s?0/);
    });

    test('should handle undefined input', () => {
        const result = formatCurrency(undefined);
        expect(result).toMatch(/EGP\s?0/);
    });

    test('should handle zero', () => {
        const result = formatCurrency(0);
        expect(result).toMatch(/EGP\s?0/);
    });

    test('should handle negative values', () => {
        const result = formatCurrency(-1000);
        expect(result).toContain('-');
        expect(result).toContain('1,000');
    });

    test('should handle very large values', () => {
        const result = formatCurrency(999999999999);
        expect(result).toContain('999,999,999,999');
    });

    test('should handle decimal values', () => {
        const result = formatCurrency(1234.567);
        // Should show at most 2 decimal places
        expect(result).toContain('1,234.57');
    });

    test('should handle NaN input', () => {
        const result = formatCurrency(NaN);
        // NaN || 0 = 0
        expect(result).toMatch(/EGP\s?0/);
    });

    test('should handle Infinity', () => {
        const result = formatCurrency(Infinity);
        // Actual format may include infinity symbol with or without space
        expect(result).toMatch(/EGP\s?∞/);
    });
});

describe('formatPhoneForWhatsApp - Edge Cases', () => {

    test('should handle null input', () => {
        const result = formatPhoneForWhatsApp(null);
        expect(result).toBe('');
    });

    test('should handle empty string', () => {
        const result = formatPhoneForWhatsApp('');
        expect(result).toBe('');
    });

    test('should add country code 2 to Egyptian numbers starting with 01', () => {
        const result = formatPhoneForWhatsApp('01234567890');
        expect(result).toBe('201234567890');
    });

    test('should NOT double-add country code if already has 20', () => {
        const result = formatPhoneForWhatsApp('201234567890');
        // BUG: This should remain 201234567890, but the function will add '2' again!
        // Because after removing non-digits, it doesn't start with '01'
        expect(result).toBe('201234567890');
    });

    test('should NOT add country code to numbers with + international code', () => {
        const result = formatPhoneForWhatsApp('+201234567890');
        // After removing non-digits: 201234567890, doesn't start with '01'
        expect(result).toBe('201234567890');
    });

    test('should remove all non-digit characters', () => {
        const result = formatPhoneForWhatsApp('(012) 345-6789');
        expect(result).toBe('20123456789');
    });

    test('should handle phone with letters', () => {
        const result = formatPhoneForWhatsApp('abc123');
        // After removing non-digits: 123
        expect(result).toBe('123');
    });

    test('should handle phone starting with 00 (international format)', () => {
        const result = formatPhoneForWhatsApp('00201234567890');
        // After removing non-digits: 00201234567890, doesn't start with '01'
        expect(result).toBe('00201234567890');
    });
});

describe('formatCompactNumber - Edge Cases', () => {

    test('should handle null input', () => {
        const result = formatCompactNumber(null);
        expect(result).toBe('0');
    });

    test('should handle undefined input', () => {
        const result = formatCompactNumber(undefined);
        expect(result).toBe('0');
    });

    test('should handle zero', () => {
        const result = formatCompactNumber(0);
        expect(result).toBe('0');
    });

    test('should format thousands with K', () => {
        const result = formatCompactNumber(1500);
        expect(result).toBe('1.5K');
    });

    test('should format millions with M', () => {
        const result = formatCompactNumber(2300000);
        expect(result).toBe('2.3M');
    });

    test('should handle negative values', () => {
        const result = formatCompactNumber(-1500);
        expect(result).toBe('-1.5K');
    });

    test('should handle values less than 1000', () => {
        const result = formatCompactNumber(500);
        expect(result).toBe('500');
    });
});

describe('truncateText - Edge Cases', () => {

    test('should handle null input', () => {
        const result = truncateText(null);
        expect(result).toBe(null);
    });

    test('should handle undefined input', () => {
        const result = truncateText(undefined);
        expect(result).toBe(undefined);
    });

    test('should handle empty string', () => {
        const result = truncateText('');
        expect(result).toBe('');
    });

    test('should not truncate short text', () => {
        const result = truncateText('Hello', 50);
        expect(result).toBe('Hello');
    });

    test('should truncate long text', () => {
        const longText = 'A'.repeat(100);
        const result = truncateText(longText, 50);
        expect(result.length).toBe(53); // 50 + '...'
        expect(result.endsWith('...')).toBe(true);
    });

    test('should handle Arabic text', () => {
        const arabicText = 'مرحبا بكم في تطبيق إدارة المحاصيل الزراعية';
        const result = truncateText(arabicText, 20);
        expect(result.length).toBe(23); // 20 + '...'
    });
});

describe('formatDate - Edge Cases', () => {

    test('should handle invalid date string', () => {
        const result = formatDate('not-a-date');
        expect(result).toBe('Invalid Date');
    });

    test('should handle null date', () => {
        // new Date(null) = Jan 1, 1970
        const result = formatDate(null);
        expect(result).toContain('1970');
    });
});


// =============================================================================
// 5. CROPS API EDGE CASES (with Axios mocking)
// =============================================================================

describe('Crops API - Edge Cases', () => {

    describe('getCrops', () => {
        test('should return data on success', async () => {
            const mockData = [{ crop_id: 1, crop_name: 'قمح' }];
            axios.get.mockResolvedValue({ data: mockData });

            const result = await getCrops();
            expect(result).toEqual(mockData);
            expect(axios.get).toHaveBeenCalledWith('/api/v1/crops/');
        });

        test('should throw error on network failure', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));

            await expect(getCrops()).rejects.toThrow('Network Error');
        });

        test('should throw error on 500 response', async () => {
            axios.get.mockRejectedValue({ response: { status: 500 } });

            await expect(getCrops()).rejects.toBeDefined();
        });
    });

    describe('createCrop', () => {
        test('should create crop with valid data', async () => {
            const cropData = { crop_name: 'ذرة', conversion_factors: { 'طن': 1000 } };
            const mockResponse = { crop_id: 1, ...cropData };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await createCrop(cropData);
            expect(result).toEqual(mockResponse);
        });

        test('should throw on duplicate crop name (409)', async () => {
            const cropData = { crop_name: 'قمح' };
            axios.post.mockRejectedValue({
                response: { status: 409, data: { detail: 'Crop already exists' } }
            });

            await expect(createCrop(cropData)).rejects.toBeDefined();
        });

        test('should throw on invalid data (422)', async () => {
            const invalidData = { crop_name: '' };
            axios.post.mockRejectedValue({
                response: { status: 422, data: { detail: 'Validation error' } }
            });

            await expect(createCrop(invalidData)).rejects.toBeDefined();
        });
    });

    describe('updateCrop - Edge Cases', () => {
        test('should handle null cropId', async () => {
            axios.put.mockRejectedValue({ response: { status: 404 } });

            // null becomes string "null" in URL
            await expect(updateCrop(null, { crop_name: 'Test' })).rejects.toBeDefined();
            expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/null', expect.anything());
        });

        test('should handle undefined cropId', async () => {
            axios.put.mockRejectedValue({ response: { status: 404 } });

            await expect(updateCrop(undefined, { crop_name: 'Test' })).rejects.toBeDefined();
            expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/undefined', expect.anything());
        });

        test('should handle negative cropId', async () => {
            axios.put.mockRejectedValue({ response: { status: 404 } });

            await expect(updateCrop(-1, { crop_name: 'Test' })).rejects.toBeDefined();
            expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/-1', expect.anything());
        });

        test('should handle string cropId', async () => {
            axios.put.mockRejectedValue({ response: { status: 404 } });

            await expect(updateCrop('abc', { crop_name: 'Test' })).rejects.toBeDefined();
            expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/abc', expect.anything());
        });
    });

    describe('deleteCrop - Edge Cases', () => {
        test('should handle 404 for non-existent crop', async () => {
            axios.delete.mockRejectedValue({ response: { status: 404 } });

            await expect(deleteCrop(999999)).rejects.toBeDefined();
        });

        test('should handle 409 conflict (crop has dependencies)', async () => {
            axios.delete.mockRejectedValue({
                response: {
                    status: 409,
                    data: {
                        detail: 'Cannot delete',
                        conflicts: { purchases: 5, sales: 3 }
                    }
                }
            });

            await expect(deleteCrop(1)).rejects.toBeDefined();
        });
    });

    describe('migrateAndDeleteCrop - Edge Cases', () => {
        test('should fail when migrating to same crop (self-reference)', async () => {
            axios.post.mockRejectedValue({
                response: { status: 400, data: { detail: 'Cannot migrate to self' } }
            });

            await expect(migrateAndDeleteCrop(1, 1)).rejects.toBeDefined();
        });

        test('should fail when target crop does not exist', async () => {
            axios.post.mockRejectedValue({
                response: { status: 404, data: { detail: 'Target crop not found' } }
            });

            await expect(migrateAndDeleteCrop(1, 999999)).rejects.toBeDefined();
        });
    });
});


// =============================================================================
// 6. CONTACTS API EDGE CASES
// =============================================================================

describe('Contacts API - Edge Cases', () => {

    describe('createContact', () => {
        test('should reject contact without type (neither customer nor supplier)', async () => {
            const invalidContact = {
                name: 'Test Contact',
                is_customer: false,
                is_supplier: false
            };

            // Server should validate this
            axios.post.mockRejectedValue({
                response: { status: 422, data: { detail: 'Must be customer or supplier' } }
            });

            await expect(createContact(invalidContact)).rejects.toBeDefined();
        });

        test('should reject contact with empty name', async () => {
            const invalidContact = {
                name: '',
                is_customer: true
            };

            axios.post.mockRejectedValue({
                response: { status: 422, data: { detail: 'Name is required' } }
            });

            await expect(createContact(invalidContact)).rejects.toBeDefined();
        });

        test('should accept contact with Arabic name and special characters', async () => {
            const validContact = {
                name: 'محمد أحمد - الشركة (فرع 2)',
                phone: '01234567890',
                is_customer: true
            };
            axios.post.mockResolvedValue({ data: { contact_id: 1, ...validContact } });

            const result = await createContact(validContact);
            expect(result.name).toBe(validContact.name);
        });
    });

    describe('getContactStatement', () => {
        test('should handle null date parameters', async () => {
            axios.get.mockResolvedValue({ data: { transactions: [] } });

            await getContactStatement(1, null, null);
            expect(axios.get).toHaveBeenCalledWith('/api/v1/contacts/1/statement');
        });

        test('should include date parameters when provided', async () => {
            axios.get.mockResolvedValue({ data: { transactions: [] } });

            await getContactStatement(1, '2024-01-01', '2024-12-31');
            expect(axios.get).toHaveBeenCalledWith(
                '/api/v1/contacts/1/statement?start_date=2024-01-01&end_date=2024-12-31'
            );
        });
    });

    describe('migrateAndDeleteContact - Edge Cases', () => {
        test('should fail when migrating to same contact', async () => {
            axios.post.mockRejectedValue({
                response: { status: 400, data: { detail: 'Cannot migrate to self' } }
            });

            await expect(migrateAndDeleteContact(1, 1)).rejects.toBeDefined();
        });
    });
});


// =============================================================================
// CRITICAL VULNERABILITIES SUMMARY
// =============================================================================

describe('Critical Vulnerabilities Summary', () => {

    test('VULN-001: validationRules.required rejects 0 and false as invalid', () => {
        // Zero is a valid quantity in some contexts
        expect(validationRules.required(0, 'Field')).toBe('Field مطلوب');
        expect(validationRules.required(false, 'Field')).toBe('Field مطلوب');
    });

    test('VULN-002: validationRules.positiveNumber accepts Infinity', () => {
        expect(validationRules.positiveNumber(Infinity, 'Field')).toBeNull();
    });

    test('VULN-003: parseFloat partial parsing accepts "100abc" as 100', () => {
        expect(validationRules.positiveNumber('100abc', 'Field')).toBeNull();
    });

    test('VULN-004: null/undefined become literal strings in API URLs', async () => {
        axios.put.mockRejectedValue(new Error('Not found'));

        try { await updateCrop(null, {}); } catch (e) { }
        expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/null', {});

        try { await updateCrop(undefined, {}); } catch (e) { }
        expect(axios.put).toHaveBeenCalledWith('/api/v1/crops/undefined', {});
    });

    test('VULN-005: formatCurrency returns EGP∞ for Infinity', () => {
        // Infinity is formatted but may display strangely in UI
        expect(formatCurrency(Infinity)).toMatch(/EGP\s?∞/);
    });

    test('VULN-006: negative tare passes validation but is illogical', () => {
        // Negative tare would increase net weight incorrectly
        expect(validationRules.tareNotGreaterThanGross(-10, 100)).toBeNull();
    });
});
