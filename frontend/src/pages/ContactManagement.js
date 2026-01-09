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
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 sm:px-6 flex items-center border-b border-red-100 dark:border-red-900/30">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400"></i>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                    <h3 className="text-lg leading-6 font-medium text-red-800 dark:text-red-400" id="modal-title">تأكيد الحذف</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-2 text-center sm:text-right w-full">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            هل أنت متأكد من حذف جهة التعامل <span className="font-bold text-gray-800 dark:text-gray-200">"{contactToDelete?.name}"</span>؟
                                        </p>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border-s-4 border-amber-500 p-4 rounded text-sm text-amber-700 dark:text-amber-400">
                                            <div className="flex">
                                                <i className="bi bi-exclamation-circle-fill me-2 text-lg"></i>
                                                <div>
                                                    <p className="font-bold mb-1">تحذير:</p>
                                                    <p>لا يمكن التراجع عن هذا الإجراء. لن تتمكن من حذف جهة التعامل إذا كانت مرتبطة بعمليات بيع أو شراء سابقة.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={confirmDelete}
                                >
                                    حذف نهائياً
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                                <i className="bi bi-people"></i>
                            </span>
                            إدارة جهات التعامل
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 ms-12">إدارة العملاء والموردين وسجلاتهم</p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                    <div className="flex-1">
                        <p className="text-red-800 dark:text-red-300 font-medium m-0">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-s-4 border-emerald-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in">
                    <i className="bi bi-check-circle-fill text-emerald-500 text-xl me-3"></i>
                    <div className="flex-1">
                        <p className="text-emerald-800 dark:text-emerald-300 font-medium m-0">{success}</p>
                    </div>
                    <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 gap-4">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <i className="bi bi-search text-gray-400"></i>
                    </div>
                    <input
                        type="text"
                        className="block w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 ps-10 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-slate-700 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="بحث بالاسم أو الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className={`nav-link px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 ${showAddForm ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent'}`}
                    onClick={() => {
                        if (showAddForm) {
                            resetForm();
                        } else {
                            setShowAddForm(true);
                        }
                    }}
                >
                    <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
                    {showAddForm ? 'إلغاء' : 'جهة تعامل جديدة'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6 animate-slide-down">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <div className={`p-2 rounded-lg ${editingContact ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            <i className={`bi ${editingContact ? 'bi-pencil-square' : 'bi-plus-circle'} text-xl`}></i>
                        </div>
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0">
                            {editingContact ? 'تعديل بيانات جهة التعامل' : 'تسجيل جهة تعامل جديدة'}
                        </h5>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الاسم *</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                    id="name"
                                    name="name"
                                    value={formState.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الهاتف</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                    id="phone"
                                    name="phone"
                                    value={formState.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                    id="address"
                                    name="address"
                                    value={formState.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                    id="email"
                                    name="email"
                                    value={formState.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">نوع جهة التعامل *</label>
                                <div className="flex gap-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-emerald-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                            name="is_customer"
                                            checked={formState.is_customer}
                                            onChange={handleInputChange}
                                        />
                                        <span className="ms-2 text-gray-700 dark:text-gray-200 font-medium select-none flex items-center">
                                            <i className="bi bi-person-check text-emerald-500 dark:text-emerald-400 me-2"></i>
                                            عميل
                                        </span>
                                    </label>

                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-emerald-600 dark:text-emerald-500 rounded focus:ring-emerald-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                            name="is_supplier"
                                            checked={formState.is_supplier}
                                            onChange={handleInputChange}
                                        />
                                        <span className="ms-2 text-gray-700 dark:text-gray-200 font-medium select-none flex items-center">
                                            <i className="bi bi-truck text-blue-500 dark:text-blue-400 me-2"></i>
                                            مورد
                                        </span>
                                    </label>
                                </div>
                                {!formState.is_customer && !formState.is_supplier && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        <i className="bi bi-info-circle me-1"></i>
                                        يرجى اختيار نوع واحد على الأقل (عميل أو مورد)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                type="button"
                                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm"
                                onClick={resetForm}
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-colors flex items-center"
                            >
                                <i className="bi bi-check-lg me-2"></i>
                                {editingContact ? 'حفظ التعديلات' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Contacts Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex justify-between items-center transition-colors">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center">
                        <i className="bi bi-list-ul me-2 text-emerald-600 dark:text-emerald-400"></i>
                        قائمة جهات التعامل
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full ms-2 border border-emerald-200 dark:border-emerald-800/50">
                            {filteredContacts.length}
                        </span>
                    </h5>
                </div>

                {filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-gray-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <i className="bi bi-people text-4xl text-gray-300 dark:text-gray-600"></i>
                        </div>
                        <h6 className="text-gray-500 dark:text-gray-400 font-medium mb-2">لا توجد جهات تعامل مسجلة</h6>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">يمكنك إضافة عملاء وموردين جدد للبدء في المعاملات</p>
                        <button
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            onClick={() => setShowAddForm(true)}
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            إضافة جهة تعامل
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700 transition-colors">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-bold"># ID</th>
                                    <th scope="col" className="px-6 py-3 font-bold">الاسم</th>
                                    <th scope="col" className="px-6 py-3 font-bold">معلومات الاتصال</th>
                                    <th scope="col" className="px-6 py-3 font-bold">النوع</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-end">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-right">
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.contact_id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {contact.contact_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 me-3 font-bold text-xs shrink-0 transition-colors">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{contact.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {contact.phone && (
                                                    <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <i className="bi bi-telephone me-2 text-gray-400 dark:text-gray-500"></i>
                                                        {contact.phone}
                                                    </span>
                                                )}
                                                {contact.address && (
                                                    <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <i className="bi bi-geo-alt me-2 text-gray-400 dark:text-gray-500"></i>
                                                        {contact.address}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {contact.is_customer && (
                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                                                        عميل
                                                    </span>
                                                )}
                                                {contact.is_supplier && (
                                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs font-medium px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
                                                        مورد
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex justify-end gap-2 text-right">
                                                <button
                                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                                    onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                                                    title="كشف الحساب"
                                                >
                                                    <i className="bi bi-file-text text-lg"></i>
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    onClick={() => handleEdit(contact)}
                                                    title="تعديل"
                                                >
                                                    <i className="bi bi-pencil mt-1"></i>
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
    );
}

export default ContactManagement;
