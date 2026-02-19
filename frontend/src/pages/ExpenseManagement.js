import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks';
import { useToast, ConfirmationModal } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { getCrops } from '../api/crops';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { safeParseFloat } from '../utils/mathUtils'; // Import safe parser
import { handleApiError } from '../utils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function ExpenseManagement() {
    const { hasPermission } = useAuth();
    const { showSuccess, showError } = useToast();

    const { data: expenses = [], isLoading } = useExpenses();
    const createMutation = useCreateExpense();
    const updateMutation = useUpdateExpense();
    const deleteMutation = useDeleteExpense();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingExpenseId, setDeletingExpenseId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    useEffect(() => {
        fetchCrops();
        fetchAccounts();
    }, []);

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
        return value?.toLocaleString('en-US') + ' ج.م';
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

            if (editingExpenseId) {
                await updateMutation.mutateAsync({ expenseId: editingExpenseId, data: payload });
                showSuccess('تم تعديل المصروف بنجاح');
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess('تم تسجيل المصروف بنجاح');
            }

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
            setEditingExpenseId(null);
        } catch (err) {
            console.error('Expense operation error:', err);
            showError(handleApiError(err, 'expense_operation'));
        }
    };

    const handleEdit = (expense) => {
        setFormState({
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            category: expense.category || 'عام',
            expense_type: expense.expense_type || 'INDIRECT',
            crop_id: expense.crop_id || '',
            credit_account_id: expense.credit_account_id || '',
            debit_account_id: expense.debit_account_id || ''
        });
        setEditingExpenseId(expense.expense_id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete handler - opens confirmation modal
    const handleDelete = (id) => {
        setDeletingExpenseId(id);
        setShowDeleteConfirm(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!deletingExpenseId) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(deletingExpenseId);
            showSuccess('تم حذف المصروف');
            setShowDeleteConfirm(false);
            setDeletingExpenseId(null);
        } catch (err) {
            showError(handleApiError(err, 'expense_delete'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletingExpenseId(null);
    };

    // Filter
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e =>
            e.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            e.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [expenses, debouncedSearchTerm]);

    if (isLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-skeleton h-40 rounded-3xl mb-6" />
                <div className="lg-card p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="تأكيد حذف المصروف"
                message="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
                isLoading={isDeleting}
            />

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
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                if (showAddForm) setEditingExpenseId(null);
                            }}
                            variant={showAddForm ? 'danger' : 'primary'}
                        />
                    )
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-wallet2 text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المصروفات</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.total)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-calendar-month text-lg text-rose-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">هذا الشهر</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.thisMonth)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center lg-animate-float">
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
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className={`bi ${editingExpenseId ? 'bi-pencil-square' : 'bi-plus-circle-fill'} ml-2`} style={{ color: 'var(--lg-primary)' }} />
                            {editingExpenseId ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
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
                                    className="w-full p-3 lg-input rounded-xl"
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
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ</label>
                                <input
                                    type="date"
                                    name="expense_date"
                                    value={formState.expense_date}
                                    onChange={handleInputChange}
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">التصنيف</label>
                                <select
                                    name="category"
                                    value={formState.category}
                                    onChange={handleInputChange}
                                    className="w-full p-3 lg-input rounded-xl"
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
                                    className="w-full p-3 lg-input rounded-xl"
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
                                    className="w-full p-3 lg-input rounded-xl"
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
                                    className="w-full p-3 lg-input rounded-xl"
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
                                        className="w-full p-3 lg-input rounded-xl"
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
                                onClick={() => { setShowAddForm(false); setEditingExpenseId(null); }}
                                className="lg-btn lg-btn-secondary px-6 py-2.5"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="lg-btn lg-btn-primary px-8 py-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="bi bi-check-lg ml-2" />
                                {editingExpenseId ? 'حفظ التعديلات' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-rose-500" />
                        سجل المصروفات
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(244,63,94,0.15)', color: 'rgb(225,29,72)' }}>
                            {filteredExpenses.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-wallet2 text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد مصروفات</h4>
                            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>ابدأ بتسجيل مصروفاتك اليومية</p>
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
                                                {new Date(expense.expense_date).toLocaleDateString('en-US')}
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
                                                {expense.amount?.toLocaleString('en-US')} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all ml-2"
                                                    title="تعديل"
                                                >
                                                    <i className="bi bi-pencil" />
                                                </button>
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
