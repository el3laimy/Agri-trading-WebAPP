import React from 'react';

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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title">
                            <i className="bi bi-lightning-charge me-2"></i>
                            تسجيل مصروف سريع
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">التاريخ *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">المبلغ *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    min="0.01"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">البيان *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="وصف المصروف"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">الفئة (اختياري)</label>
                                <select
                                    className="form-select"
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
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                إلغاء
                            </button>
                            <button type="submit" className="btn btn-warning" disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                تسجيل المصروف
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default QuickExpenseModal;
