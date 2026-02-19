import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast, ConfirmationModal } from '../components/common';
import { handleApiError } from '../utils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function UserManagement() {
    const { token } = useAuth();
    const { showSuccess, showError } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role_id: 2,
        phone: ''
    });

    const roles = [
        { id: 1, name: 'مدير النظام', icon: 'bi-shield-check', color: 'red' },
        { id: 2, name: 'محاسب', icon: 'bi-calculator', color: 'blue' },
        { id: 3, name: 'موظف مبيعات', icon: 'bi-cart', color: 'green' },
        { id: 4, name: 'موظف مشتريات', icon: 'bi-bag', color: 'purple' },
        { id: 5, name: 'مشاهد', icon: 'bi-eye', color: 'gray' }
    ];

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/auth/users');
            setUsers(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const stats = useMemo(() => {
        const active = users.filter(u => u.is_active).length;
        const inactive = users.filter(u => !u.is_active).length;
        return { total: users.length, active, inactive };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true : selectedFilter === 'active' ? u.is_active : !u.is_active;
            return matchesSearch && matchesFilter;
        });
    }, [users, searchTerm, selectedFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/auth/users', formData);
            setShowModal(false);
            setFormData({ username: '', full_name: '', email: '', password: '', role_id: 2, phone: '' });
            fetchUsers();
            showSuccess('تم إضافة المستخدم بنجاح');
        } catch (err) {
            showError(handleApiError(err, 'user_create'));
        }
    };

    // Delete handler - opens confirmation modal
    const handleDelete = (userId) => {
        setDeletingUserId(userId);
        setShowDeleteConfirm(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!deletingUserId) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/auth/users/${deletingUserId}`);
            setShowDeleteConfirm(false);
            setDeletingUserId(null);
            fetchUsers();
            showSuccess('تم حذف المستخدم');
        } catch (err) {
            showError(handleApiError(err, 'user_delete'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletingUserId(null);
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-slate-200 to-zinc-200 dark:from-slate-800/30 dark:to-zinc-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={6} /></div>
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
                title="تأكيد حذف المستخدم"
                message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Add User Modal */}
            {showModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal" style={{ maxWidth: '520px' }}>
                        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--lg-glass-bg)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-person-plus text-2xl" style={{ color: 'var(--lg-primary)' }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>إضافة مستخدم جديد</h3>
                                <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>إنشاء حساب مستخدم جديد</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">اسم المستخدم *</label>
                                        <input type="text" required className="w-full p-3 lg-input rounded-xl" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل *</label>
                                        <input type="text" required className="w-full p-3 lg-input rounded-xl" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور *</label>
                                        <input type="password" required className="w-full p-3 lg-input rounded-xl" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">الدور الصلاحي</label>
                                        <select className="w-full p-3 lg-input rounded-xl" value={formData.role_id} onChange={e => setFormData({ ...formData, role_id: parseInt(e.target.value) })}>
                                            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                                        <input type="email" className="w-full p-3 lg-input rounded-xl" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end mt-6 pt-4" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء</button>
                                    <button type="submit" className="lg-btn lg-btn-primary px-8 py-2.5 font-bold">حفظ المستخدم</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title="إدارة المستخدمين"
                subtitle="إدارة حسابات المستخدمين والصلاحيات"
                icon="bi-people-fill"
                gradient="from-slate-500 to-zinc-600"
                actions={
                    <ActionButton
                        label="إضافة مستخدم جديد"
                        icon="bi-person-plus-fill"
                        onClick={() => setShowModal(true)}
                        variant="primary"
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-people-fill text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المستخدمين</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نشط</p>
                                <p className="text-lg font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-x-circle text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">غير نشط</p>
                                <p className="text-lg font-bold">{stats.inactive}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث عن مستخدم..." className="w-full md:w-96" />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="الكل" count={users.length} icon="bi-grid" active={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')} color="emerald" />
                <FilterChip label="نشط" count={stats.active} icon="bi-check-circle" active={selectedFilter === 'active'} onClick={() => setSelectedFilter('active')} color="emerald" />
                <FilterChip label="غير نشط" count={stats.inactive} icon="bi-x-circle" active={selectedFilter === 'inactive'} onClick={() => setSelectedFilter('inactive')} color="amber" />
            </div>

            {/* Users Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-slate-500" />
                        قائمة المستخدمين
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(100,116,139,0.15)', color: 'rgb(71,85,105)' }}>{filteredUsers.length}</span>
                    </h5>
                </div>
                <div>
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-people text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا يوجد مستخدمين</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>قم بإضافة مستخدمين للبدء</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">اسم المستخدم</th>
                                        <th className="px-6 py-4 font-bold text-right">الاسم الكامل</th>
                                        <th className="px-6 py-4 font-bold text-right">البريد</th>
                                        <th className="px-6 py-4 font-bold text-right">الدور</th>
                                        <th className="px-6 py-4 font-bold text-right">الحالة</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredUsers.map((user, idx) => (
                                        <tr key={user.user_id} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--lg-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--lg-glass-border)', color: 'var(--lg-primary)' }}>
                                                        <i className="bi bi-person" />
                                                    </div>
                                                    <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.full_name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.email || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                    {user.role_name || roles.find(r => r.id === user.role_id)?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {user.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!user.is_superuser && (
                                                    <button onClick={() => handleDelete(user.user_id)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="حذف">
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                )}
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

export default UserManagement;
