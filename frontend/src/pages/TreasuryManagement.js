import React, { useState, useEffect, useCallback } from 'react';
import { getTreasurySummary, getTreasuryTransactions, createCashReceipt, createCashPayment, createQuickExpense, deleteTransaction, updateCashReceipt, updateCashPayment, updateQuickExpense } from '../api/treasury';
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
    const [editingTransaction, setEditingTransaction] = useState(null);

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

            if (editingTransaction) {
                await updateCashReceipt(editingTransaction.transaction_id, data);
                showSuccess('تم تحديث القبض بنجاح');
            } else {
                await createCashReceipt(data);
                showSuccess('تم تسجيل القبض بنجاح');
            }

            setShowReceiptModal(false);
            setReceiptForm(getInitialReceiptForm());
            setEditingTransaction(null);
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل حفظ القبض: ' + (error.response?.data?.detail || error.message));
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

            if (editingTransaction) {
                await updateCashPayment(editingTransaction.transaction_id, data);
                showSuccess('تم تحديث الصرف بنجاح');
            } else {
                await createCashPayment(data);
                showSuccess('تم تسجيل الصرف بنجاح');
            }

            setShowPaymentModal(false);
            setPaymentForm(getInitialPaymentForm());
            setEditingTransaction(null);
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل حفظ الصرف: ' + (error.response?.data?.detail || error.message));
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

            if (editingTransaction) {
                await updateQuickExpense(editingTransaction.transaction_id, data);
                showSuccess('تم تحديث المصروف بنجاح');
            } else {
                await createQuickExpense(data);
                showSuccess('تم تسجيل المصروف بنجاح');
            }

            setShowExpenseModal(false);
            setExpenseForm(getInitialExpenseForm());
            setEditingTransaction(null);
            fetchData(selectedDate);
        } catch (error) {
            showError('فشل حفظ المصروف: ' + (error.response?.data?.detail || error.message));
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
            <div className="card mb-2 border-0 shadow-sm hover-shadow transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex gap-3 align-items-center">
                            <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${bgLight}`}
                                style={{ width: '45px', height: '45px', minWidth: '45px' }}>
                                <i className={`bi ${isReceipt ? 'bi-arrow-down-left' : 'bi-arrow-up-right'} text-${colorClass} fs-5`}></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {isReceipt
                                        ? (transaction.contact_name ? `استلام من ${transaction.contact_name}` : 'قبض نقدية')
                                        : (transaction.contact_name
                                            ? `صرف لـ ${transaction.contact_name}`
                                            : (transaction.source === 'QUICK_EXPENSE' ? (transaction.description || 'مصروف سريع') : 'صرف نقدية'))}
                                </h6>
                                <p className="text-muted small mb-0">
                                    {transaction.source === 'QUICK_EXPENSE' ? 'مصروف سريع' : transaction.description}
                                </p>
                            </div>
                        </div>
                        <div className="text-end">
                            <h6 className={`fw-bold mb-1 text-${colorClass}`}>
                                {isReceipt ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </h6>
                            <div className="d-flex align-items-center justify-content-end gap-2">
                                <span className="badge bg-light text-muted border fw-normal small">
                                    {formatDate(transaction.date)}
                                </span>
                                <button
                                    className="btn btn-sm btn-outline-primary border-0 p-0 px-2"
                                    onClick={() => handleEditTransaction(transaction, type)}
                                    title="تعديل المعاملة"
                                >
                                    <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger border-0 p-0 px-2"
                                    onClick={() => handleDeleteTransaction(transaction.transaction_id)}
                                    title="حذف المعاملة"
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleDeleteTransaction = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.')) {
            try {
                setLoading(true);
                await deleteTransaction(id);
                showSuccess('تم حذف المعاملة بنجاح');
                fetchData(selectedDate);
            } catch (error) {
                showError('فشل حذف المعاملة: ' + (error.response?.data?.detail || error.message));
                setLoading(false);
            }
        }
    };

    const handleEditTransaction = (transaction, type) => {
        setEditingTransaction(transaction);

        // This relies on 'description' containing logic or assuming 'source_type' from API if available.
        // But our API returns flat Transaction object: {transaction_id, amount, date, description, type(IN/OUT), source}
        // It doesn't give us contact_id directly unless we enrich fetching.
        // HACK: For now, we pre-fill what we have. Editing might require re-selecting contact if not available.
        // TO FIX THIS properly: getTreasuryTransactions should return full details or we fetch details.
        // For Quick Win: user re-selects contact.

        if (type === 'receipt') {
            setReceiptForm({
                receipt_date: transaction.date,
                amount: transaction.amount,
                contact_id: '', // User must re-select or we need to update API to return contact_id
                description: transaction.description,
                reference_number: ''
            });
            setShowReceiptModal(true);
        } else if (type === 'payment') {
            // Check if it looks like an expense?
            // "source" field usually has "QUICK_EXPENSE" or Supplier Name.
            // If we can't distinguish, we might open the wrong modal.
            // But 'payment' type here corresponds to 'OUT'.
            // Simple heuristic: If source matches 'QUICK_EXPENSE' or similar?
            // Our backend `get_treasury_transactions` returns `source` as `source_type` string like "CASH_RECEIPT", "QUICK_EXPENSE" etc?
            // checking `treasury.py`: `source=t.source_type`.

            if (transaction.source === 'QUICK_EXPENSE' || transaction.source === 'EXPENSE') {
                setExpenseForm({
                    expense_date: transaction.date,
                    amount: transaction.amount,
                    description: transaction.description,
                    category: ''
                });
                setShowExpenseModal(true);
            } else {
                setPaymentForm({
                    payment_date: transaction.date,
                    amount: transaction.amount,
                    contact_id: '', // User must re-select
                    description: transaction.description,
                    reference_number: ''
                });
                setShowPaymentModal(true);
            }
        }
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
                    <h2 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>دفتر الخزينة اليومي</h2>
                    <p className="text-muted mb-0 small">متابعة حركة النقدية الصادرة والواردة</p>
                </div>
                <div className="p-2 rounded-3 shadow-sm d-flex align-items-center border" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <span className="text-muted small px-2 border-end fw-bold">التاريخ:</span>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        className="form-control border-0 bg-transparent text-center fw-bold p-0 mx-2"
                        style={{ color: 'var(--primary-color)' }}
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
                    <div className="card h-100 border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="card-header bg-success text-white py-3 rounded-top-4 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="bi bi-download me-2"></i> حركة الوارد (المقبوضات)</h5>
                                <span className="badge bg-white text-success fw-bold">{receipts.length} حركة</span>
                            </div>
                        </div>
                        <div className="card-body p-3 rounded-bottom-4" style={{ backgroundColor: 'var(--bg-card)' }}>
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
                    <div className="card h-100 border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="card-header bg-danger text-white py-3 rounded-top-4 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold"><i className="bi bi-upload me-2"></i> حركة الصادر (المدفوعات)</h5>
                                <span className="badge bg-white text-danger fw-bold">{payments.length} حركة</span>
                            </div>
                        </div>
                        <div className="card-body p-3 rounded-bottom-4" style={{ backgroundColor: 'var(--bg-card)' }}>
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
