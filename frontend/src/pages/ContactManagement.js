import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContact, updateContact, deleteContact } from '../api/contacts';
import { useData } from '../context/DataContext';

function ContactManagement() {
    const navigate = useNavigate();
    const { contacts, refreshData } = useData();

    const [formState, setFormState] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        is_supplier: false,
        is_customer: false
    });

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormState(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            if (editingContact) {
                await updateContact(editingContact.contact_id, formState);
                setSuccess('تم تحديث جهة التعامل بنجاح');
            } else {
                await createContact(formState);
                setSuccess('تم إضافة جهة التعامل بنجاح');
            }

            refreshData();
            resetForm();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error("Failed to save contact:", error);
            setError(error.response?.data?.detail || "فشل حفظ جهة التعامل");
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormState({
            name: contact.name,
            phone: contact.phone || '',
            address: contact.address || '',
            email: contact.email || '',
            is_supplier: contact.is_supplier,
            is_customer: contact.is_customer
        });
        setShowAddForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleDeleteClick = (contact) => {
        setContactToDelete(contact);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;

        try {
            await deleteContact(contactToDelete.contact_id);
            refreshData();
            setSuccess('تم حذف جهة التعامل بنجاح');
            setShowDeleteModal(false);
            setContactToDelete(null);

            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error("Failed to delete contact:", error);
            setError(error.response?.data?.detail || "فشل حذف جهة التعامل. قد تكون مرتبطة بعمليات بيع أو شراء.");
            setShowDeleteModal(false);
            setContactToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setContactToDelete(null);
    };

    const resetForm = () => {
        setFormState({
            name: '',
            phone: '',
            address: '',
            email: '',
            is_supplier: false,
            is_customer: false
        });
        setShowAddForm(false);
        setEditingContact(null);
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm)
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
                                    هل أنت متأكد من حذف جهة التعامل <strong>"{contactToDelete?.name}"</strong>؟
                                </p>
                                <div className="alert alert-warning d-flex align-items-start">
                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                    <div>
                                        <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                        <br />
                                        <small>لن تتمكن من حذف جهة التعامل إذا كانت مرتبطة بعمليات بيع أو شراء.</small>
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
                        <i className="bi bi-people me-2"></i>
                        إدارة جهات التعامل
                    </h2>
                    <p className="text-muted">إدارة العملاء والموردين</p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>}

            {success && <div className="alert alert-success alert-dismissible fade show" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
            </div>}

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
                            placeholder="بحث بالاسم أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                            if (showAddForm) {
                                resetForm();
                            } else {
                                setShowAddForm(true);
                            }
                        }}
                    >
                        <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                        {showAddForm ? 'إلغاء' : 'إضافة جهة تعامل جديدة'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className={`bi ${editingContact ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                            {editingContact ? 'تعديل جهة تعامل' : 'جهة تعامل جديدة'}
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="name" className="form-label fw-bold">الاسم *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        name="name"
                                        value={formState.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="phone" className="form-label fw-bold">الهاتف</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={formState.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="address" className="form-label fw-bold">العنوان</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address"
                                        name="address"
                                        value={formState.address}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="email" className="form-label fw-bold">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formState.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold">النوع *</label>
                                    <div className="d-flex gap-4">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="is_customer"
                                                name="is_customer"
                                                checked={formState.is_customer}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_customer">
                                                <i className="bi bi-person-check me-1"></i>
                                                عميل
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="is_supplier"
                                                name="is_supplier"
                                                checked={formState.is_supplier}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_supplier">
                                                <i className="bi bi-truck me-1"></i>
                                                مورد
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-2">
                                <button type="submit" className="btn btn-success btn-lg">
                                    <i className="bi bi-check-lg me-2"></i>
                                    {editingContact ? 'تحديث' : 'حفظ'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={resetForm}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contacts Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        قائمة جهات التعامل ({filteredContacts.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد جهات تعامل مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddForm(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة أول جهة تعامل
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>الاسم</th>
                                        <th>الهاتف</th>
                                        <th>العنوان</th>
                                        <th>النوع</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.map(contact => (
                                        <tr key={contact.contact_id}>
                                            <td className="fw-bold">{contact.contact_id}</td>
                                            <td>
                                                <i className="bi bi-person-circle me-2 text-primary"></i>
                                                {contact.name}
                                            </td>
                                            <td>{contact.phone || '-'}</td>
                                            <td>{contact.address || '-'}</td>
                                            <td>
                                                {contact.is_customer && <span className="badge bg-success me-1">عميل</span>}
                                                {contact.is_supplier && <span className="badge bg-info">مورد</span>}
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                                                        title="كشف الحساب"
                                                    >
                                                        <i className="bi bi-file-text"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(contact)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteClick(contact)}
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
}

export default ContactManagement;
