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
            // Error handling should be improved here or in the form
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
                                    هل أنت متأكد من حذف الحساب <strong>"{accountToDelete?.account_name}"</strong>؟
                                </p>
                                <div className="alert alert-warning d-flex align-items-start">
                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                    <div>
                                        <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                        <br />
                                        <small>لن تتمكن من حذف الحساب إذا كان مرتبطاً بمعاملات مالية.</small>
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
                        <i className="bi bi-bank me-2"></i>
                        إدارة الحسابات المالية
                    </h2>
                    <p className="text-muted">إدارة شجرة الحسابات والأرصدة</p>
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
                            <i className={`bi ${editingAccount ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                            {editingAccount ? 'تعديل حساب مالي' : 'إضافة حساب مالي جديد'}
                        </h5>
                    </div>
                    <div className="card-body">
                        <FinancialAccountForm
                            account={editingAccount}
                            onSave={handleSave}
                            onCancel={handleCancel}
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
                            placeholder="بحث باسم الحساب أو النوع..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleAddNew}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        إضافة حساب جديد
                    </button>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        دليل الحسابات ({filteredAccounts.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد حسابات مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddNew}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة أول حساب
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>اسم الحساب</th>
                                        <th>النوع</th>
                                        <th>الرصيد الحالي</th>
                                        <th>الحالة</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.map(account => (
                                        <tr key={account.account_id}>
                                            <td className="fw-bold">{account.account_id}</td>
                                            <td>
                                                <i className="bi bi-wallet2 me-2 text-secondary"></i>
                                                {account.account_name}
                                            </td>
                                            <td><span className="badge bg-info text-dark">{account.account_type}</span></td>
                                            <td className={`fw-bold ${account.current_balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(account.current_balance)}
                                            </td>
                                            <td>
                                                <span className={`badge ${account.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                    {account.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(account)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
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
