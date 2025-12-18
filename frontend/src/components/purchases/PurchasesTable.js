import React from 'react';

/**
 * Table component for displaying purchases list
 */
function PurchasesTable({
    purchases,
    onRecordPayment,
    getStatusBadge
}) {
    return (
        <div className="table-responsive">
            <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                    <tr>
                        <th>المحصول</th>
                        <th>المورد</th>
                        <th className="text-center">الكمية</th>
                        <th className="text-center">السعر</th>
                        <th className="text-center">الإجمالي</th>
                        <th>التاريخ</th>
                        <th className="text-center">الحالة</th>
                        <th style={{ width: '130px' }}>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {purchases.map(p => {
                        const originalUnit = p.purchasing_pricing_unit || 'kg';
                        const factor = p.conversion_factor || 1.0;
                        const originalQty = (p.quantity_kg || 0) / factor;
                        const originalPrice = (p.unit_price || 0) * factor;

                        return (
                            <tr key={p.purchase_id}>
                                <td>
                                    <span className="badge bg-info-subtle text-info">
                                        <i className="bi bi-flower1 me-1"></i>
                                        {p.crop?.crop_name || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <i className="bi bi-truck me-1 text-primary"></i>
                                    {p.supplier?.name || 'N/A'}
                                </td>
                                <td className="text-center">
                                    <strong>{originalQty.toFixed(0)}</strong>
                                    <small className="ms-1" style={{ color: 'var(--text-secondary)' }}>{originalUnit}</small>
                                </td>
                                <td className="text-center">
                                    {originalPrice.toLocaleString('ar-EG')}
                                    <small style={{ color: 'var(--text-secondary)' }}>/{originalUnit}</small>
                                </td>
                                <td className="text-center fw-bold text-danger">
                                    {(p.total_cost ?? 0).toLocaleString('ar-EG')} ج.م
                                </td>
                                <td>
                                    <small>{new Date(p.purchase_date).toLocaleDateString('ar-EG')}</small>
                                </td>
                                <td className="text-center">{getStatusBadge(p.payment_status)}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => onRecordPayment(p)}
                                        disabled={p.payment_status === 'PAID'}
                                    >
                                        <i className="bi bi-cash me-1"></i>
                                        تسجيل دفعة
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default PurchasesTable;
