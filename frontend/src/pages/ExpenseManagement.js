import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import ExpenseForm from '../components/ExpenseForm';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto'; // Automatically register components

// Register ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseManagement = () => {
    // State
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({
        total_today: 0,
        total_week: 0,
        total_month: 0,
        total_all_time: 0,
        distribution: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesData, statsRes] = await Promise.all([
                getExpenses(),
                fetch('http://localhost:8000/api/v1/reports/expenses-stats')
            ]);

            const statsData = await statsRes.json();

            setExpenses(expensesData);
            setStats(statsData);
            setError(null);
        } catch (err) {
            setError('فشل في تحميل البيانات');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingExpense(null);
        setShowForm(true);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowForm(true);
    };

    const handleSave = async (formData) => {
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.expense_id, formData);
            } else {
                await createExpense(formData);
            }
            setShowForm(false);
            fetchData(); // Refresh both list and stats
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await deleteExpense(expenseToDelete.expense_id);
            fetchData();
            setShowDeleteModal(false);
            setExpenseToDelete(null);
        } catch (err) {
            alert('فشل في حذف المصروف');
            console.error(err);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setExpenseToDelete(null);
    };

    const filteredExpenses = expenses.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDarkMode = document.documentElement.classList.contains('dark');

    // Chart Data
    const chartData = {
        labels: stats.distribution.map(d => d.category),
        datasets: [
            {
                data: stats.distribution.map(d => d.amount),
                backgroundColor: [
                    '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#f87171'
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right',
                rtl: true,
                labels: {
                    font: { family: 'Cairo' },
                    color: isDarkMode ? '#94a3b8' : '#64748b'
                }
            }
        },
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 dark:border-emerald-400" role="status">
                <span className="sr-only">جاري التحميل...</span>
            </div>
        </div>
    );

    const StatCard = ({ title, value, icon, gradient }) => (
        <div className="relative overflow-hidden rounded-xl shadow-sm h-full transition-all hover:shadow-md" style={{ background: gradient }}>
            <div className="p-6 relative z-10 text-white">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="mb-0 opacity-90 text-sm font-medium">{title}</p>
                        <h3 className="text-3xl font-bold mb-0 mt-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)}</h3>
                    </div>
                    <div className="bg-white/20 rounded-full p-2 flex items-center justify-center w-10 h-10 shadow-sm border border-white/10">
                        <i className={`bi ${icon} text-xl text-white`}></i>
                    </div>
                </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 -left-4 opacity-10">
                <i className={`bi ${icon} text-9xl text-white`}></i>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Warning Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-slate-950 dark:bg-opacity-80 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg px-4 pt-5 pb-4 text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-100 dark:border-slate-700 transition-colors">
                            <div className="sm:flex sm:items-start text-right">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                    <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400 text-lg"></i>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ms-4 sm:text-right w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">تأكيد الحذف</h3>
                                    <div className="mt-2 text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transform transition-all hover:scale-105"
                                    onClick={confirmDelete}
                                >
                                    حذف نهائي
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                    onClick={cancelDelete}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-right">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">إدارة المصروفات</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">نظرة عامة على مصروفات المزرعة</p>
                </div>
                <button
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg font-bold flex items-center transition-all hover:shadow-xl transform hover:-translate-y-0.5 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    onClick={handleAdd}
                >
                    <i className="bi bi-plus-lg me-2 text-xl"></i>
                    مصروف جديد
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="اليوم"
                    value={stats.total_today}
                    icon="bi-calendar-check"
                    gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                />
                <StatCard
                    title="هذا الأسبوع"
                    value={stats.total_week}
                    icon="bi-calendar-week"
                    gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                />
                <StatCard
                    title="هذا الشهر"
                    value={stats.total_month}
                    icon="bi-calendar-month"
                    gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                />
                <StatCard
                    title="إجمالي المصروفات"
                    value={stats.total_all_time}
                    icon="bi-wallet2"
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
                {/* Chart Section */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-full overflow-hidden transition-colors">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20">
                            <h6 className="font-bold mb-0 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">توزيع المصروفات</h6>
                        </div>
                        <div className="p-6 relative">
                            <div className="h-64">
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                            {stats.distribution.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <small>لا توجد بيانات كافية</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form or List Section */}
                <div className="lg:col-span-8 text-right">
                    {showForm ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-full animate-fade-in transition-colors">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/20 rounded-t-2xl">
                                <h5 className="mb-0 font-bold text-gray-800 dark:text-gray-100">
                                    {editingExpense ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
                                </h5>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" onClick={() => setShowForm(false)}>
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <div className="p-4">
                                <ExpenseForm
                                    expense={editingExpense}
                                    onSave={handleSave}
                                    onCancel={() => setShowForm(false)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col transition-colors">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20 rounded-t-2xl">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <h5 className="mb-0 font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                        <i className="bi bi-list-ul me-2 text-emerald-600 dark:text-emerald-400"></i>
                                        سجل العمليات
                                    </h5>
                                    <div className="relative w-full sm:w-64">
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                            <i className="bi bi-search"></i>
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pr-10 pl-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                                            placeholder="بحث..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-grow rounded-b-2xl">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">المبلغ</th>
                                            <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الوصف</th>
                                            <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">التصنيف</th>
                                            <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                                            <th scope="col" className="px-6 py-3 text-end text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700 transition-colors">
                                        {filteredExpenses.slice(0, 10).map(expense => (
                                            <tr key={expense.expense_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-default">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(expense.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{expense.description}</div>
                                                    {expense.supplier && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                            <i className="bi bi-person me-1"></i>{expense.supplier.name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 transition-colors">
                                                        {expense.debit_account.account_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(expense.expense_date).toLocaleDateString('en-US')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                                    <button
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-1.5 rounded-full transition-colors me-2 shadow-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(expense); }}
                                                    >
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </button>
                                                    <button
                                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 p-1.5 rounded-full transition-colors shadow-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(expense); }}
                                                    >
                                                        <i className="bi bi-trash-fill"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredExpenses.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <i className="bi bi-inbox text-4xl block mb-2 opacity-50"></i>
                                                    لا توجد نتائج
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseManagement;
