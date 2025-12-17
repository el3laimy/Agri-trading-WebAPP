import React from 'react';
import { downloadInvoice } from '../../api/sales';

/**
 * Table component for displaying sales list
 */
function SalesTable({
    sales,
    onRecordPayment,
    onShareWhatsApp,
    onShareEmail,
    getStatusBadge
}) {
    return (
        <div className="table-responsive">
            <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                    <tr>
                        <th>المحصول</th>
                        <th>العميل</th>
                        <th className="text-center">الكمية</th>
                        <th className="text-center">السعر</th>
                        <th className="text-center">الإجمالي</th>
                        <th>التاريخ</th>
                        <th className="text-center">الحالة</th>
                        <th style={{ width: '180px' }}>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(s => {
                        const originalUnit = s.selling_pricing_unit || 'kg';
                        const factor = s.specific_selling_factor || 1.0;
                        const originalQty = (s.quantity_sold_kg || 0) / factor;
                        const originalPrice = (s.selling_unit_price || 0) * factor;

                        return (
                            <tr key={s.sale_id}>
                                <td>
                                    <span className="badge bg-success-subtle text-success">
                                        <i className="bi bi-flower1 me-1"></i>
                                        {s.crop?.crop_name || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <i className="bi bi-person me-1 text-primary"></i>
                                    {s.customer?.name || 'N/A'}
                                </td>
                                <td className="text-center">
                                    <strong>{originalQty.toFixed(0)}</strong>
                                    <small className="text-muted ms-1">{originalUnit}</small>
                                </td>
                                <td className="text-center">
                                    {originalPrice.toLocaleString('ar-EG')}
                                    <small className="text-muted">/{originalUnit}</small>
                                </td>
                                <td className="text-center fw-bold text-success">
                                    {(s.total_sale_amount || 0).toLocaleString('ar-EG')} ج.م
                                </td>
                                <td>
                                    <small>{new Date(s.sale_date).toLocaleDateString('ar-EG')}</small>
                                </td>
                                <td className="text-center">{getStatusBadge(s.payment_status)}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-success ms-1"
                                        onClick={() => onRecordPayment(s)}
                                        disabled={s.payment_status === 'PAID'}
                                    >
                                        <i className="bi bi-cash me-1"></i>
                                        تسجيل دفعة
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => downloadInvoice(s.sale_id)}
                                        title="طباعة الفاتورة"
                                    >
                                        <i className="bi bi-printer"></i>
                                    </button>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-secondary dropdown-toggle"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            <i className="bi bi-share"></i>
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li>
                                                <button className="dropdown-item" onClick={() => onShareWhatsApp(s)}>
                                                    <i className="bi bi-whatsapp text-success me-2"></i> واتساب
                                                </button>
                                            </li>
                                            <li>
                                                <button className="dropdown-item" onClick={() => onShareEmail(s)}>
                                                    <i className="bi bi-envelope text-primary me-2"></i> بريد إلكتروني
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default SalesTable;
