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

    // --- Tailwind Components Internal Definition ---

    const StatCard = ({ title, value, icon, gradient, textColor = 'text-white' }) => (
        <div className="relative overflow-hidden rounded-xl shadow-sm h-full" style={{ background: gradient }}>
            <div className={`p-6 relative z-10 ${textColor}`}>
                <div className="flex items-center mb-4">
                    <div className="bg-white/20 rounded-full p-2 flex items-center justify-center me-3 w-10 h-10">
                        <i className={`bi ${icon} text-xl`}></i>
                    </div>
                    <span className="opacity-90 text-sm font-bold">{title}</span>
                </div>
                <h4 className="text-3xl font-bold">{formatCurrency(value)}</h4>
            </div>
            <div className="absolute -bottom-4 -left-4 opacity-10">
                <i className={`bi ${icon} text-9xl text-white`}></i>
            </div>
        </div>
    );

    const TransactionCard = ({ transaction, type }) => {
        const isReceipt = type === 'receipt';
        const colorClass = isReceipt ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
        const bgIcon = isReceipt ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30';
        const iconColor = isReceipt ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-3 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-right">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`${bgIcon} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors`}>
                            <i className={`bi ${isReceipt ? 'bi-arrow-down-left' : 'bi-arrow-up-right'} ${iconColor} text-xl`}></i>
                        </div>
                        <div className="text-right">
                            <h6 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                                {isReceipt
                                    ? (transaction.contact_name ? `استلام من ${transaction.contact_name}` : 'قبض نقدية')
                                    : (transaction.contact_name
                                        ? `صرف لـ ${transaction.contact_name}`
                                        : (transaction.source === 'QUICK_EXPENSE' ? (transaction.description || 'مصروف سريع') : 'صرف نقدية'))}
                            </h6>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-0">
                                {transaction.source === 'QUICK_EXPENSE' ? 'مصروف سريع' : transaction.description}
                            </p>
                        </div>
                    </div>
                    <div className="text-end">
                        <h6 className={`font-bold text-lg mb-1 ${colorClass} dir-ltr`}>
                            {isReceipt ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </h6>
                        <div className="flex items-center justify-end gap-2">
                            <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-medium border border-gray-200 dark:border-slate-600 transition-colors">
                                {formatDate(transaction.date)}
                            </span>
                            <button
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                onClick={() => handleEditTransaction(transaction, type)}
                                title="تعديل المعاملة"
                            >
                                <i className="bi bi-pencil"></i>
                            </button>
                            <button
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                onClick={() => handleDeleteTransaction(transaction.transaction_id)}
                                title="حذف المعاملة"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
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
        if (type === 'receipt') {
            setReceiptForm({
                receipt_date: transaction.date,
                amount: transaction.amount,
                contact_id: transaction.contact_id || '',
                description: transaction.description,
                reference_number: ''
            });
            setShowReceiptModal(true);
        } else if (type === 'payment') {
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
                    contact_id: transaction.contact_id || '',
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
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-s-4 border-emerald-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in text-right">
                    <i className="bi bi-check-circle-fill text-emerald-500 text-xl me-3"></i>
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium m-0">{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in text-right">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                    <p className="text-red-800 dark:text-red-300 font-medium m-0">{errorMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-right">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">دفتر الخزينة اليومي</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">متابعة حركة النقدية الصادرة والواردة</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex items-center transition-colors">
                    <span className="text-gray-500 dark:text-gray-400 text-xs px-2 border-l border-gray-200 dark:border-slate-700 font-bold">التاريخ:</span>
                    <div className="flex items-center px-2">
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            className="bg-transparent border-none text-center font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none w-24 cursor-pointer"
                            dateFormat="dd/MM/yyyy"
                        />
                        <i className="bi bi-calendar-event text-emerald-500 dark:text-emerald-400"></i>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-right">
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
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-right">
                <button
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-bold flex items-center transition-all hover:shadow-md transform hover:-translate-y-0.5 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    onClick={() => setShowReceiptModal(true)}
                >
                    <i className="bi bi-plus-circle me-2 text-xl"></i> استلام نقدية (قبض)
                </button>
                <button
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm font-bold flex items-center transition-all hover:shadow-md transform hover:-translate-y-0.5 dark:bg-red-500 dark:hover:bg-red-600"
                    onClick={() => setShowPaymentModal(true)}
                >
                    <i className="bi bi-dash-circle me-2 text-xl"></i> صرف نقدية
                </button>
                <button
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm font-bold flex items-center transition-all hover:shadow-md transform hover:-translate-y-0.5 dark:bg-amber-400 dark:hover:bg-amber-500"
                    onClick={() => setShowExpenseModal(true)}
                >
                    <i className="bi bi-lightning me-2 text-xl"></i> تسجيل مصروف
                </button>
                <button
                    className="px-6 py-3 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 rounded-xl shadow-sm font-bold flex items-center transition-all hover:shadow-md transform hover:-translate-y-0.5"
                    onClick={() => setShowCapitalModal(true)}
                >
                    <i className="bi bi-bank me-2 text-xl"></i> رأس المال
                </button>
            </div>

            {/* Split Operations View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                {/* Receipts Column */}
                <div className="bg-gray-50/50 dark:bg-slate-900/20 rounded-2xl p-1 border border-gray-100 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <div className="bg-emerald-600 dark:bg-emerald-900/50 text-white p-4 rounded-xl flex justify-between items-center mb-4 shadow-sm">
                        <h5 className="mb-0 font-bold flex items-center"><i className="bi bi-download me-2"></i> حركة الوارد (المقبوضات)</h5>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold border border-white/30">{receipts.length} حركة</span>
                    </div>
                    <div className="px-2 flex-grow overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {receipts.length > 0 ? (
                            receipts.map(t => <TransactionCard key={t.transaction_id} transaction={t} type="receipt" />)
                        ) : (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                                <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-full mb-3 transition-colors">
                                    <i className="bi bi-inbox text-4xl opacity-50"></i>
                                </div>
                                <p>لا توجد مقبوضات اليوم</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments Column */}
                <div className="bg-gray-50/50 dark:bg-slate-900/20 rounded-2xl p-1 border border-gray-100 dark:border-slate-700 h-full flex flex-col transition-colors">
                    <div className="bg-red-600 dark:bg-red-900/50 text-white p-4 rounded-xl flex justify-between items-center mb-4 shadow-sm">
                        <h5 className="mb-0 font-bold flex items-center"><i className="bi bi-upload me-2"></i> حركة الصادر (المدفوعات)</h5>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold border border-white/30">{payments.length} حركة</span>
                    </div>
                    <div className="px-2 flex-grow overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {payments.length > 0 ? (
                            payments.map(t => <TransactionCard key={t.transaction_id} transaction={t} type="payment" />)
                        ) : (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                                <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-full mb-3 transition-colors">
                                    <i className="bi bi-inbox text-4xl opacity-50"></i>
                                </div>
                                <p>لا توجد مدفوعات اليوم</p>
                            </div>
                        )}
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
