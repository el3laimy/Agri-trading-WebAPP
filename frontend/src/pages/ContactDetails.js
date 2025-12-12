import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContactStatement } from '../api/contacts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function ContactDetails() {
    const { contactId } = useParams();
    const navigate = useNavigate();

    const [statement, setStatement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(0, 1); // أول السنة
        return date;
    });
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchStatement();
        // eslint-disable-next-line
    }, [contactId]);

    const fetchStatement = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate.toISOString().slice(0, 10);
            const endStr = endDate.toISOString().slice(0, 10);
            const data = await getContactStatement(contactId, startStr, endStr);
            setStatement(data);
        } catch (err) {
            setError("فشل تحميل كشف الحساب");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ar-EG');
    };

    const getContactTypeLabel = (type) => {
        switch (type) {
            case 'CUSTOMER': return 'عميل';
            case 'SUPPLIER': return 'مورد';
            case 'BOTH': return 'عميل ومورد';
            default: return type;
        }
    };

    const getContactTypeBadge = (type) => {
        switch (type) {
            case 'CUSTOMER': return 'bg-success';
            case 'SUPPLIER': return 'bg-info';
            case 'BOTH': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    };

    const getReferenceTypeLabel = (type) => {
        switch (type) {
            case 'SALE': return 'مبيعات';
            case 'PURCHASE': return 'مشتريات';
            case 'PAYMENT': return 'دفعة';
            case 'OPENING': return 'رصيد افتتاحي';
            default: return type;
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/contacts')}>
                    <i className="bi bi-arrow-right me-2"></i>
                    العودة
                </button>
            </div>
        );
    }

    if (!statement) return null;

    const { contact, summary, entries, opening_balance, closing_balance } = statement;

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    <div>
                        <button
                            className="btn btn-outline-secondary me-3"
                            onClick={() => navigate('/contacts')}
                        >
                            <i className="bi bi-arrow-right me-1"></i>
                            العودة
                        </button>
                        <span className="fs-4 fw-bold" style={{ color: 'var(--primary-dark)' }}>
                            <i className="bi bi-person-circle me-2"></i>
                            كشف حساب: {contact.name}
                        </span>
                        <span className={`badge ${getContactTypeBadge(summary.contact_type)} ms-2`}>
                            {getContactTypeLabel(summary.contact_type)}
                        </span>
                    </div>
                    <button className="btn btn-outline-primary" onClick={handlePrint}>
                        <i className="bi bi-printer me-2"></i>
                        طباعة
                    </button>
                </div>
            </div>

            {/* Contact Info Card */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-info-circle me-2 text-primary"></i>
                                بيانات جهة التعامل
                            </h6>
                            <p className="mb-2">
                                <strong>الاسم:</strong> {contact.name}
                            </p>
                            {contact.phone && (
                                <p className="mb-2">
                                    <strong>الهاتف:</strong> {contact.phone}
                                </p>
                            )}
                            {contact.address && (
                                <p className="mb-2">
                                    <strong>العنوان:</strong> {contact.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-graph-up me-2 text-success"></i>
                                الملخص المالي
                            </h6>
                            <div className="row">
                                {summary.contact_type !== 'SUPPLIER' && (
                                    <>
                                        <div className="col-md-3 mb-3">
                                            <div className="border rounded p-3 text-center bg-light">
                                                <small className="text-muted d-block">إجمالي المبيعات</small>
                                                <strong className="text-success">{formatCurrency(summary.total_sales)}</strong>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="border rounded p-3 text-center bg-light">
                                                <small className="text-muted d-block">المحصل</small>
                                                <strong className="text-primary">{formatCurrency(summary.total_received)}</strong>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {summary.contact_type !== 'CUSTOMER' && (
                                    <>
                                        <div className="col-md-3 mb-3">
                                            <div className="border rounded p-3 text-center bg-light">
                                                <small className="text-muted d-block">إجمالي المشتريات</small>
                                                <strong className="text-danger">{formatCurrency(summary.total_purchases)}</strong>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="border rounded p-3 text-center bg-light">
                                                <small className="text-muted d-block">المدفوع</small>
                                                <strong className="text-warning">{formatCurrency(summary.total_paid)}</strong>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="col-md-3 mb-3">
                                    <div className={`border rounded p-3 text-center ${summary.balance_due >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                                        <small className="text-muted d-block">الرصيد المستحق</small>
                                        <strong className={summary.balance_due >= 0 ? 'text-success' : 'text-danger'}>
                                            {formatCurrency(Math.abs(summary.balance_due))}
                                            <small className="d-block">
                                                {summary.balance_due >= 0 ? '(لنا)' : '(علينا)'}
                                            </small>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">من تاريخ</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">إلى تاريخ</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                            <button
                                className="btn btn-primary mt-4"
                                onClick={fetchStatement}
                            >
                                <i className="bi bi-search me-2"></i>
                                عرض الكشف
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statement Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">
                            <i className="bi bi-journal-text me-2"></i>
                            كشف الحساب التفصيلي
                        </h5>
                        <span className="text-muted">
                            من {formatDate(statement.start_date)} إلى {formatDate(statement.end_date)}
                        </span>
                    </div>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-center" style={{ width: '100px' }}>المبلغ</th>
                                    <th>السبب</th>
                                    <th className="text-center">النوع</th>
                                    <th className="text-center">الوزن</th>
                                    <th className="text-center">السعر</th>
                                    <th>ملاحظات</th>
                                    <th className="text-center">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>

                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            لا توجد حركات في هذه الفترة
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry, index) => {
                                        const amount = entry.debit > 0 ? entry.debit : entry.credit;
                                        const isDebit = entry.debit > 0;

                                        return (
                                            <React.Fragment key={index}>
                                                {/* صف المعاملة */}
                                                <tr>
                                                    <td className="text-center">
                                                        <span className={`fw-bold ${isDebit ? 'text-danger' : 'text-success'}`} style={{ fontSize: '1.1rem' }}>
                                                            {amount?.toLocaleString('ar-EG') || 0}
                                                        </span>
                                                    </td>
                                                    <td>{entry.description}</td>
                                                    <td className="text-center">{entry.crop_name || '-'}</td>
                                                    <td className="text-center">{entry.quantity ? entry.quantity.toFixed(0) : '-'}</td>
                                                    <td className="text-center">{entry.unit_price ? entry.unit_price.toLocaleString('ar-EG') : '-'}</td>
                                                    <td className="text-muted">-</td>
                                                    <td className="text-center">{formatDate(entry.date)}</td>
                                                </tr>
                                                {/* صف الباقي */}
                                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                    <td className="text-center">
                                                        <span className={`fw-bold ${entry.balance >= 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '1.1rem' }}>
                                                            {Math.abs(entry.balance)?.toLocaleString('ar-EG') || 0}
                                                        </span>
                                                    </td>
                                                    <td colSpan="6" className="text-end pe-4">
                                                        <strong className={entry.balance >= 0 ? 'text-danger' : 'text-success'}>
                                                            {entry.balance >= 0 ? 'الباقي عليه' : 'الباقي له'}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactDetails;
