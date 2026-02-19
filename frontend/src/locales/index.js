/**
 * Locales Index
 * 
 * Central export for all localization resources
 */
import ar, { t } from './ar';

// Current locale
const currentLocale = 'ar';

// All available locales
const locales = {
    ar,
};

// Get current locale translations
export const getLocale = (locale = currentLocale) => locales[locale] || locales.ar;

// Export helper function and default locale
export { t };
export default ar;
