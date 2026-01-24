import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { getCrops } from '../api/crops';
import { getExpenses, createExpense, deleteExpense } from '../api/expenses';
import { safeParseFloat } from '../utils/mathUtils'; // Import safe parser

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

function ExpenseManagement() {
    const { hasPermission } = useAuth();
    const { showSuccess, showError } = useToast();

    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);

    const [formState, setFormState] = useState({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
        category: 'عام',
        expense_type: 'INDIRECT',
        crop_id: '',
        credit_account_id: '',  // Required by backend
        debit_account_id: ''    // Required by backend
    });
    const [crops, setCrops] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // Fetch expenses
    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getExpenses();
            setExpenses(data);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
            // Don't call showError here to avoid dependency issues
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
        fetchCrops();
        fetchAccounts();
    }, [fetchExpenses]);

    const fetchCrops = async () => {
        try {
            const data = await getCrops();
            setCrops(data.filter(c => c.is_active));
        } catch (err) {
            console.error('Failed to fetch crops');
        }
    };

    const fetchAccounts = async () => {
        try {
            const { getFinancialAccounts } = await import('../api/financialAccounts');
            const data = await getFinancialAccounts();
            setAccounts(data);
        } catch (err) {
            console.error('Failed to fetch accounts');
        }
    };

    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + (safeParseFloat(e.amount) || 0), 0);
        const thisMonth = expenses.filter(e => {
            const expDate = new Date(e.expense_date);
            const now = new Date();
            return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + (safeParseFloat(e.amount) || 0), 0);
        return { total, thisMonth, count: expenses.length };
    }, [expenses]);

    const formatCurrency = (value) => {
        if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
        return value?.toLocaleString('ar-EG') + ' ج.م';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                expense_date: formState.expense_date,
                description: formState.description,
                amount: safeParseFloat(formState.amount),
                credit_account_id: parseInt(formState.credit_account_id),
                debit_account_id: parseInt(formState.debit_account_id),
                supplier_id: null,  // Optional
                // These are extra fields stored in DB but not required by schema
                category: formState.category,
                expense_type: formState.expense_type,
                crop_id: formState.crop_id ? parseInt(formState.crop_id) : null
            };
            await createExpense(payload);
            showSuccess('تم تسجيل المصروف بنجاح');
            setFormState({
                description: '',
                amount: '',
                expense_date: new Date().toISOString().slice(0, 10),
                category: 'عام',
                expense_type: 'INDIRECT',
                crop_id: '',
                credit_account_id: '',
                debit_account_id: ''
            });
            setShowAddForm(false);
            fetchExpenses();
        } catch (err) {
            console.error('Expense creation error:', err);
            showError(err.response?.data?.detail || 'فشل في تسجيل المصروف');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            await deleteExpense(id);
            showSuccess('تم حذف المصروف');
            fetchExpenses();
        } catch (err) {
            showError('فشل في حذف المصروف');
        }
    };

    // Filter
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e =>
            e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    if (isLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-rose-200 to-red-200 dark:from-rose-800/30 dark:to-red-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="إدارة المصروفات"
                subtitle="تتبع وتسجيل جميع المصروفات اليومية"
                icon="bi-wallet2"
                gradient="from-rose-500 to-red-500"
                actions={
                    hasPermission('expenses:write') && (
                        <ActionButton
                            label={showAddForm ? 'إلغاء' : 'تسجيل مصروف'}
                            icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                            onClick={() => setShowAddForm(!showAddForm)}
                            variant={showAddForm ? 'danger' : 'primary'}
                        />
                    )
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-wallet2 text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المصروفات</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.total)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-calendar-month text-lg text-rose-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">هذا الشهر</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.thisMonth)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-receipt text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">عدد العمليات</p>
                                <p className="text-lg font-bold">{stats.count}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث في المصروفات..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-plus-circle-fill ml-2 text-rose-600 dark:text-rose-400" />
                            تسجيل مصروف جديد
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الوصف *</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formState.description}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ *</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formState.amount}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ</label>
                                <input
                                    type="date"
                                    name="expense_date"
                                    value={formState.expense_date}
                                    onChange={handleInputChange}
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">التصنيف</label>
                                <select
                                    name="category"
                                    value={formState.category}
                                    onChange={handleInputChange}
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                >
                                    <option value="عام">عام</option>
                                    <option value="نقل">نقل</option>
                                    <option value="عمالة">عمالة</option>
                                    <option value="صيانة">صيانة</option>
                                    <option value="إيجار">إيجار</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">حساب المصروف (مدين) *</label>
                                <select
                                    name="debit_account_id"
                                    value={formState.debit_account_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">-- اختر حساب المصروف --</option>
                                    {accounts.filter(a => a.account_type === 'EXPENSE').map(acc => (
                                        <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">طريقة الدفع (دائن) *</label>
                                <select
                                    name="credit_account_id"
                                    value={formState.credit_account_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">-- اختر طريقة الدفع --</option>
                                    {accounts.filter(a => ['ASSET', 'LIABILITY'].includes(a.account_type)).map(acc => (
                                        <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">نوع المصروف</label>
                                <select
                                    name="expense_type"
                                    value={formState.expense_type}
                                    onChange={handleInputChange}
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                >
                                    <option value="INDIRECT">عام (تشغيلي)</option>
                                    <option value="DIRECT">خاص بمحصول</option>
                                </select>
                            </div>
                            {formState.expense_type === 'DIRECT' && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول</label>
                                    <select
                                        name="crop_id"
                                        value={formState.crop_id}
                                        onChange={handleInputChange}
                                        className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">-- اختر محصول --</option>
                                        {crops.map(crop => (
                                            <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold hover-scale"
                            >
                                <i className="bi bi-check-lg ml-2" />
                                حفظ
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-rose-500" />
                        سجل المصروفات
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                            {filteredExpenses.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-wallet2 text-5xl text-rose-400 dark:text-rose-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد مصروفات</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ابدأ بتسجيل مصروفاتك اليومية</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">التاريخ</th>
                                        <th className="px-6 py-4 font-bold text-right">الوصف</th>
                                        <th className="px-6 py-4 font-bold text-right">التصنيف</th>
                                        <th className="px-6 py-4 font-bold text-right">المبلغ</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredExpenses.map((expense, idx) => (
                                        <tr key={expense.expense_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {new Date(expense.expense_date).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                {expense.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                                                    {expense.category || 'عام'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                                                {expense.amount?.toLocaleString('ar-EG')} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(expense.expense_id)}
                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                                    title="حذف"
                                                >
                                                    <i className="bi bi-trash" />
                                                </button>
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
}

export default ExpenseManagement;
