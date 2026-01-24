import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getTreasurySummary,
    getTreasuryTransactions,
    deleteTransaction,
    createCashReceipt,
    createCashPayment,
    createQuickExpense,
    updateCashReceipt,
    updateCashPayment,
    updateQuickExpense
} from '../api/treasury';
import { getContacts } from '../api/contacts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common';

// Import treasury components
import TreasuryKPICards from '../components/treasury/TreasuryKPICards';
import TransactionsTable from '../components/treasury/TransactionsTable';
import CashReceiptModal from '../components/treasury/CashReceiptModal';
import CashPaymentModal from '../components/treasury/CashPaymentModal';
import QuickExpenseModal from '../components/treasury/QuickExpenseModal';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

function TreasuryManagement() {
    const { hasPermission } = useAuth();
    const { showSuccess, showError } = useToast();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Modal states
    const [activeModal, setActiveModal] = useState(null); // 'receipt', 'payment', 'expense', null
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({});

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [summaryData, transactionsData, contactsData] = await Promise.all([
                getTreasurySummary(selectedDate),
                getTreasuryTransactions(selectedDate),
                getContacts()
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData);
            setContacts(contactsData);
        } catch (err) {
            console.error('Failed to fetch treasury data:', err);
            setError('فشل في تحميل بيانات الخزينة');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Initialize Form Data Helper
    const initFormData = (type, transaction = null) => {
        const today = new Date().toISOString().split('T')[0];
        if (transaction) {
            // Edit Mode
            if (type === 'receipt') {
                return {
                    receipt_date: transaction.transaction_date,
                    amount: transaction.amount,
                    contact_id: transaction.contact_id || '',
                    description: transaction.description,
                    reference_number: transaction.reference_number || ''
                };
            } else if (type === 'payment') {
                return {
                    payment_date: transaction.transaction_date,
                    amount: transaction.amount,
                    contact_id: transaction.contact_id || '',
                    description: transaction.description,
                    reference_number: transaction.reference_number || ''
                };
            } else { // expense
                return {
                    expense_date: transaction.transaction_date,
                    amount: transaction.amount,
                    description: transaction.description,
                    category: transaction.category || ''
                };
            }
        } else {
            // New Mode
            if (type === 'receipt') {
                return { receipt_date: today, amount: '', contact_id: '', description: '', reference_number: '' };
            } else if (type === 'payment') {
                return { payment_date: today, amount: '', contact_id: '', description: '', reference_number: '' };
            } else {
                return { expense_date: today, amount: '', description: '', category: '' };
            }
        }
    };

    // Open Modal Handlers
    const openModal = (type, transaction = null) => {
        setEditingTransaction(transaction);
        setFormData(initFormData(type, transaction));
        setActiveModal(type);
    };

    const handleModalClose = () => {
        setActiveModal(null);
        setEditingTransaction(null);
        setFormData({});
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTransaction) {
                // Update
                const id = editingTransaction.transaction_id;
                if (activeModal === 'receipt') await updateCashReceipt(id, formData);
                else if (activeModal === 'payment') await updateCashPayment(id, formData);
                else if (activeModal === 'expense') await updateQuickExpense(id, formData);
                showSuccess('تم تحديث العملية بنجاح');
            } else {
                // Create
                if (activeModal === 'receipt') await createCashReceipt(formData);
                else if (activeModal === 'payment') await createCashPayment(formData);
                else if (activeModal === 'expense') await createQuickExpense(formData);
                showSuccess('تم إضافة العملية بنجاح');
            }
            handleModalClose();
            fetchData();
        } catch (err) {
            console.error('Operation failed:', err);
            showError('فشل في تنفيذ العملية: ' + (err.response?.data?.detail || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete
    const handleDelete = async (transaction) => {
        if (!window.confirm(`هل أنت متأكد من حذف هذه العملية؟`)) {
            return;
        }
        try {
            await deleteTransaction(transaction.transaction_id);
            showSuccess('تم حذف العملية بنجاح');
            fetchData();
        } catch (err) {
            console.error('Failed to delete transaction:', err);
            showError('فشل في حذف العملية');
        }
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        if (!Array.isArray(transactions)) return [];
        return transactions.filter(t => {
            const matchesSearch =
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = selectedFilter === 'all'
                ? true
                : t.transaction_type === selectedFilter;

            return matchesSearch && matchesFilter;
        });
    }, [transactions, searchTerm, selectedFilter]);

    // Stats from summary
    const stats = useMemo(() => {
        if (!summary) return [];
        return [
            {
                label: 'رصيد البداية',
                value: formatCurrency(summary.opening_balance),
                icon: 'bi-wallet2',
                gradient: 'from-gray-500/30 to-gray-600/30'
            },
            {
                label: 'المقبوضات',
                value: formatCurrency(summary.total_in_today),
                icon: 'bi-arrow-down-circle',
                gradient: 'from-green-500/30 to-emerald-500/30'
            },
            {
                label: 'المدفوعات',
                value: formatCurrency(summary.total_out_today),
                icon: 'bi-arrow-up-circle',
                gradient: 'from-red-500/30 to-rose-500/30'
            },
            {
                label: 'رصيد الإغلاق',
                value: formatCurrency(summary.closing_balance),
                icon: 'bi-safe',
                gradient: 'from-amber-500/30 to-yellow-500/30'
            }
        ];
    }, [summary]);

    // Loading state
    if (isLoading && !summary) { // Only show full loader on initial load
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Modals */}
            <CashReceiptModal
                show={activeModal === 'receipt'}
                onClose={handleModalClose}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                contacts={contacts}
                submitting={submitting}
            />
            <CashPaymentModal
                show={activeModal === 'payment'}
                onClose={handleModalClose}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                contacts={contacts}
                submitting={submitting}
            />
            <QuickExpenseModal
                show={activeModal === 'expense'}
                onClose={handleModalClose}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            {/* Page Header with Stats */}
            <PageHeader
                title="إدارة الخزينة"
                subtitle="تتبع التدفقات النقدية اليومية والأرصدة"
                icon="bi-safe"
                gradient="from-amber-500 to-yellow-500"
                actions={
                    <>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        {hasPermission('treasury:write') && (
                            <>
                                <ActionButton
                                    label="قبض"
                                    icon="bi-arrow-down-circle"
                                    onClick={() => openModal('receipt')}
                                    variant="secondary"
                                />
                                <ActionButton
                                    label="صرف"
                                    icon="bi-arrow-up-circle"
                                    onClick={() => openModal('payment')}
                                    variant="secondary"
                                />
                                <ActionButton
                                    label="مصروف سريع"
                                    icon="bi-lightning"
                                    onClick={() => openModal('expense')}
                                    variant="primary"
                                />
                            </>
                        )}
                    </>
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-${index + 1}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center animate-float`}>
                                    <i className={`bi ${stat.icon} text-lg`} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">{stat.label}</p>
                                    <p className="text-lg font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageHeader>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-red-700 dark:text-red-400">خطأ في النظام</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث في العمليات..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip
                    label="الكل"
                    count={transactions.length}
                    icon="bi-grid"
                    active={selectedFilter === 'all'}
                    onClick={() => setSelectedFilter('all')}
                    color="amber"
                />
                <FilterChip
                    label="المقبوضات"
                    count={transactions.filter(t => t.transaction_type === 'CASH_IN').length}
                    icon="bi-arrow-down-circle"
                    active={selectedFilter === 'CASH_IN'}
                    onClick={() => setSelectedFilter('CASH_IN')}
                    color="emerald"
                />
                <FilterChip
                    label="المدفوعات"
                    count={transactions.filter(t => t.transaction_type === 'CASH_OUT').length}
                    icon="bi-arrow-up-circle"
                    active={selectedFilter === 'CASH_OUT'}
                    onClick={() => setSelectedFilter('CASH_OUT')}
                    color="amber"
                />
                <FilterChip
                    label="المصروفات"
                    count={transactions.filter(t => t.transaction_type === 'EXPENSE').length}
                    icon="bi-lightning"
                    active={selectedFilter === 'EXPENSE'}
                    onClick={() => setSelectedFilter('EXPENSE')}
                    color="amber"
                />
            </div>

            {/* Transactions Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-amber-500" />
                        سجل العمليات
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            {filteredTransactions.length}
                        </span>
                    </h5>
                    <button onClick={fetchData} className="text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="تحديث البيانات">
                        <i className="bi bi-arrow-clockwise text-lg" />
                    </button>
                </div>
                <div>
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-inbox text-5xl text-amber-400 dark:text-amber-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد عمليات</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">لا توجد عمليات مسجلة لهذا التاريخ</p>
                        </div>
                    ) : (
                        <TransactionsTable
                            transactions={filteredTransactions}
                            onEdit={(t) => {
                                if (t.transaction_type === 'CASH_IN') openModal('receipt', t);
                                else if (t.transaction_type === 'CASH_OUT') openModal('payment', t);
                                else if (t.transaction_type === 'EXPENSE') openModal('expense', t);
                            }}
                            onDelete={handleDelete}
                            formatCurrency={formatCurrency}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default TreasuryManagement;
