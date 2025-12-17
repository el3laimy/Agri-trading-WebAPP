import React from 'react';

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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="bi bi-bank me-2"></i>
                            إدارة رأس المال
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">نوع الحركة *</label>
                                <div className="d-flex gap-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="capitalType"
                                            id="typeContribution"
                                            checked={formData.type === 'CONTRIBUTION'}
                                            onChange={() => setFormData({ ...formData, type: 'CONTRIBUTION' })}
                                        />
                                        <label className="form-check-label text-success fw-bold" htmlFor="typeContribution">
                                            <i className="bi bi-arrow-down-circle me-1"></i>
                                            زيادة رأس مال (إيداع)
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="capitalType"
                                            id="typeWithdrawal"
                                            checked={formData.type === 'WITHDRAWAL'}
                                            onChange={() => setFormData({ ...formData, type: 'WITHDRAWAL' })}
                                        />
                                        <label className="form-check-label text-danger fw-bold" htmlFor="typeWithdrawal">
                                            <i className="bi bi-arrow-up-circle me-1"></i>
                                            تخفيض رأس مال (مسحوبات)
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">التاريخ *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.transaction_date}
                                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
                                <label className="form-label fw-bold">اسم المالك/الشريك *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.owner_name}
                                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                    placeholder="اسم الشخص صاحب المعاملة"
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
                                    placeholder="وصف العملية"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">رقم المرجع (اختياري)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.reference_number}
                                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                    placeholder="رقم الإيصال البنكي أو الشيك"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-${formData.type === 'CONTRIBUTION' ? 'success' : 'danger'}`}
                                disabled={submitting}
                            >
                                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                {formData.type === 'CONTRIBUTION' ? 'تسجيل زيادة رأس المال' : 'تسجيل المسحوبات'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CapitalTransactionModal;
