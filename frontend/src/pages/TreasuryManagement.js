import React, { useState, useEffect, useCallback } from 'react';
import { getTreasurySummary, getTreasuryTransactions, createCashReceipt, createCashPayment, createQuickExpense } from '../api/treasury';
import capitalAPI from '../api/capital';
import { getContacts } from '../api/contacts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Import treasury components
import {
    CashReceiptModal,
    CashPaymentModal,
    QuickExpenseModal,
    CapitalTransactionModal,
} from '../components/treasury';

// Import shared utilities and components
import { usePageState } from '../hooks';
import { formatCurrency, formatDate } from '../utils';
import { PageLoading } from '../components/common';

// Initial form states
const getInitialReceiptForm = () => ({
    receipt_date: new Date().toISOString().slice(0, 10),
    amount: '',
    contact_id: '',
    description: '',
    reference_number: ''
});

const getInitialPaymentForm = () => ({
    payment_date: new Date().toISOString().slice(0, 10),
    amount: '',
    contact_id: '',
    description: '',
    reference_number: ''
});

const getInitialExpenseForm = () => ({
    expense_date: new Date().toISOString().slice(0, 10),
    amount: '',
    description: '',
    category: ''
});

const getInitialCapitalForm = () => ({
    transaction_date: new Date().toISOString().slice(0, 10),
    amount: '',
    type: 'CONTRIBUTION',
    owner_name: '',
    description: '',
    reference_number: ''
});

