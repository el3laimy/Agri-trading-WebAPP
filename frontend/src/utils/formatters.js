/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a number as Egyptian currency (EGP)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * Format a number with Arabic locale
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value || 0);
}

/**
 * Format a date string to Arabic locale
 * @param {string|Date} dateString - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    return new Date(dateString).toLocaleDateString('en-GB', defaultOptions);
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string for input
 */
export function formatDateForInput(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

/**
 * Format large numbers in abbreviated form (e.g., 1.5K, 2.3M)
 * @param {number} value - The number to format
 * @returns {string} Abbreviated number string
 */
export function formatCompactNumber(value) {
    if (!value && value !== 0) return '0';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1000000) {
        return sign + (absValue / 1000000).toFixed(1) + 'M';
    }
    if (absValue >= 1000) {
        return sign + (absValue / 1000).toFixed(1) + 'K';
    }
    return sign + absValue.toString();
}

/**
 * Format a percentage value
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
    return `${(value || 0).toFixed(decimals)}%`;
}

/**
 * Format phone number for WhatsApp
 * @param {string} phone - The phone number
 * @returns {string} Cleaned phone number for WhatsApp
 */
export function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
        cleanPhone = '2' + cleanPhone;
    }
    return cleanPhone;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Format a timestamp as relative time (e.g., "منذ 5 دقائق")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Relative time string in Arabic
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(timestamp, { day: 'numeric', month: 'short' });
}

/**
 * Format currency with optional compact mode for large numbers
 * @param {number} amount - The amount to format
 * @param {boolean} compact - Whether to use compact format (e.g., 1.5 م, 3.2 ك)
 * @returns {string} Formatted currency string
 */
export function formatCurrencyCompact(amount, compact = false) {
    if (compact && Math.abs(amount) >= 1000000) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 1, maximumFractionDigits: 1
        }).format(amount / 1000000) + ' م';
    }
    if (compact && Math.abs(amount) >= 1000) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount / 1000) + ' ك';
    }
    return formatCurrency(amount);
}
