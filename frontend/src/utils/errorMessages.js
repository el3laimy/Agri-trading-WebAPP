/**
 * Error Messages - رسائل الخطأ بالعربية
 * Centralized error messages for consistent user experience
 */

// رسائل الخطأ حسب كود HTTP
export const HTTP_ERROR_MESSAGES = {
    400: 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.',
    401: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    403: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    404: 'العنصر المطلوب غير موجود.',
    409: 'يوجد تعارض في البيانات. قد يكون هذا العنصر موجوداً بالفعل.',
    422: 'البيانات المدخلة غير صالحة. يرجى التحقق من القيم المدخلة.',
    429: 'تم إجراء عدد كبير من الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    500: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
    502: 'الخادم غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
    503: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى لاحقاً.',
    504: 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
};

// رسائل الخطأ حسب نوع العملية
export const OPERATION_ERROR_MESSAGES = {
    // عمليات عامة
    create: 'فشل في إنشاء العنصر. يرجى المحاولة مرة أخرى.',
    update: 'فشل في تحديث العنصر. يرجى المحاولة مرة أخرى.',
    delete: 'فشل في حذف العنصر. يرجى المحاولة مرة أخرى.',
    fetch: 'فشل في تحميل البيانات. يرجى تحديث الصفحة.',

    // المبيعات
    sale_create: 'فشل في تسجيل عملية البيع.',
    sale_update: 'فشل في تحديث عملية البيع.',
    sale_delete: 'فشل في حذف عملية البيع.',
    sale_payment: 'فشل في تسجيل الدفعة.',

    // المشتريات
    purchase_create: 'فشل في تسجيل عملية الشراء.',
    purchase_update: 'فشل في تحديث عملية الشراء.',
    purchase_delete: 'فشل في حذف عملية الشراء.',
    purchase_payment: 'فشل في تسجيل الدفعة.',

    // الخزينة
    treasury_create: 'فشل في تنفيذ العملية المالية.',
    treasury_delete: 'فشل في حذف العملية.',

    // المخزون
    inventory_fetch: 'فشل في تحميل بيانات المخزون.',
    inventory_adjust: 'فشل في تسجيل تسوية المخزون.',

    // جهات الاتصال
    contact_create: 'فشل في إضافة جهة الاتصال.',
    contact_update: 'فشل في تحديث جهة الاتصال.',
    contact_delete: 'فشل في حذف جهة الاتصال.',

    // المحاصيل
    crop_create: 'فشل في إضافة المحصول.',
    crop_update: 'فشل في تحديث المحصول.',
    crop_delete: 'فشل في حذف المحصول.',

    // المصروفات
    expense_create: 'فشل في تسجيل المصروف.',
    expense_delete: 'فشل في حذف المصروف.',

    // الحسابات المالية
    account_create: 'فشل في إنشاء الحساب.',
    account_delete: 'فشل في حذف الحساب. قد يكون مرتبطاً بمعاملات.',

    // المستخدمين
    user_create: 'فشل في إضافة المستخدم.',
    user_delete: 'فشل في حذف المستخدم.',

    // التقارير
    report_generate: 'فشل في إعداد التقرير.',
};

// رسائل التحقق من النموذج
export const VALIDATION_MESSAGES = {
    required: 'هذا الحقل مطلوب.',
    invalid_email: 'البريد الإلكتروني غير صحيح.',
    invalid_phone: 'رقم الهاتف غير صحيح.',
    invalid_number: 'يرجى إدخال رقم صحيح.',
    invalid_date: 'التاريخ غير صحيح.',
    min_value: (min) => `القيمة يجب أن تكون ${min} على الأقل.`,
    max_value: (max) => `القيمة يجب ألا تتجاوز ${max}.`,
    form_errors: 'يرجى تصحيح الأخطاء في النموذج.',
    insufficient_stock: (available) => `المخزون غير كافٍ. المتاح: ${available} كجم.`,
    percentage_exceeded: 'مجموع النسب يتجاوز 100%.',
};

// رسائل الشبكة
export const NETWORK_ERROR_MESSAGES = {
    offline: 'أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.',
    timeout: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.',
    unknown: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
};

/**
 * معالجة أخطاء API وإرجاع رسالة مناسبة للمستخدم
 * @param {Error} error - الخطأ من axios أو fetch
 * @param {string} operation - نوع العملية (مثل 'sale_create')
 * @returns {string} رسالة خطأ واضحة بالعربية
 */
export function handleApiError(error, operation = 'unknown') {
    // 1. التحقق من عدم الاتصال بالإنترنت
    if (!navigator.onLine) {
        return NETWORK_ERROR_MESSAGES.offline;
    }

    // 2. أخطاء الشبكة (لا يوجد response)
    if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return NETWORK_ERROR_MESSAGES.timeout;
        }
        return NETWORK_ERROR_MESSAGES.unknown;
    }

    const { status, data } = error.response;

    // 3. رسالة من الخادم (إذا كانت بالعربية ومفهومة)
    const serverMessage = data?.detail || data?.message;
    if (serverMessage && typeof serverMessage === 'string' && /[\u0600-\u06FF]/.test(serverMessage)) {
        // الرسالة تحتوي على نص عربي - استخدمها مباشرة
        return serverMessage;
    }

    // 4. رسالة حسب كود HTTP
    if (HTTP_ERROR_MESSAGES[status]) {
        return HTTP_ERROR_MESSAGES[status];
    }

    // 5. رسالة حسب نوع العملية
    if (OPERATION_ERROR_MESSAGES[operation]) {
        return OPERATION_ERROR_MESSAGES[operation];
    }

    // 6. رسالة افتراضية
    return NETWORK_ERROR_MESSAGES.unknown;
}

/**
 * معالجة أخطاء التحقق من النموذج
 * @param {Object} validationErrors - أخطاء التحقق من Zod أو غيره
 * @returns {string} رسالة خطأ مجمعة
 */
export function formatValidationErrors(validationErrors) {
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
        return VALIDATION_MESSAGES.form_errors;
    }

    const errorList = Object.values(validationErrors)
        .filter(Boolean)
        .slice(0, 3); // أول 3 أخطاء فقط

    if (errorList.length === 0) {
        return VALIDATION_MESSAGES.form_errors;
    }

    return errorList.join(' • ');
}

export default {
    HTTP_ERROR_MESSAGES,
    OPERATION_ERROR_MESSAGES,
    VALIDATION_MESSAGES,
    NETWORK_ERROR_MESSAGES,
    handleApiError,
    formatValidationErrors,
};