function TreasuryManagement() {
    // Data states
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Modal states
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCapitalModal, setShowCapitalModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Use shared page state hook for error/success handling
    const { error: errorMessage, successMessage, showSuccess, showError } = usePageState();

    // Form states
    const [receiptForm, setReceiptForm] = useState(getInitialReceiptForm());
    const [paymentForm, setPaymentForm] = useState(getInitialPaymentForm());
    const [expenseForm, setExpenseForm] = useState(getInitialExpenseForm());
    const [capitalForm, setCapitalForm] = useState(getInitialCapitalForm());

    // Fetch data
    const fetchData = useCallback(async (date) => {
        setLoading(true);
        try {
            const dateStr = date.toISOString().slice(0, 10);
            const [summaryData, transactionsData] = await Promise.all([
                getTreasurySummary(dateStr),
                getTreasuryTransactions(dateStr, 100) // Increase limit to show more
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Failed to fetch treasury data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchContacts = useCallback(async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedDate);
        fetchContacts();
    }, [selectedDate, fetchData, fetchContacts]);

    // Submit handlers (Keeping logic same, just UI change)
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
            setReceiptForm(getInitialReceiptForm());
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل القبض: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

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
            setPaymentForm(getInitialPaymentForm());
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل الصرف: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

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
            setExpenseForm(getInitialExpenseForm());
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل المصروف: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

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
            setCapitalForm(getInitialCapitalForm());
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل تسجيل الحركة: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // --- Modern Components Internal Definition for Split View ---

    const StatCard = ({ title, value, icon, gradient, textColor = 'text-white' }) => (
        <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative" style={{ background: gradient }}>
                <div className={`card-body p-3 position-relative z-1 ${textColor}`}>
                    <div className="d-flex align-items-center mb-2">
                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center me-2">
                            <i className={`bi ${icon} fs-5`}></i>
                        </div>
                        <span className="opacity-75 small fw-bold">{title}</span>
                    </div>
                    <h4 className="fw-bold mb-0">{formatCurrency(value)}</h4>
                </div>
                <div className="position-absolute bottom-0 opacity-10" style={{ left: '0', marginBottom: '-10px', marginLeft: '-15px' }}>
                    <i className={`bi ${icon} display-1 text-white`}></i>
                </div>
            </div>
        </div>
    );

    const TransactionCard = ({ transaction, type }) => {
        const isReceipt = type === 'receipt';
        const colorClass = isReceipt ? 'success' : 'danger';
        const bgLight = isReceipt ? 'bg-success-subtle' : 'bg-danger-subtle';

        return (
            <div className="card mb-2 border-0 shadow-sm hover-shadow transition-all">
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex gap-3 align-items-center">
                            <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${bgLight}`}
                                style={{ width: '45px', height: '45px', minWidth: '45px' }}>
                                <i className={`bi ${isReceipt ? 'bi-arrow-down-left' : 'bi-arrow-up-right'} text-${colorClass} fs-5`}></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-1 text-dark">
                                    {transaction.source || 'بدون اسم'}
                                </h6>
                                <p className="text-muted small mb-0">{transaction.description}</p>
                            </div>
                        </div>
                        <div className="text-end">
                            <h6 className={`fw-bold mb-1 text-${colorClass}`}>
                                {isReceipt ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </h6>
                            <span className="badge bg-light text-muted border fw-normal small">
                                {formatDate(transaction.date)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Filter transactions
    const receipts = transactions.filter(t => t.type === 'IN');
    const payments = transactions.filter(t => t.type === 'OUT');

    if (loading && !summary) {
        return <PageLoading text="جاري تحميل بيانات الخزينة..." />;
    }

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
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

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1a4133' }}>دفتر الخزينة اليومي</h2>
                    <p className="text-muted mb-0 small">متابعة حركة النقدية الصادرة والواردة</p>
                </div>
                <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center border">
                    <span className="text-muted small px-2 border-end fw-bold">التاريخ:</span>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        className="form-control border-0 bg-transparent text-center fw-bold text-primary p-0 mx-2"
                        dateFormat="dd/MM/yyyy"
                    />
                    <i className="bi bi-calendar-event text-primary"></i>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <StatCard
                    title="رصيد افتتاحي"
                    value={summary?.opening_balance || 0}
                    icon="bi-safe"
                    gradient="linear-gradient(135deg, #64748b 0%, #475569 100%)"
                />
                <StatCard
                    title="إجمالي المقبوضات"
                    value={summary?.total_in_today || 0}
                    icon="bi-arrow-down-circle"
                    gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                />
                <StatCard
                    title="إجمالي المصروفات"
                    value={summary?.total_out_today || 0}
                    icon="bi-arrow-up-circle"
                    gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                />
                <StatCard
                    title="رصيد الإغلاق المتوقع"
                    value={summary?.closing_balance || 0}
                    icon="bi-wallet2"
                    gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                />
            </div>

            {/* Action Buttons */}
            <div className="row mb-4">
                <div className="col-12 d-flex gap-2 justify-content-center flex-wrap">
                    <button className="btn btn-success btn-lg px-4 shadow-sm fw-bold" onClick={() => setShowReceiptModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i> استلام نقدية (قبض)
                    </button>
                    <button className="btn btn-danger btn-lg px-4 shadow-sm fw-bold" onClick={() => setShowPaymentModal(true)}>
                        <i className="bi bi-dash-circle me-2"></i> صرف نقدية
                    </button>
                    <button className="btn btn-warning text-dark btn-lg px-4 shadow-sm fw-bold" onClick={() => setShowExpenseModal(true)}>
                        <i className="bi bi-lightning me-2"></i> تسجيل مصروف
                    </button>
                    <button className="btn btn-outline-primary btn-lg px-4 shadow-sm fw-bold" onClick={() => setShowCapitalModal(true)}>
                        <i className="bi bi-bank me-2"></i> رأس المال
                    </button>
                </div>
            </div>

            {/* Split Operations View */}
            <div className="row g-4">
                {/* Receipts Column */}
                <div className="col-lg-6">
                    <div className="card h-100 border-0 shadow-sm rounded-4 bg-light">
                        <div className="card-header bg-success text-white py-3 rounded-top-4 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="bi bi-download me-2"></i> حركة الوارد (المقبوضات)</h5>
                                <span className="badge bg-white text-success fw-bold">{receipts.length} حركة</span>
                            </div>
                        </div>
                        <div className="card-body p-3 bg-white rounded-bottom-4">
                            {receipts.length > 0 ? (
                                receipts.map(t => <TransactionCard key={t.transaction_id} transaction={t} type="receipt" />)
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-inbox fs-1 opacity-25 d-block mb-3"></i>
                                    لا توجد مقبوضات اليوم
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payments Column */}
                <div className="col-lg-6">
                    <div className="card h-100 border-0 shadow-sm rounded-4 bg-light">
                        <div className="card-header bg-danger text-white py-3 rounded-top-4 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="bi bi-upload me-2"></i> حركة الصادر (المدفوعات)</h5>
                                <span className="badge bg-white text-danger fw-bold">{payments.length} حركة</span>
                            </div>
                        </div>
                        <div className="card-body p-3 bg-white rounded-bottom-4">
                            {payments.length > 0 ? (
                                payments.map(t => <TransactionCard key={t.transaction_id} transaction={t} type="payment" />)
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-inbox fs-1 opacity-25 d-block mb-3"></i>
                                    لا توجد مدفوعات اليوم
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Keeping original modal components */}
            <CashReceiptModal
                show={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                formData={receiptForm}
                setFormData={setReceiptForm}
                onSubmit={handleReceiptSubmit}
                contacts={contacts}
                submitting={submitting}
            />

            <CashPaymentModal
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                formData={paymentForm}
                setFormData={setPaymentForm}
                onSubmit={handlePaymentSubmit}
                contacts={contacts}
                submitting={submitting}
            />

            <QuickExpenseModal
                show={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                formData={expenseForm}
                setFormData={setExpenseForm}
                onSubmit={handleExpenseSubmit}
                submitting={submitting}
            />

            <CapitalTransactionModal
                show={showCapitalModal}
                onClose={() => setShowCapitalModal(false)}
                formData={capitalForm}
                setFormData={setCapitalForm}
                onSubmit={handleCapitalSubmit}
                submitting={submitting}
            />
        </div>
    );
}

export default TreasuryManagement;
