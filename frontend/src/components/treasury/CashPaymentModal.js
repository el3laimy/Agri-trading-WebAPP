import React from 'react';

/**
 * Modal component for cash payment (صرف نقدية)
 */
function CashPaymentModal({
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
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">
                            <i className="bi bi-arrow-up-circle me-2"></i>
                            صرف نقدية
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
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
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
                                <label className="form-label fw-bold">المورد *</label>
                                <select
                                    className="form-select"
                                    value={formData.contact_id}
                                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- اختر المورد --</option>
                                    {contacts.filter(c => c.is_supplier).map(c => (
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
                                    placeholder="وصف عملية الصرف"
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
                            <button type="submit" className="btn btn-danger" disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                تأكيد الصرف
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CashPaymentModal;
