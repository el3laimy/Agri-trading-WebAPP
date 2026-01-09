import React, { useState, useEffect } from 'react';
import { getFinancialAccounts, createFinancialAccount, updateFinancialAccount, deleteFinancialAccount } from '../api/financialAccounts';
import FinancialAccountForm from '../components/FinancialAccountForm';

const FinancialAccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await getFinancialAccounts();
            setAccounts(data);
            setError(null);
        } catch (error) {
            setError('فشل في تحميل الحسابات المالية');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingAccount) {
                await updateFinancialAccount(editingAccount.account_id, formData);
            } else {
                await createFinancialAccount(formData);
            }
            setShowForm(false);
            setEditingAccount(null);
            fetchAccounts();
        } catch (error) {
            console.error(error);
            alert('فشل في حفظ الحساب');
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingAccount(null);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAccount(null);
    };

    const handleDeleteClick = (account) => {
        setAccountToDelete(account);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;

        try {
            await deleteFinancialAccount(accountToDelete.account_id);
            fetchAccounts();
            setShowDeleteModal(false);
            setAccountToDelete(null);
        } catch (error) {
            alert('فشل في حذف الحساب (قد يكون مرتبط بمعاملات)');
            console.error(error);
            setShowDeleteModal(false);
            setAccountToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setAccountToDelete(null);
    };

    const filteredAccounts = accounts.filter(account =>
        account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="bg-red-500 text-white px-5 py-4">
                            <h5 className="font-bold flex items-center gap-2">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                تأكيد الحذف
                            </h5>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                هل أنت متأكد من حذف الحساب <strong>"{accountToDelete?.account_name}"</strong>؟
                            </p>
                            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg p-4 flex items-start gap-3">
                                <i className="bi bi-exclamation-circle-fill text-xl"></i>
                                <div>
                                    <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                    <br />
                                    <small>لن تتمكن من حذف الحساب إذا كان مرتبطاً بمعاملات مالية.</small>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors flex items-center gap-2"
                                onClick={cancelDelete}
                            >
                                <i className="bi bi-x-lg"></i>
                                إلغاء
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                onClick={confirmDelete}
                            >
                                <i className="bi bi-trash"></i>
                                حذف نهائياً
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <i className="bi bi-bank text-emerald-600"></i>
                    إدارة الحسابات المالية
                </h2>
                <p className="text-gray-500 dark:text-gray-400">إدارة شجرة الحسابات والأرصدة</p>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                    </span>
                    <button className="text-red-500 hover:text-red-700" onClick={() => setError(null)}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 overflow-hidden">
                    <div className="bg-emerald-600 text-white px-5 py-4">
                        <h5 className="font-bold flex items-center gap-2">
                            <i className={`bi ${editingAccount ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                            {editingAccount ? 'تعديل حساب مالي' : 'إضافة حساب مالي جديد'}
                        </h5>
                    </div>
                    <div className="p-5">
                        <FinancialAccountForm
                            account={editingAccount}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <i className="bi bi-search text-gray-400"></i>
                    </div>
                    <input
                        type="text"
                        className="block w-full text-sm rounded-lg border border-gray-300 dark:border-slate-600 ps-10 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                        placeholder="بحث باسم الحساب أو النوع..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    onClick={handleAddNew}
                >
                    <i className="bi bi-plus-lg"></i>
                    إضافة حساب جديد
                </button>
            </div>

            {/* Accounts Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="bi bi-list-ul"></i>
                        دليل الحسابات ({filteredAccounts.length})
                    </h5>
                </div>
                <div>
                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="bi bi-inbox text-gray-400 text-5xl block mb-4"></i>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد حسابات مسجلة</p>
                            <button
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
                                onClick={handleAddNew}
                            >
                                <i className="bi bi-plus-lg"></i>
                                إضافة أول حساب
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">اسم الحساب</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">النوع</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الرصيد الحالي</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredAccounts.map(account => (
                                        <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{account.account_id}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <i className="bi bi-wallet2 text-gray-400"></i>
                                                {account.account_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                                                    {account.account_type}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 font-bold ${account.current_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(account.current_balance)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${account.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {account.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button
                                                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        onClick={() => handleEdit(account)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        onClick={() => handleDeleteClick(account)}
                                                        title="حذف"
                                                    >
                                                        <i className="bi bi-trash"></i>
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
