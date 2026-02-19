import React, { useState, useEffect, useMemo } from 'react';
import { getFinancialAccounts, createFinancialAccount, updateFinancialAccount, deleteFinancialAccount } from '../api/financialAccounts';
import FinancialAccountForm from '../components/FinancialAccountForm';
import { useToast } from '../components/common';
import { handleApiError } from '../utils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

const FinancialAccountManagement = () => {
    const { showSuccess, showError } = useToast();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await getFinancialAccounts();
            setAccounts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const active = accounts.filter(a => a.is_active).length;
        const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
        return { total: accounts.length, active, totalBalance };
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            const matchesSearch = account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) || account.account_type?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true : selectedFilter === 'active' ? account.is_active : !account.is_active;
            return matchesSearch && matchesFilter;
        });
    }, [accounts, searchTerm, selectedFilter]);

    const handleSave = async (formData) => {
        try {
            if (editingAccount) {
                await updateFinancialAccount(editingAccount.account_id, formData);
                showSuccess('تم تحديث الحساب بنجاح');
            } else {
                await createFinancialAccount(formData);
                showSuccess('تم إضافة الحساب بنجاح');
            }
            setShowForm(false);
            setEditingAccount(null);
            fetchAccounts();
        } catch (error) {
            showError(handleApiError(error, 'account_create'));
        }
    };

    const handleEdit = (account) => { setEditingAccount(account); setShowForm(true); };
    const handleAddNew = () => { setEditingAccount(null); setShowForm(true); };
    const handleCancel = () => { setShowForm(false); setEditingAccount(null); };
    const handleDeleteClick = (account) => { setAccountToDelete(account); setShowDeleteModal(true); };
    const cancelDelete = () => { setShowDeleteModal(false); setAccountToDelete(null); };

    const confirmDelete = async () => {
        if (!accountToDelete) return;
        try {
            await deleteFinancialAccount(accountToDelete.account_id);
            fetchAccounts();
            setShowDeleteModal(false);
            setAccountToDelete(null);
            showSuccess('تم حذف الحساب بنجاح');
        } catch (error) {
            showError(handleApiError(error, 'account_delete'));
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-violet-200 to-purple-200 dark:from-violet-800/30 dark:to-purple-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={6} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal lg-animate-in" style={{ maxWidth: '28rem' }}>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--lg-text-primary)' }}>تأكيد الحذف</h3>
                            <p className="mb-6" style={{ color: 'var(--lg-text-muted)' }}>
                                هل أنت متأكد من حذف <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>"{accountToDelete?.account_name}"</span>؟
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={cancelDelete} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء</button>
                            <button onClick={confirmDelete} className="lg-btn lg-btn-danger px-6 py-2.5">حذف</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title="إدارة الحسابات المالية"
                subtitle="إدارة شجرة الحسابات والأرصدة"
                icon="bi-bank"
                gradient="from-violet-500 to-purple-500"
                actions={
                    <ActionButton
                        label={showForm ? 'إلغاء' : 'إضافة حساب جديد'}
                        icon={showForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => showForm ? handleCancel() : handleAddNew()}
                        variant={showForm ? 'danger' : 'primary'}
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                <i className="bi bi-bank text-lg text-violet-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي الحسابات</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                <i className="bi bi-check-circle text-lg text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>نشط</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                                <i className="bi bi-cash-stack text-lg text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي الأرصدة</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{stats.totalBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث باسم الحساب أو النوع..." className="w-full md:w-96" />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="الكل" count={accounts.length} icon="bi-grid" active={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')} color="emerald" />
                <FilterChip label="نشط" count={stats.active} icon="bi-check-circle" active={selectedFilter === 'active'} onClick={() => setSelectedFilter('active')} color="emerald" />
                <FilterChip label="غير نشط" count={accounts.length - stats.active} icon="bi-x-circle" active={selectedFilter === 'inactive'} onClick={() => setSelectedFilter('inactive')} color="amber" />
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className={`bi ${editingAccount ? 'bi-pencil-square' : 'bi-plus-circle-fill'} ml-2 text-violet-600 dark:text-violet-400`} />
                            {editingAccount ? 'تعديل حساب مالي' : 'إضافة حساب مالي جديد'}
                        </h3>
                    </div>
                    <div className="p-6">
                        <FinancialAccountForm account={editingAccount} onSave={handleSave} onCancel={handleCancel} />
                    </div>
                </div>
            )}

            {/* Accounts Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-violet-500" />
                        دليل الحسابات
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: 'rgb(124,58,237)' }}>{filteredAccounts.length}</span>
                    </h5>
                </div>
                <div>
                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-bank text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد حسابات</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>قم بإضافة الحسابات المالية</p>
                            <button onClick={handleAddNew} className="lg-btn lg-btn-primary px-5 py-2.5 font-medium">
                                <i className="bi bi-plus-lg ml-2" />إضافة أول حساب
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">#</th>
                                        <th className="px-6 py-4 font-bold text-right">اسم الحساب</th>
                                        <th className="px-6 py-4 font-bold text-right">النوع</th>
                                        <th className="px-6 py-4 font-bold text-right">الرصيد</th>
                                        <th className="px-6 py-4 font-bold text-right">الحالة</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredAccounts.map((account, idx) => (
                                        <tr key={account.account_id} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{account.account_id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                                        <i className="bi bi-wallet2" />
                                                    </div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{account.account_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">{account.account_type}</span>
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${account.current_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {account.current_balance?.toLocaleString()} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${account.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {account.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => handleEdit(account)} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="تعديل">
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(account)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="حذف">
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialAccountManagement;
