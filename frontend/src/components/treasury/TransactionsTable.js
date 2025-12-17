import React from 'react';

/**
 * Component for treasury transactions table
 */
function TransactionsTable({ transactions, formatDate, formatCurrency, onRefresh }) {
    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">سجل الحركات الأخيرة</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={onRefresh}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    تحديث
                </button>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الوصف</th>
                                <th>النوع</th>
                                <th>المصدر</th>
                                <th className="text-end">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <tr key={t.transaction_id}>
                                        <td>{formatDate(t.date)}</td>
                                        <td>{t.description}</td>
                                        <td>
                                            <span className={`badge bg-${t.type === 'IN' ? 'success' : 'danger'}-subtle text-${t.type === 'IN' ? 'success' : 'danger'}`}>
                                                {t.type === 'IN' ? 'وارد' : 'صادر'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary-subtle text-secondary">
                                                {t.source}
                                            </span>
                                        </td>
                                        <td className={`text-end fw-bold text-${t.type === 'IN' ? 'success' : 'danger'}`}>
                                            {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">
                                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                        لا يوجد حركات مسجلة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default TransactionsTable;
