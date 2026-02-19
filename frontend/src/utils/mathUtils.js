/**
 * Safely parses a value to a float number.
 * Returns the default value (0) if parsing fails or results in NaN.
 * 
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Fallback value (default: 0)
 * @returns {number} The parsed number or default value
 */
export const safeParseFloat = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely parses a value to an integer.
 * Returns the default value (0) if parsing fails.
 * 
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Fallback value (default: 0)
 * @returns {number} The parsed integer or default value
 */
export const safeParseInt = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
