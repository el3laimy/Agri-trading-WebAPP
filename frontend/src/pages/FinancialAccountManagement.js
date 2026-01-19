import React, { useState, useEffect, useMemo } from 'react';
import { getFinancialAccounts, createFinancialAccount, updateFinancialAccount, deleteFinancialAccount } from '../api/financialAccounts';
import FinancialAccountForm from '../components/FinancialAccountForm';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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
            showError('فشل في حفظ الحساب');
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
            showError('فشل في حذف الحساب (قد يكون مرتبط بمعاملات)');
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-violet-200 to-purple-200 dark:from-violet-800/30 dark:to-purple-800/30" />
                </div>
                <div className="neumorphic p-6"><LoadingCard rows={6} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-scale">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-bounce-in">
                                    <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">تأكيد الحذف</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    هل أنت متأكد من حذف <span className="font-bold text-gray-800 dark:text-gray-200">"{accountToDelete?.account_name}"</span>؟
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={cancelDelete} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">إلغاء</button>
                                <button onClick={confirmDelete} className="px-6 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 hover-scale">حذف</button>
                            </div>
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
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-bank text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الحسابات</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نشط</p>
                                <p className="text-lg font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-cash-stack text-lg text-purple-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الأرصدة</p>
                                <p className="text-lg font-bold">{stats.totalBalance.toLocaleString()}</p>
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
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
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
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-violet-500" />
                        دليل الحسابات
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">{filteredAccounts.length}</span>
                    </h5>
                </div>
                <div>
                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-bank text-5xl text-violet-400 dark:text-violet-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد حسابات</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">قم بإضافة الحسابات المالية</p>
                            <button onClick={handleAddNew} className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium bg-violet-600 text-white hover:bg-violet-700 hover-scale">
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
                                        <tr key={account.account_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
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
