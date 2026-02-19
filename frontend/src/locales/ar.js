/**
 * Arabic Localization File
 * 
 * This module contains all Arabic translations used in the application.
 * Organized by section/feature for easy maintenance.
 */

const ar = {
    // App General
    app: {
        name: 'نظام المحاسبة الزراعية',
        version: 'الإصدار 1.0',
        copyright: '© 2024 جميع الحقوق محفوظة',
    },

    // Common Actions
    actions: {
        add: 'إضافة',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        close: 'إغلاق',
        search: 'بحث',
        filter: 'تصفية',
        refresh: 'تحديث',
        export: 'تصدير',
        import: 'استيراد',
        print: 'طباعة',
        confirm: 'تأكيد',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        loading: 'جاري التحميل...',
        submit: 'إرسال',
        reset: 'إعادة تعيين',
    },

    // Common Labels
    labels: {
        date: 'التاريخ',
        amount: 'المبلغ',
        quantity: 'الكمية',
        price: 'السعر',
        total: 'الإجمالي',
        notes: 'ملاحظات',
        status: 'الحالة',
        name: 'الاسم',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        description: 'الوصف',
        createdAt: 'تاريخ الإنشاء',
        updatedAt: 'تاريخ التحديث',
        createdBy: 'بواسطة',
    },

    // Navigation
    nav: {
        dashboard: 'لوحة التحكم',
        sales: 'المبيعات',
        purchases: 'المشتريات',
        inventory: 'المخزون',
        contacts: 'جهات الاتصال',
        treasury: 'الخزينة',
        expenses: 'المصروفات',
        crops: 'المحاصيل',
        reports: 'التقارير',
        settings: 'الإعدادات',
        users: 'المستخدمين',
        logout: 'تسجيل الخروج',
    },

    // Authentication
    auth: {
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        loginSuccess: 'تم تسجيل الدخول بنجاح',
        loginError: 'خطأ في اسم المستخدم أو كلمة المرور',
        welcome: 'مرحباً بك',
    },

    // Dashboard
    dashboard: {
        title: 'لوحة التحكم',
        greeting: {
            morning: 'صباح الخير',
            afternoon: 'مساء الخير',
            evening: 'مساء الخير',
        },
        overview: 'نظرة عامة على أداء المزرعة',
        lastUpdate: 'آخر تحديث',
        kpis: {
            todaySales: 'مبيعات اليوم',
            netProfit: 'صافي الربح',
            inventoryValue: 'قيمة المخزون',
            cashBalance: 'الرصيد النقدي',
            receivables: 'الذمم المدينة',
            payables: 'الذمم الدائنة',
        },
    },

    // Sales
    sales: {
        title: 'إدارة المبيعات',
        subtitle: 'إدارة وتتبع جميع عمليات البيع',
        addSale: 'إضافة عملية بيع',
        editSale: 'تعديل عملية البيع',
        saleId: 'رقم العملية',
        customer: 'العميل',
        crop: 'المحصول',
        saleDate: 'تاريخ البيع',
        quantity: 'الكمية (كجم)',
        unitPrice: 'سعر الوحدة',
        totalAmount: 'إجمالي المبلغ',
        amountReceived: 'المبلغ المستلم',
        remaining: 'المتبقي',
        paymentStatus: {
            paid: 'مدفوع',
            partial: 'جزئي',
            pending: 'معلق',
        },
        invoice: 'الفاتورة',
        downloadInvoice: 'تحميل الفاتورة',
        success: {
            created: 'تم تسجيل عملية البيع بنجاح',
            updated: 'تم تحديث عملية البيع بنجاح',
            deleted: 'تم حذف عملية البيع بنجاح',
        },
    },

    // Purchases
    purchases: {
        title: 'إدارة المشتريات',
        subtitle: 'إدارة وتتبع جميع عمليات الشراء',
        addPurchase: 'إضافة عملية شراء',
        editPurchase: 'تعديل عملية الشراء',
        purchaseId: 'رقم العملية',
        supplier: 'المورد',
        crop: 'المحصول',
        purchaseDate: 'تاريخ الشراء',
        quantity: 'الكمية (كجم)',
        unitPrice: 'سعر الوحدة',
        totalCost: 'إجمالي التكلفة',
        amountPaid: 'المبلغ المدفوع',
        remaining: 'المتبقي',
        success: {
            created: 'تم تسجيل عملية الشراء بنجاح',
            updated: 'تم تحديث عملية الشراء بنجاح',
            deleted: 'تم حذف عملية الشراء بنجاح',
        },
    },

    // Inventory
    inventory: {
        title: 'المخزون',
        subtitle: 'عرض وإدارة مستويات المخزون',
        currentStock: 'المخزون الحالي',
        averageCost: 'متوسط التكلفة',
        totalValue: 'القيمة الإجمالية',
        lowStock: 'مخزون منخفض',
        adjustment: 'تعديل المخزون',
    },

    // Treasury
    treasury: {
        title: 'الخزينة',
        subtitle: 'إدارة الحسابات والتحويلات المالية',
        balance: 'الرصيد',
        deposit: 'إيداع',
        withdraw: 'سحب',
        transfer: 'تحويل',
    },

    // Contacts
    contacts: {
        title: 'جهات الاتصال',
        subtitle: 'إدارة الموردين والعملاء',
        addContact: 'إضافة جهة اتصال',
        supplier: 'مورد',
        customer: 'عميل',
        type: 'النوع',
    },

    // Reports
    reports: {
        title: 'التقارير',
        balanceSheet: 'الميزانية العمومية',
        incomeStatement: 'قائمة الدخل',
        cashFlow: 'التدفق النقدي',
        cropPerformance: 'أداء المحاصيل',
        debtReport: 'تقرير الديون',
    },

    // Errors
    errors: {
        general: 'حدث خطأ غير متوقع',
        network: 'خطأ في الاتصال',
        notFound: 'لم يتم العثور على المورد المطلوب',
        unauthorized: 'غير مصرح لك بهذا الإجراء',
        validation: 'يرجى تصحيح الأخطاء في النموذج',
        required: 'هذا الحقل مطلوب',
        invalidEmail: 'البريد الإلكتروني غير صالح',
        invalidPhone: 'رقم الهاتف غير صالح',
        minLength: 'يجب أن يكون على الأقل {min} أحرف',
        maxLength: 'يجب ألا يتجاوز {max} أحرف',
    },

    // Confirmations
    confirmations: {
        delete: 'هل أنت متأكد من الحذف؟',
        deleteItem: 'هل أنت متأكد من حذف {item}؟',
        unsavedChanges: 'لديك تغييرات غير محفوظة. هل تريد المتابعة؟',
    },

    // Empty States
    empty: {
        noData: 'لا توجد بيانات',
        noResults: 'لا توجد نتائج للبحث',
        noSales: 'لا توجد عمليات بيع',
        noPurchases: 'لا توجد عمليات شراء',
        noContacts: 'لا توجد جهات اتصال',
    },

    // Units
    units: {
        kg: 'كجم',
        ton: 'طن',
        qantar: 'قنطار',
        ardeb: 'أردب',
        bag: 'شيكارة',
        egp: 'ج.م',
    },
};

export default ar;

// Helper function to get nested translation
export const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = ar;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key; // Return key if not found
        }
    }

    // Replace parameters like {min}, {max}, {item}
    if (typeof value === 'string') {
        return value.replace(/{(\w+)}/g, (_, p) => params[p] ?? `{${p}}`);
    }

    return value;
};
