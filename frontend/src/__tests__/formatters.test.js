/**
 * Formatters Utils Tests
 * 
 * Tests for utils/formatters.js
 * Target coverage: 100%
 */

import { describe, test, expect } from 'vitest';
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

describe('Formatters Utils', () => {

    test('formatCurrency should format EGP', () => {
        // Implementation might default to 0 decimals if value is integer depending on locale behavior or code
        // Code says: minimumFractionDigits: 0, maximumFractionDigits: 2
        // So 100 -> 100, 100.5 -> 100.5, 100.50 -> 100.5 (maybe)
        // Let's broaden the regex to optionally accept decimals
        expect(formatCurrency(100)).toMatch(/EGP\s?100(\.00)?/);
        expect(formatCurrency(0)).toMatch(/EGP\s?0(\.00)?/);
        // Handle potential different space chars
        const result = formatCurrency(1234.56);
        expect(result).toContain('1,234.56');
    });

    test('formatNumber should format decimals', () => {
        expect(formatNumber(100, 2)).toBe('100.00');
        expect(formatNumber(1234, 0)).toBe('1,234');
        expect(formatNumber(null)).toBe('0');
    });

    test('formatDate should format locale date', () => {
        const date = new Date('2024-01-01');
        // Check parts to avoid locale strictness
        const result = formatDate(date);
        expect(result).toContain('2024');
        expect(result).toContain('Jan');
    });

    test('formatDateForInput should return YYYY-MM-DD', () => {
        const date = new Date('2024-05-20');
        expect(formatDateForInput(date)).toBe('2024-05-20');
    });

    test('formatCompactNumber should abbreviate', () => {
        expect(formatCompactNumber(500)).toBe('500');
        expect(formatCompactNumber(1500)).toBe('1.5K');
        expect(formatCompactNumber(2500000)).toBe('2.5M');
        expect(formatCompactNumber(-1200)).toBe('-1.2K');
        expect(formatCompactNumber(0)).toBe('0');
        expect(formatCompactNumber(null)).toBe('0');
    });

    test('formatPercentage should format percent', () => {
        expect(formatPercentage(50.5)).toBe('50.5%');
        expect(formatPercentage(10, 0)).toBe('10%');
        expect(formatPercentage(null)).toBe('0.0%');
    });

    test('formatPhoneForWhatsApp should add country code', () => {
        expect(formatPhoneForWhatsApp('01012345678')).toBe('201012345678');
        expect(formatPhoneForWhatsApp('201012345678')).toBe('201012345678');
        expect(formatPhoneForWhatsApp('')).toBe('');
    });

    test('truncateText should cut string', () => {
        expect(truncateText('Hello World', 5)).toBe('Hello...');
        expect(truncateText('Short', 10)).toBe('Short');
        expect(truncateText(null)).toBeNull();
    });
});
