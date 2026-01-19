import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTreasurySummary, getTreasuryTransactions, deleteTransaction } from '../api/treasury';
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Modal states
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

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
            const [summaryData, transactionsData] = await Promise.all([
                getTreasurySummary(selectedDate),
                getTreasuryTransactions(selectedDate)
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData);
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

    // Handle transaction actions
    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        if (transaction.transaction_type === 'CASH_IN') {
            setShowReceiptModal(true);
        } else if (transaction.transaction_type === 'CASH_OUT') {
            setShowPaymentModal(true);
        } else if (transaction.transaction_type === 'EXPENSE') {
            setShowExpenseModal(true);
        }
    };

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

    const handleModalClose = () => {
        setShowReceiptModal(false);
        setShowPaymentModal(false);
        setShowExpenseModal(false);
        setEditingTransaction(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        fetchData();
        showSuccess('تمت العملية بنجاح');
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
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
    if (isLoading) {
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
            {showReceiptModal && (
                <CashReceiptModal
                    transaction={editingTransaction}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                />
            )}
            {showPaymentModal && (
                <CashPaymentModal
                    transaction={editingTransaction}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                />
            )}
            {showExpenseModal && (
                <QuickExpenseModal
                    transaction={editingTransaction}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                />
            )}

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
                                    onClick={() => { setEditingTransaction(null); setShowReceiptModal(true); }}
                                    variant="secondary"
                                />
                                <ActionButton
                                    label="صرف"
                                    icon="bi-arrow-up-circle"
                                    onClick={() => { setEditingTransaction(null); setShowPaymentModal(true); }}
                                    variant="secondary"
                                />
                                <ActionButton
                                    label="مصروف سريع"
                                    icon="bi-lightning"
                                    onClick={() => { setEditingTransaction(null); setShowExpenseModal(true); }}
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
                            onEdit={handleEdit}
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
