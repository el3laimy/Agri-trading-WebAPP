import React from 'react';
import '../styles/liquidglass.css';

/**
 * Modal component for capital transactions (إدارة رأس المال)
 */
function CapitalTransactionModal({
    show,
    onClose,
    formData,
    setFormData,
    onSubmit,
    submitting
}) {
    if (!show) return null;

    return (
        <div className="lg-modal-overlay" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="lg-modal" style={{ maxWidth: '520px' }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))' }}>
                    <i className="bi bi-bank text-xl text-blue-500" />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }} id="modal-title">
                        إدارة رأس المال
                    </h3>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--lg-text-secondary)' }}>نوع الحركة *</label>
                            <div className="flex gap-6 p-3 rounded-xl" style={{ background: 'var(--lg-glass-bg)', border: '1px solid var(--lg-glass-border)' }}>
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500"
                                        name="capitalType"
                                        checked={formData.type === 'CONTRIBUTION'}
                                        onChange={() => setFormData({ ...formData, type: 'CONTRIBUTION' })}
                                    />
                                    <span className="ms-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
                                        <i className="bi bi-arrow-down-circle me-1"></i>
                                        زيادة رأس مال (إيداع)
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                                        name="capitalType"
                                        checked={formData.type === 'WITHDRAWAL'}
                                        onChange={() => setFormData({ ...formData, type: 'WITHDRAWAL' })}
                                    />
                                    <span className="ms-2 text-sm font-bold text-red-600 dark:text-red-400 group-hover:text-red-700">
                                        <i className="bi bi-arrow-up-circle me-1"></i>
                                        تخفيض رأس مال (مسحوبات)
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>التاريخ *</label>
                            <input
                                type="date"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>اسم المالك/الشريك *</label>
                            <input
                                type="text"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.owner_name}
                                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                placeholder="اسم الشخص صاحب المعاملة"
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
                                placeholder="وصف العملية"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--lg-text-secondary)' }}>رقم المرجع (اختياري)</label>
                            <input
                                type="text"
                                className="lg-input text-sm rounded-xl block w-full p-2.5"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                placeholder="رقم الإيصال البنكي أو الشيك"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 flex flex-row-reverse gap-2" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <button
                            type="submit"
                            className={`lg-btn lg-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50`}
                            disabled={submitting}
                            style={{ background: formData.type === 'CONTRIBUTION' ? 'rgb(16,185,129)' : 'rgb(239,68,68)' }}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    {formData.type === 'CONTRIBUTION' ? 'تسجيل زيادة رأس المال' : 'تسجيل المسحوبات'}
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

export default CapitalTransactionModal;
