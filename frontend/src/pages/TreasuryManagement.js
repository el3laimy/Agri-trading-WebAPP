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
import { useToast, ConfirmationModal } from '../components/common';

// Import treasury components
import TreasuryKPICards from '../components/treasury/TreasuryKPICards';
import TransactionsTable from '../components/treasury/TransactionsTable';
import CashReceiptModal from '../components/treasury/CashReceiptModal';
import CashPaymentModal from '../components/treasury/CashPaymentModal';
import QuickExpenseModal from '../components/treasury/QuickExpenseModal';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';
import { TreasurySkeleton } from '../components/common';
import { handleApiError } from '../utils';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

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

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingTransaction, setDeletingTransaction] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({});

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
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
            showError(handleApiError(err, 'treasury_create'));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete - opens confirmation modal
    const handleDelete = (transaction) => {
        setDeletingTransaction(transaction);
        setShowDeleteConfirm(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!deletingTransaction) return;
        setIsDeleting(true);
        try {
            await deleteTransaction(deletingTransaction.transaction_id);
            showSuccess('تم حذف العملية بنجاح');
            setShowDeleteConfirm(false);
            setDeletingTransaction(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete transaction:', err);
            showError(handleApiError(err, 'treasury_delete'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletingTransaction(null);
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
        return <TreasurySkeleton />;
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="تأكيد حذف العملية"
                message="هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
                isLoading={isDeleting}
            />

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
                            className={`px-4 py-3 rounded-xl text-white lg-animate-in`}
                            style={{
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                animationDelay: `${index * 100}ms`
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center lg-animate-float`}>
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
                <div className="mb-6 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 lg-animate-fade" style={{ background: 'var(--lg-glass-bg)' }}>
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
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-amber-500" />
                        سجل العمليات
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgb(217,119,6)' }}>
                            {filteredTransactions.length}
                        </span>
                    </h5>
                    <button onClick={fetchData} className="lg-btn lg-btn-ghost" title="تحديث البيانات">
                        <i className="bi bi-arrow-clockwise text-lg" />
                    </button>
                </div>
                <div>
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-inbox text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد عمليات</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>لا توجد عمليات مسجلة لهذا التاريخ</p>
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
