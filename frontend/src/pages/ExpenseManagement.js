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
                    font: { family: 'Cairo' } // Assumes custom font available
                }
            }
        },
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
            </div>
        </div>
    );

    const StatCard = ({ title, value, icon, colorClass, gradient }) => (
        <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100 text-white overflow-hidden position-relative" style={{ background: gradient }}>
                <div className="card-body p-4 position-relative z-1">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <p className="mb-0 opacity-75 small">{title}</p>
                            <h3 className="fw-bold mb-0 mt-1">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)}</h3>
                        </div>
                        <div className={`icon-circle bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center`}>
                            <i className={`bi ${icon} fs-4 text-white`}></i>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="position-absolute top-0 opacity-10" style={{ left: '0', marginLeft: '-15px', marginTop: '-10px' }}>
                    <i className={`bi ${icon} display-1`}></i>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {/* Warning Modal */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body p-4 text-center">
                                <i className="bi bi-exclamation-circle text-danger display-1 mb-3"></i>
                                <h4 className="fw-bold mb-2">تأكيد الحذف</h4>
                                <p className="text-muted mb-4">هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.</p>
                                <div className="d-flex justify-content-center gap-2">
                                    <button className="btn btn-secondary px-4" onClick={cancelDelete}>إلغاء</button>
                                    <button className="btn btn-danger px-4" onClick={confirmDelete}>حذف نهائي</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1a4133' }}>إدارة المصروفات</h2>
                    <p className="text-muted mb-0 small">نظرة عامة على مصروفات المزرعة</p>
                </div>
                <button
                    className="btn btn-primary btn-lg shadow fw-bold px-4"
                    onClick={handleAdd}
                    style={{ borderRadius: '12px' }}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    مصروف جديد
                </button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
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

            <div className="row g-4 mb-4">
                {/* Chart Section */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100 rounded-4">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                            <h6 className="fw-bold mb-0 text-uppercase small ls-1 text-muted">توزيع المصروفات</h6>
                        </div>
                        <div className="card-body p-4 position-relative">
                            <div style={{ height: '250px' }}>
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                            {stats.distribution.length === 0 && (
                                <div className="position-absolute top-50 start-50 translate-middle text-center text-muted">
                                    <small>لا توجد بيانات كافية</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form or List Section */}
                <div className="col-lg-8">
                    {showForm ? (
                        <div className="card border-0 shadow-sm rounded-4 h-100 fade-in">
                            <div className="card-header bg-white border-bottom pt-4 px-4 pb-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    {editingExpense ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
                                </h5>
                                <button className="btn btn-close bg-light" onClick={() => setShowForm(false)}></button>
                            </div>
                            <ExpenseForm
                                expense={editingExpense}
                                onSave={handleSave}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-bottom pt-4 px-4 pb-3">
                                <div className="row g-3 align-items-center">
                                    <div className="col">
                                        <h5 className="mb-0 fw-bold">سجل العمليات</h5>
                                    </div>
                                    <div className="col-auto">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-start-0"
                                                placeholder="بحث..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="px-4 py-3 border-0 rounded-start">المبلغ</th>
                                            <th className="py-3 border-0">الوصف</th>
                                            <th className="py-3 border-0">التصنيف</th>
                                            <th className="py-3 border-0">التاريخ</th>
                                            <th className="py-3 border-0 rounded-end text-end px-4">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.slice(0, 10).map(expense => (
                                            <tr key={expense.expense_id} style={{ cursor: 'pointer' }}>
                                                <td className="px-4 fw-bold text-dark">
                                                    {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(expense.amount)}
                                                </td>
                                                <td>
                                                    <span className="fw-bold d-block text-dark">{expense.description}</span>
                                                    {expense.supplier && <span className="small text-muted"><i className="bi bi-person me-1"></i>{expense.supplier.name}</span>}
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border fw-normal">
                                                        {expense.debit_account.account_name}
                                                    </span>
                                                </td>
                                                <td className="text-muted small">
                                                    {new Date(expense.expense_date).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="text-end px-4">
                                                    <button
                                                        className="btn btn-sm btn-icon btn-light rounded-circle text-primary me-2 shadow-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(expense); }}
                                                    >
                                                        <i className="bi bi-pencil-fill small"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-icon btn-light rounded-circle text-danger shadow-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(expense); }}
                                                    >
                                                        <i className="bi bi-trash-fill small"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredExpenses.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5 text-muted">
                                                    <i className="bi bi-inbox display-6 d-block mb-3 opacity-25"></i>
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
