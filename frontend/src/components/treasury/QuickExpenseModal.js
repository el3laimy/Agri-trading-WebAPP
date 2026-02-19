import React from 'react';
import '../../styles/liquidglass.css';

/**
 * Modal component for quick expense (تسجيل مصروف)
 */
function QuickExpenseModal({
    show,
    onClose,
    formData,
    setFormData,
    onSubmit,
    submitting
}) {
    if (!show) return null;

    const expenseCategories = [
        { value: 'transport', label: 'مواصلات' },
        { value: 'utilities', label: 'مرافق' },
        { value: 'supplies', label: 'مستلزمات' },
        { value: 'maintenance', label: 'صيانة' },
        { value: 'other', label: 'أخرى' }
    ];

    return (
        <div className="lg-modal-overlay" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="lg-modal" style={{ maxWidth: '520px' }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))' }}>
                    <i className="bi bi-lightning-charge text-xl text-amber-500" />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }} id="modal-title">
                        تسجيل مصروف سريع
                    </h3>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>التاريخ *</label>
                            <input
                                type="date"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>المبلغ *</label>
                            <input
                                type="number"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>البيان *</label>
                            <input
                                type="text"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="وصف المصروف"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>الفئة (اختياري)</label>
                            <select
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">-- اختر الفئة --</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 flex flex-row-reverse gap-2" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <button
                            type="submit"
                            className="lg-btn lg-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50"
                            disabled={submitting}
                            style={{ background: 'rgb(245,158,11)' }}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    تسجيل المصروف
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="lg-btn lg-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
                            onClick={onClose}
                        >
                            <i className="bi bi-x-lg"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default QuickExpenseModal;
