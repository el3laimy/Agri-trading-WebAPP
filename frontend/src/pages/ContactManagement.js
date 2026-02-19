import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContact, updateContact, deleteContact, migrateAndDeleteContact, forceDeleteContact } from '../api/contacts';
import { useContacts, useRefreshData } from '../hooks/useQueries';
import { useToast } from '../components/common';
import { handleApiError } from '../utils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function ContactManagement() {
    const navigate = useNavigate();

    // TanStack Query hooks
    const { data: contacts = [] } = useContacts();
    const { refreshContacts: refreshData } = useRefreshData();
    const { showSuccess, showError } = useToast();

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    // Conflict state
    const [conflictData, setConflictData] = useState(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [migrationTarget, setMigrationTarget] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Stats
    const stats = useMemo(() => {
        const totalContacts = contacts?.length || 0;
        const customers = contacts?.filter(c => c.is_customer).length || 0;
        const suppliers = contacts?.filter(c => c.is_supplier).length || 0;
        const both = contacts?.filter(c => c.is_customer && c.is_supplier).length || 0;
        return { total: totalContacts, customers, suppliers, both };
    }, [contacts]);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormState(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await updateContact(editingContact.contact_id, formState);
                showSuccess('تم تحديث جهة التعامل بنجاح');
            } else {
                await createContact(formState);
                showSuccess('تم إضافة جهة التعامل بنجاح');
            }
            refreshData();
            resetForm();
        } catch (error) {
            console.error("Failed to save contact:", error);
            showError(handleApiError(error, editingContact ? 'contact_update' : 'contact_create'));
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
            showSuccess('تم حذف جهة التعامل بنجاح');
            setShowDeleteModal(false);
            setContactToDelete(null);
        } catch (error) {
            if (error.response?.status === 409) {
                setConflictData(error.response.data.conflicts);
                setShowDeleteModal(false);
                setShowConflictModal(true);
            } else {
                showError(handleApiError(error, 'contact_delete'));
                setShowDeleteModal(false);
                setContactToDelete(null);
            }
        }
    };

    const handleMigrate = async () => {
        if (!contactToDelete || !migrationTarget) return;
        setIsProcessing(true);
        try {
            await migrateAndDeleteContact(contactToDelete.contact_id, parseInt(migrationTarget));
            await refreshData();
            setShowConflictModal(false);
            setContactToDelete(null);
            setConflictData(null);
            setMigrationTarget('');
            showSuccess('تم نقل البيانات وحذف جهة التعامل بنجاح');
        } catch (error) {
            showError(handleApiError(error, 'update'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleForceDelete = async () => {
        if (!contactToDelete) return;
        if (!window.confirm("تحذير: سيتم حذف جميع السجلات المرتبطة نهائياً. هل أنت متأكد؟")) return;

        setIsProcessing(true);
        try {
            await forceDeleteContact(contactToDelete.contact_id);
            await refreshData();
            setShowConflictModal(false);
            setContactToDelete(null);
            setConflictData(null);
            showSuccess('تم حذف جهة التعامل وجميع السجلات المرتبطة');
        } catch (error) {
            showError(handleApiError(error, 'delete'));
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setShowConflictModal(false);
        setContactToDelete(null);
        setConflictData(null);
        setMigrationTarget('');
    };

    const resetForm = () => {
        setFormState({ name: '', phone: '', address: '', email: '', is_supplier: false, is_customer: false });
        setShowAddForm(false);
        setEditingContact(null);
    };

    // Filter contacts
    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.phone?.includes(searchTerm);

            const matchesFilter = selectedFilter === 'all' ? true :
                selectedFilter === 'customers' ? contact.is_customer :
                    selectedFilter === 'suppliers' ? contact.is_supplier : true;

            return matchesSearch && matchesFilter;
        });
    }, [contacts, searchTerm, selectedFilter]);

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal" style={{ maxWidth: '420px' }}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center lg-animate-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--lg-text-primary)' }}>تأكيد الحذف</h3>
                            <p className="mb-6" style={{ color: 'var(--lg-text-muted)' }}>
                                هل أنت متأكد من حذف <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>"{contactToDelete?.name}"</span>؟
                            </p>
                        </div>
                        <div className="px-6 py-4 flex gap-3 justify-center" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                            <button onClick={cancelDelete} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء</button>
                            <button onClick={confirmDelete} className="lg-btn lg-btn-primary px-6 py-2.5" style={{ background: 'rgb(239,68,68)' }}>حذف نهائياً</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Resolution Modal */}
            {showConflictModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal" style={{ maxWidth: '640px' }}>
                        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <i className="bi bi-diagram-3-fill text-2xl text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>لا يمكن الحذف المباشر</h3>
                                <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>جهة التعامل مرتبطة بسجلات أخرى</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {conflictData && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                    {Object.entries(conflictData).map(([key, count]) => (
                                        count > 0 && (
                                            <div key={key} className="p-3 rounded-xl flex justify-between items-center" style={{ background: 'var(--lg-glass-bg)', border: '1px solid var(--lg-glass-border)' }}>
                                                <span className="text-xs font-medium uppercase" style={{ color: 'var(--lg-text-muted)' }}>{key.replace('_', ' ')}</span>
                                                <span className="lg-badge px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgb(217,119,6)' }}>{count}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Option 1: Migrate */}
                                <div className="lg-card p-4">
                                    <div className="flex items-center gap-2 mb-3 font-bold" style={{ color: 'var(--lg-primary)' }}>
                                        <i className="bi bi-arrow-left-right" />
                                        الخيار 1: نقل البيانات (موصى به)
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 lg-input p-2.5 rounded-xl"
                                            value={migrationTarget}
                                            onChange={(e) => setMigrationTarget(e.target.value)}
                                        >
                                            <option value="">-- اختر جهة التعامل البديلة --</option>
                                            {contacts.filter(c => contactToDelete && c.contact_id !== contactToDelete.contact_id).map(c => (
                                                <option key={c.contact_id} value={c.contact_id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="lg-btn lg-btn-primary px-4 py-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleMigrate}
                                            disabled={!migrationTarget || isProcessing}
                                        >
                                            {isProcessing ? 'جاري...' : 'نقل وحذف'}
                                        </button>
                                    </div>
                                </div>

                                {/* Option 2: Force Delete */}
                                <div className="lg-card p-4" style={{ border: '2px solid rgba(239,68,68,0.3)' }}>
                                    <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-bold">
                                        <i className="bi bi-trash-fill" />
                                        الخيار 2: الحذف القسري (خطر)
                                    </div>
                                    <button
                                        className={`w-full px-4 py-2.5 rounded-xl font-bold border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${isProcessing ? 'opacity-50' : ''}`}
                                        onClick={handleForceDelete}
                                        disabled={isProcessing}
                                    >
                                        <i className="bi bi-exclamation-octagon ml-2" />
                                        {isProcessing ? 'جاري الحذف...' : 'حذف جهة التعامل وجميع بياناتها'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                            <button onClick={cancelDelete} disabled={isProcessing} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء الأمر</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title="إدارة جهات التعامل"
                subtitle="إدارة العملاء والموردين وسجلاتهم"
                icon="bi-people"
                gradient="from-purple-500 to-pink-500"
                actions={
                    <ActionButton
                        label={showAddForm ? 'إلغاء' : 'جهة تعامل جديدة'}
                        icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                        variant={showAddForm ? 'danger' : 'primary'}
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-people text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">الإجمالي</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-person-check text-lg text-blue-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">العملاء</p>
                                <p className="text-lg font-bold">{stats.customers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-truck text-lg text-purple-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">الموردين</p>
                                <p className="text-lg font-bold">{stats.suppliers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '300ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-arrow-left-right text-lg text-pink-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">الاثنين معاً</p>
                                <p className="text-lg font-bold">{stats.both}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث بالاسم أو الهاتف..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip
                    label="الكل"
                    count={contacts?.length || 0}
                    icon="bi-grid"
                    active={selectedFilter === 'all'}
                    onClick={() => setSelectedFilter('all')}
                    color="emerald"
                />
                <FilterChip
                    label="العملاء"
                    count={stats.customers}
                    icon="bi-person-check"
                    active={selectedFilter === 'customers'}
                    onClick={() => setSelectedFilter('customers')}
                    color="blue"
                />
                <FilterChip
                    label="الموردين"
                    count={stats.suppliers}
                    icon="bi-truck"
                    active={selectedFilter === 'suppliers'}
                    onClick={() => setSelectedFilter('suppliers')}
                    color="amber"
                />
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className={`bi ${editingContact ? 'bi-pencil-square' : 'bi-plus-circle-fill'} ml-2`} style={{ color: 'var(--lg-primary)' }} />
                            {editingContact ? 'تعديل بيانات جهة التعامل' : 'تسجيل جهة تعامل جديدة'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الاسم *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formState.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الهاتف</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formState.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formState.address}
                                    onChange={handleInputChange}
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formState.email}
                                    onChange={handleInputChange}
                                    className="w-full p-3 lg-input rounded-xl"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">نوع جهة التعامل *</label>
                                <div className="flex gap-6 p-4 rounded-xl" style={{ background: 'var(--lg-glass-bg)', border: '1px solid var(--lg-glass-border)' }}>
                                    <label className="inline-flex items-center cursor-pointer hover-scale">
                                        <input
                                            type="checkbox"
                                            name="is_customer"
                                            checked={formState.is_customer}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="mr-2 text-gray-700 dark:text-gray-200 font-medium flex items-center">
                                            <i className="bi bi-person-check text-blue-500 ml-2" />
                                            عميل
                                        </span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer hover-scale">
                                        <input
                                            type="checkbox"
                                            name="is_supplier"
                                            checked={formState.is_supplier}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="mr-2 text-gray-700 dark:text-gray-200 font-medium flex items-center">
                                            <i className="bi bi-truck text-purple-500 ml-2" />
                                            مورد
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={resetForm} className="lg-btn lg-btn-secondary px-6 py-2.5">
                                إلغاء
                            </button>
                            <button type="submit" className="lg-btn lg-btn-primary px-8 py-2.5 font-bold">
                                <i className="bi bi-check-lg ml-2" />
                                {editingContact ? 'حفظ التعديلات' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Contacts Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-purple-500" />
                        قائمة جهات التعامل
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(168,85,247,0.15)', color: 'rgb(147,51,234)' }}>
                            {filteredContacts.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-people text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد جهات تعامل</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>أضف عملاء وموردين للبدء</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="lg-btn lg-btn-primary inline-flex items-center px-5 py-2.5 font-medium"
                            >
                                <i className="bi bi-plus-lg ml-2" />
                                إضافة جهة تعامل
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">#</th>
                                        <th className="px-6 py-4 font-bold text-right">الاسم</th>
                                        <th className="px-6 py-4 font-bold text-right">معلومات الاتصال</th>
                                        <th className="px-6 py-4 font-bold text-right">النوع</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredContacts.map((contact, idx) => (
                                        <tr key={contact.contact_id} className={`transition-all lg-animate-in`} style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--lg-text-primary)' }}>{contact.contact_id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center ml-3 font-bold" style={{ background: 'var(--lg-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--lg-glass-border)', color: 'var(--lg-primary)' }}>
                                                        {contact.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>{contact.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {contact.phone && (
                                                        <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                            <i className="bi bi-telephone ml-2 text-gray-400" />
                                                            {contact.phone}
                                                        </span>
                                                    )}
                                                    {contact.address && (
                                                        <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                            <i className="bi bi-geo-alt ml-2 text-gray-400" />
                                                            {contact.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {contact.is_customer && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                            <i className="bi bi-person-check text-[10px]" />
                                                            عميل
                                                        </span>
                                                    )}
                                                    {contact.is_supplier && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                                            <i className="bi bi-truck text-[10px]" />
                                                            مورد
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                                                        title="كشف الحساب"
                                                    >
                                                        <i className="bi bi-file-text" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(contact)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(contact)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                                        title="حذف"
                                                    >
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
}

export default ContactManagement;
