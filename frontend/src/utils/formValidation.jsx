import React from 'react';

/**
 * Form validation utilities and components
 */

/**
 * Validation rules for purchase/sale forms
 */
export const validationRules = {
    required: (value, fieldName) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} مطلوب`;
        }
        return null;
    },

    positiveNumber: (value, fieldName) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            return `${fieldName} يجب أن يكون أكبر من صفر`;
        }
        return null;
    },

    nonNegative: (value, fieldName) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            return `${fieldName} لا يمكن أن يكون سالباً`;
        }
        return null;
    },

    tareNotGreaterThanGross: (tare, gross) => {
        if (parseFloat(tare) >= parseFloat(gross) && parseFloat(tare) > 0) {
            return 'إجمالي العيار لا يمكن أن يكون أكبر من أو يساوي الوزن الإجمالي';
        }
        return null;
    }
};

/**
 * Validate a full purchase form
 */
export function validatePurchaseForm(formState, currentCrop) {
    const errors = {};

    // Required fields
    if (!formState.crop_id) errors.crop_id = 'يجب اختيار المحصول';
    if (!formState.supplier_id) errors.supplier_id = 'يجب اختيار المورد';
    if (!formState.purchase_date) errors.purchase_date = 'يجب تحديد التاريخ';

    // Complex crop validation
    if (currentCrop?.is_complex_unit) {
        const gross = parseFloat(formState.gross_quantity) || 0;
        if (gross <= 0) errors.gross_quantity = 'الوزن القائم يجب أن يكون أكبر من صفر';

        const bags = parseInt(formState.bag_count) || 0;
        if (bags <= 0) errors.bag_count = 'عدد الأكياس يجب أن يكون أكبر من صفر';

        const tarePerBag = parseFloat(formState.tare_per_bag) || 0;
        const totalTare = bags * tarePerBag;
        if (totalTare >= gross && totalTare > 0) {
            errors.tare_per_bag = 'إجمالي العيار أكبر من الوزن الإجمالي!';
        }
    } else {
        // Simple crop
        const qty = parseFloat(formState.quantity_input) || 0;
        if (qty <= 0) errors.quantity_input = 'الكمية يجب أن تكون أكبر من صفر';
    }

    // Price validation
    const price = parseFloat(formState.price_input) || 0;
    if (price <= 0) errors.price_input = 'السعر يجب أن يكون أكبر من صفر';

    // Amount paid validation (optional but if provided should be valid)
    const paid = parseFloat(formState.amount_paid) || 0;
    if (paid < 0) errors.amount_paid = 'المبلغ المدفوع لا يمكن أن يكون سالباً';

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validate a full sale form
 */
export function validateSaleForm(formState, currentCrop) {
    const errors = {};

    // Required fields
    if (!formState.crop_id) errors.crop_id = 'يجب اختيار المحصول';
    if (!formState.customer_id) errors.customer_id = 'يجب اختيار العميل';
    if (!formState.sale_date) errors.sale_date = 'يجب تحديد التاريخ';

    // Quantity validation
    const qty = parseFloat(formState.quantity_input) || 0;
    if (qty <= 0) errors.quantity_input = 'الكمية يجب أن تكون أكبر من صفر';

    // Price validation
    const price = parseFloat(formState.price_input) || 0;
    if (price <= 0) errors.price_input = 'السعر يجب أن يكون أكبر من صفر';

    // Amount received validation (optional but if provided should be valid)
    const received = parseFloat(formState.amount_received) || 0;
    if (received < 0) errors.amount_received = 'المبلغ المستلم لا يمكن أن يكون سالباً';

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Inline validation message component
 */
export function ValidationMessage({ error }) {
    if (!error) return null;

    return (
        <div className="text-red-500 text-sm mt-1 block flex items-center">
            <i className="bi bi-exclamation-circle ml-1"></i>
            {error}
        </div>
    );
}

/**
 * Validation summary component (shows all errors)
 */
export function ValidationSummary({ errors }) {
    const errorList = Object.values(errors).filter(Boolean);

    if (errorList.length === 0) return null;

    return (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-4 rounded shadow-sm">
            <div className="flex">
                <i className="bi bi-exclamation-triangle-fill text-red-500 ml-2 mt-0.5"></i>
                <div>
                    <strong className="text-red-800">يرجى تصحيح الأخطاء التالية:</strong>
                    <ul className="list-disc list-inside mt-1 text-red-700 text-sm">
                        {errorList.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default { validatePurchaseForm, validateSaleForm, ValidationMessage, ValidationSummary };
