import React from 'react';

/**
 * مكون Empty State قابل لإعادة الاستخدام
 * يُستخدم لعرض رسالة ودية عند عدم وجود بيانات
 */
function EmptyState({
    icon = 'bi-inbox',
    title = 'لا توجد بيانات',
    message = 'لم يتم العثور على أي سجلات',
    actionLabel = null,
    onAction = null,
    variant = 'default' // default, success, warning, info
}) {
    const variants = {
        default: { bg: 'bg-gray-50', iconColor: 'text-gray-500', border: 'border-gray-300' },
        success: { bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-300' },
        warning: { bg: 'bg-amber-50', iconColor: 'text-amber-500', border: 'border-amber-300' },
        info: { bg: 'bg-blue-50', iconColor: 'text-blue-500', border: 'border-blue-300' }
    };

    const style = variants[variant] || variants.default;

    return (
        <div className={`text-center py-12 px-6 rounded-xl border-2 border-dashed ${style.bg} ${style.border}`}>
            <div className="w-20 h-20 rounded-full bg-white shadow-md inline-flex items-center justify-center mb-4">
                <i className={`bi ${icon} text-4xl ${style.iconColor}`}></i>
            </div>

            <h5 className="font-bold text-gray-800 mb-2 text-lg">
                {title}
            </h5>

            <p className="text-gray-500 mb-4 max-w-xs mx-auto">
                {message}
            </p>

            {actionLabel && onAction && (
                <button
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    onClick={onAction}
                >
                    <i className="bi bi-plus-circle"></i>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/**
 * Empty States جاهزة للاستخدام
 */

// للمبيعات
export const EmptySales = ({ onAdd }) => (
    <EmptyState
        icon="bi-cart-x"
        title="لا توجد مبيعات"
        message="لم يتم تسجيل أي مبيعات بعد. ابدأ بإضافة عملية بيع جديدة."
        actionLabel="إضافة بيع"
        onAction={onAdd}
        variant="info"
    />
);

// للمشتريات
export const EmptyPurchases = ({ onAdd }) => (
    <EmptyState
        icon="bi-bag-x"
        title="لا توجد مشتريات"
        message="لم يتم تسجيل أي مشتريات بعد. ابدأ بإضافة عملية شراء جديدة."
        actionLabel="إضافة شراء"
        onAction={onAdd}
        variant="info"
    />
);

// للمخزون
export const EmptyInventory = () => (
    <EmptyState
        icon="bi-box-seam"
        title="المخزون فارغ"
        message="لا توجد محاصيل في المخزون حالياً. سيتم تحديث المخزون تلقائياً عند إضافة مشتريات."
        variant="warning"
    />
);

// لجهات التعامل
export const EmptyContacts = ({ onAdd }) => (
    <EmptyState
        icon="bi-people"
        title="لا توجد جهات تعامل"
        message="لم يتم إضافة أي عملاء أو موردين بعد."
        actionLabel="إضافة جهة تعامل"
        onAction={onAdd}
        variant="default"
    />
);

// للمحاصيل
export const EmptyCrops = ({ onAdd }) => (
    <EmptyState
        icon="bi-flower1"
        title="لا توجد محاصيل"
        message="لم يتم تعريف أي محاصيل بعد. ابدأ بإضافة المحاصيل التي تتعامل بها."
        actionLabel="إضافة محصول"
        onAction={onAdd}
        variant="success"
    />
);

// للمصروفات
export const EmptyExpenses = ({ onAdd }) => (
    <EmptyState
        icon="bi-cash-coin"
        title="لا توجد مصروفات"
        message="لم يتم تسجيل أي مصروفات بعد."
        actionLabel="إضافة مصروف"
        onAction={onAdd}
        variant="default"
    />
);

// للحركات المالية
export const EmptyTransactions = () => (
    <EmptyState
        icon="bi-journal-text"
        title="لا توجد حركات"
        message="لم يتم تسجيل أي حركات مالية في هذه الفترة."
        variant="default"
    />
);

// للتقارير
export const EmptyReport = () => (
    <EmptyState
        icon="bi-file-earmark-bar-graph"
        title="لا توجد بيانات للتقرير"
        message="لا توجد بيانات كافية لإنشاء هذا التقرير. تأكد من إدخال بيانات العمليات أولاً."
        variant="info"
    />
);

// للمواسم
export const EmptySeasons = ({ onAdd }) => (
    <EmptyState
        icon="bi-calendar-range"
        title="لا توجد مواسم"
        message="لم يتم تعريف أي مواسم زراعية بعد."
        actionLabel="إضافة موسم"
        onAction={onAdd}
        variant="success"
    />
);

// للبحث
export const EmptySearch = ({ searchTerm }) => (
    <EmptyState
        icon="bi-search"
        title="لا توجد نتائج"
        message={`لم يتم العثور على نتائج تطابق "${searchTerm}"`}
        variant="default"
    />
);

export default EmptyState;

