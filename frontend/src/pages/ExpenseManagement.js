import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import ExpenseForm from '../components/ExpenseForm';

const ExpenseManagement = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await getExpenses();
            setExpenses(data);
            setError(null);
        } catch (err) {
            setError('فشل في تحميل المصروفات');
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
            fetchExpenses();
        } catch (err) {
            console.error(err);
            throw err; // Let the form handle the error display
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
            fetchExpenses();
            setShowDeleteModal(false);
            setExpenseToDelete(null);
        } catch (err) {
            alert('فشل في حذف المصروف');
            console.error(err);
            setShowDeleteModal(false);
            setExpenseToDelete(null);
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

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
            </div>
        </div>
    );

    return (
        <div className="container-fluid">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    تأكيد الحذف
                                </h5>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">
                                    هل أنت متأكد من حذف المصروف <strong>"{expenseToDelete?.description}"</strong>؟
                                </p>
                                <div className="alert alert-warning d-flex align-items-start">
                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                    <div>
                                        <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelDelete}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    حذف نهائياً
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-cash-stack me-2"></i>
                        إدارة المصروفات
                    </h2>
                    <p className="text-muted">تسجيل وتتبع المصروفات اليومية</p>
                </div>
            </div>

            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>}

            {showForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className={`bi ${editingExpense ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                            {editingExpense ? 'تعديل مصروف' : 'تسجيل مصروف جديد'}
                        </h5>
                    </div>
                    <div className="card-body">
                        <ExpenseForm
                            expense={editingExpense}
                            onSave={handleSave}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 search-box"
                            placeholder="بحث في الوصف أو المورد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleAdd}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        تسجيل مصروف جديد
                    </button>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        سجل المصروفات ({filteredExpenses.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد مصروفات مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={handleAdd}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                تسجيل أول مصروف
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>التاريخ</th>
                                        <th>الوصف</th>
                                        <th>المبلغ</th>
                                        <th>حساب مدين (من)</th>
                                        <th>حساب دائن (إلى)</th>
                                        <th>المورد</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(expense => (
                                        <tr key={expense.expense_id}>
                                            <td className="fw-bold">{expense.expense_id}</td>
                                            <td>{new Date(expense.expense_date).toLocaleDateString('ar-EG')}</td>
                                            <td>{expense.description}</td>
                                            <td className="fw-bold text-danger">
                                                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(expense.amount)}
                                            </td>
                                            <td>{expense.debit_account.account_name}</td>
                                            <td>{expense.credit_account.account_name}</td>
                                            <td>{expense.supplier ? expense.supplier.name : '-'}</td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(expense)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteClick(expense)}
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

export default ExpenseManagement;
