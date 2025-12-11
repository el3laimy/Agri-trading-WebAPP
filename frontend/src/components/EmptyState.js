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
        default: { bg: '#F8F9FA', iconColor: '#6C757D', borderColor: '#DEE2E6' },
        success: { bg: '#D4EDDA', iconColor: '#28A745', borderColor: '#C3E6CB' },
        warning: { bg: '#FFF3CD', iconColor: '#FFC107', borderColor: '#FFE69C' },
        info: { bg: '#D1ECF1', iconColor: '#17A2B8', borderColor: '#BEE5EB' }
    };

    const style = variants[variant] || variants.default;

    return (
        <div
            className="text-center py-5 px-4 rounded-3"
            style={{
                backgroundColor: style.bg,
                border: `2px dashed ${style.borderColor}`
            }}
        >
            <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
            >
                <i
                    className={`bi ${icon}`}
                    style={{ fontSize: '2.5rem', color: style.iconColor }}
                ></i>
            </div>

            <h5 className="fw-bold mb-2" style={{ color: '#343A40' }}>
                {title}
            </h5>

            <p className="text-muted mb-3" style={{ maxWidth: '300px', margin: '0 auto' }}>
                {message}
            </p>

            {actionLabel && onAction && (
                <button
                    className="btn btn-primary"
                    onClick={onAction}
                >
                    <i className="bi bi-plus-circle me-2"></i>
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
