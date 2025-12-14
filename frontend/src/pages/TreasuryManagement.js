import React, { useState, useEffect } from 'react';
import { getTreasurySummary, getTreasuryTransactions, createCashReceipt, createCashPayment, createQuickExpense } from '../api/treasury';
import capitalAPI from '../api/capital';
import { getContacts } from '../api/contacts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function TreasuryManagement() {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Modal states
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Form states
    const [receiptForm, setReceiptForm] = useState({
        receipt_date: new Date().toISOString().slice(0, 10),
        amount: '',
        contact_id: '',
        description: '',
        reference_number: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        contact_id: '',
        description: '',
        reference_number: ''
    });

    const [expenseForm, setExpenseForm] = useState({
        expense_date: new Date().toISOString().slice(0, 10),
        amount: '',
        description: '',
        category: ''
    });

    // Capital Modal State
    const [showCapitalModal, setShowCapitalModal] = useState(false);
    const [capitalForm, setCapitalForm] = useState({
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        type: 'CONTRIBUTION', // or WITHDRAWAL
        owner_name: '',
        description: '',
        reference_number: ''
    });

    useEffect(() => {
        fetchData(selectedDate);
        fetchContacts();
    }, [selectedDate]);

    const fetchData = async (date) => {
        setLoading(true);
        try {
            const dateStr = date.toISOString().slice(0, 10);
            const [summaryData, transactionsData] = await Promise.all([
                getTreasurySummary(dateStr),
                getTreasuryTransactions(dateStr, 50)
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Failed to fetch treasury data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-EG');
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const showError = (message) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 5000);
    };

    // Handle Cash Receipt
    const handleReceiptSubmit = async (e) => {
        e.preventDefault();
        if (!receiptForm.amount || receiptForm.amount <= 0) {
            showError('يرجى إدخال مبلغ صحيح');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                ...receiptForm,
                amount: parseFloat(receiptForm.amount),
                contact_id: receiptForm.contact_id ? parseInt(receiptForm.contact_id) : null
            };
            await createCashReceipt(data);
            showSuccess('تم تسجيل القبض بنجاح');
            setShowReceiptModal(false);
            setReceiptForm({
                receipt_date: new Date().toISOString().slice(0, 10),
                amount: '',
                contact_id: '',
                description: '',
                reference_number: ''
            });
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل القبض: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Cash Payment
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            showError('يرجى إدخال مبلغ صحيح');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                ...paymentForm,
                amount: parseFloat(paymentForm.amount),
                contact_id: paymentForm.contact_id ? parseInt(paymentForm.contact_id) : null
            };
            await createCashPayment(data);
            showSuccess('تم تسجيل الصرف بنجاح');
            setShowPaymentModal(false);
            setPaymentForm({
                payment_date: new Date().toISOString().slice(0, 10),
                amount: '',
                contact_id: '',
                description: '',
                reference_number: ''
            });
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل الصرف: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Quick Expense
    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!expenseForm.amount || expenseForm.amount <= 0) {
            showError('يرجى إدخال مبلغ صحيح');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                ...expenseForm,
                amount: parseFloat(expenseForm.amount)
            };
            await createQuickExpense(data);
            showSuccess('تم تسجيل المصروف بنجاح');
            setShowExpenseModal(false);
            setExpenseForm({
                expense_date: new Date().toISOString().slice(0, 10),
                amount: '',
                description: '',
                category: ''
            });
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل المصروف: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Capital Transaction
    const handleCapitalSubmit = async (e) => {
        e.preventDefault();
        if (!capitalForm.amount || capitalForm.amount <= 0) {
            showError('يرجى إدخال مبلغ صحيح');
            return;
        }
        if (!capitalForm.owner_name) {
            showError('يرجى إدخال اسم المالك/الشريك');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                ...capitalForm,
                amount: parseFloat(capitalForm.amount)
            };
            await capitalAPI.createTransaction(data);
            showSuccess('تم تسجيل حركة رأس المال بنجاح');
            setShowCapitalModal(false);
            setCapitalForm({
                transaction_date: new Date().toISOString().slice(0, 10),
                amount: '',
                type: 'CONTRIBUTION',
                owner_name: '',
                description: '',
                reference_number: ''
            });
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل الحركة: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !summary) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorMessage}
                </div>
            )}

            {/* Header & Controls */}
            <div className="row mb-4 align-items-center justify-content-between">
                <div className="col-md-6">
                    <h2 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-wallet2 me-2"></i>
                        دفتر الخزينة اليومي
                    </h2>
                    <p className="text-muted mb-0">مطابقة النقدية والتدفقات لليوم المحدد</p>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
                    <div className="bg-white p-1 rounded shadow-sm d-flex align-items-center">
                        <span className="text-muted small ms-2 ps-2 border-end">التاريخ:</span>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            className="form-control border-0 bg-transparent text-end fw-bold"
                            dateFormat="yyyy-MM-dd"
                        />
                        <i className="bi bi-calendar-event text-primary mx-2"></i>
                    </div>
                </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="row mb-4">
                <div className="col-12 d-flex flex-wrap gap-2">
                    <button
                        className="btn btn-success px-4 py-2 shadow-sm"
                        onClick={() => setShowReceiptModal(true)}
                    >
                        <i className="bi bi-arrow-down-circle me-2"></i>
                        قبض نقدية
                    </button>
                    <button
                        className="btn btn-danger px-4 py-2 shadow-sm"
                        onClick={() => setShowPaymentModal(true)}
                    >
                        <i className="bi bi-arrow-up-circle me-2"></i>
                        صرف نقدية
                    </button>
                    <button
                        className="btn btn-warning text-dark px-4 py-2 shadow-sm"
                        onClick={() => setShowExpenseModal(true)}
                    >
                        <i className="bi bi-lightning-charge me-2"></i>
                        تسجيل مصروف
                    </button>
                    <button
                        className="btn btn-primary px-4 py-2 shadow-sm"
                        onClick={() => setShowCapitalModal(true)}
                    >
                        <i className="bi bi-bank me-2"></i>
                        إدارة رأس المال
                    </button>
                </div>
            </div>

            {/* KPI Cards (Daily Book Formula) */}
            {summary && (
                <div className="row mb-4">
                    {/* Opening Balance */}
                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100 kpi-card bg-light">
                            <div className="card-body">
                                <small className="text-muted d-block mb-2">رصيد البداية</small>
                                <h4 className="fw-bold text-secondary mb-0">{formatCurrency(summary.opening_balance)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Inflow (+ sign) */}
                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100 kpi-card" style={{ borderRight: '4px solid #198754' }}>
                            <div className="card-body">
                                <small className="text-muted d-block mb-2">
                                    <i className="bi bi-plus-lg text-success me-1"></i>
                                    مقبوضات اليوم
                                </small>
                                <h4 className="fw-bold text-success mb-0">{formatCurrency(summary.total_in_today)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Outflow (- sign) */}
                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100 kpi-card" style={{ borderRight: '4px solid #dc3545' }}>
                            <div className="card-body">
                                <small className="text-muted d-block mb-2">
                                    <i className="bi bi-dash-lg text-danger me-1"></i>
                                    مدفوعات اليوم
                                </small>
                                <h4 className="fw-bold text-danger mb-0">{formatCurrency(summary.total_out_today)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Closing Balance (= sign) */}
                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100 kpi-card text-white" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #0D3320 100%)' }}>
                            <div className="card-body">
                                <small className="text-white-50 d-block mb-2">
                                    <i className="bi bi-equals me-1"></i>
                                    رصيد الإغلاق
                                </small>
                                <h4 className="fw-bold mb-0">{formatCurrency(summary.closing_balance)}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">سجل الحركات الأخيرة</h5>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => fetchData(selectedDate)}>
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

            {/* Cash Receipt Modal */}
            {showReceiptModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-arrow-down-circle me-2"></i>
                                    قبض نقدية
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReceiptModal(false)}></button>
                            </div>
                            <form onSubmit={handleReceiptSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">التاريخ *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={receiptForm.receipt_date}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">المبلغ *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={receiptForm.amount}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                                            min="0.01"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">العميل (اختياري)</label>
                                        <select
                                            className="form-select"
                                            value={receiptForm.contact_id}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, contact_id: e.target.value })}
                                        >
                                            <option value="">-- بدون تحديد عميل --</option>
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
                                            value={receiptForm.description}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
                                            placeholder="وصف عملية القبض"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">رقم المرجع (اختياري)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={receiptForm.reference_number}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, reference_number: e.target.value })}
                                            placeholder="رقم الإيصال أو الشيك"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>
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
            )}

            {/* Cash Payment Modal */}
            {showPaymentModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-arrow-up-circle me-2"></i>
                                    صرف نقدية
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
                            </div>
                            <form onSubmit={handlePaymentSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">التاريخ *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={paymentForm.payment_date}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">المبلغ *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            min="0.01"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">المورد (اختياري)</label>
                                        <select
                                            className="form-select"
                                            value={paymentForm.contact_id}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, contact_id: e.target.value })}
                                        >
                                            <option value="">-- بدون تحديد مورد --</option>
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
                                            value={paymentForm.description}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                            placeholder="وصف عملية الصرف"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">رقم المرجع (اختياري)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={paymentForm.reference_number}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                            placeholder="رقم الإيصال أو الشيك"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
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
            )}

            {/* Quick Expense Modal */}
            {showExpenseModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title">
                                    <i className="bi bi-lightning-charge me-2"></i>
                                    تسجيل مصروف سريع
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowExpenseModal(false)}></button>
                            </div>
                            <form onSubmit={handleExpenseSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">التاريخ *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={expenseForm.expense_date}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">المبلغ *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
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
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                            placeholder="وصف المصروف"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">الفئة (اختياري)</label>
                                        <select
                                            className="form-select"
                                            value={expenseForm.category}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        >
                                            <option value="">-- اختر الفئة --</option>
                                            <option value="transport">مواصلات</option>
                                            <option value="utilities">مرافق</option>
                                            <option value="supplies">مستلزمات</option>
                                            <option value="maintenance">صيانة</option>
                                            <option value="other">أخرى</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
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
            )}
            {/* Capital Transaction Modal */}
            {showCapitalModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-bank me-2"></i>
                                    إدارة رأس المال
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCapitalModal(false)}></button>
                            </div>
                            <form onSubmit={handleCapitalSubmit}>
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
                                                    checked={capitalForm.type === 'CONTRIBUTION'}
                                                    onChange={() => setCapitalForm({ ...capitalForm, type: 'CONTRIBUTION' })}
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
                                                    checked={capitalForm.type === 'WITHDRAWAL'}
                                                    onChange={() => setCapitalForm({ ...capitalForm, type: 'WITHDRAWAL' })}
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
                                            value={capitalForm.transaction_date}
                                            onChange={(e) => setCapitalForm({ ...capitalForm, transaction_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">المبلغ *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={capitalForm.amount}
                                            onChange={(e) => setCapitalForm({ ...capitalForm, amount: e.target.value })}
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
                                            value={capitalForm.owner_name}
                                            onChange={(e) => setCapitalForm({ ...capitalForm, owner_name: e.target.value })}
                                            placeholder="اسم الشخص صاحب المعاملة"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">البيان *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={capitalForm.description}
                                            onChange={(e) => setCapitalForm({ ...capitalForm, description: e.target.value })}
                                            placeholder="وصف العملية"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">رقم المرجع (اختياري)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={capitalForm.reference_number}
                                            onChange={(e) => setCapitalForm({ ...capitalForm, reference_number: e.target.value })}
                                            placeholder="رقم الإيصال البنكي أو الشيك"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCapitalModal(false)}>
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className={`btn btn-${capitalForm.type === 'CONTRIBUTION' ? 'success' : 'danger'}`}
                                        disabled={submitting}
                                    >
                                        {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                        {capitalForm.type === 'CONTRIBUTION' ? 'تسجيل زيادة رأس المال' : 'تسجيل المسحوبات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TreasuryManagement;
