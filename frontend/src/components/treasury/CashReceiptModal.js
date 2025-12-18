import React from 'react';

/**
 * Modal component for cash receipt (قبض نقدية)
 */
function CashReceiptModal({
    show,
    onClose,
    formData,
    setFormData,
    onSubmit,
    contacts,
    submitting
}) {
    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                        <h5 className="modal-title">
                            <i className="bi bi-arrow-down-circle me-2"></i>
                            قبض نقدية
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">التاريخ *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.receipt_date}
                                    onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
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
                                <label className="form-label fw-bold">العميل *</label>
                                <select
                                    className="form-select"
                                    value={formData.contact_id}
                                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- اختر العميل --</option>
                                    {contacts.filter(c => c.is_customer).map(c => (
                                        <option key={c.contact_id} value={c.contact_id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">البيان *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="وصف عملية القبض"
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
                                    placeholder="رقم الإيصال أو الشيك"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                إلغاء
                            </button>
                            <button type="submit" className="btn btn-success" disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                تأكيد القبض
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CashReceiptModal;
