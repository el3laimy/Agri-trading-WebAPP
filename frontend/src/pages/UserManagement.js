import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // New User Form State
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role_id: 2, // Default to Accountant or first non-admin role
        phone: ''
    });

    const roles = [
        { id: 1, name: 'مدير النظام' },
        { id: 2, name: 'محاسب' },
        { id: 3, name: 'موظف مبيعات' },
        { id: 4, name: 'موظف مشتريات' },
        { id: 5, name: 'مشاهد' }
    ];

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/v1/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('فشل في تحميل قائمة المستخدمين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/v1/auth/users', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setFormData({
                username: '',
                full_name: '',
                email: '',
                password: '',
                role_id: 2,
                phone: ''
            });
            fetchUsers();
            alert('تم إضافة المستخدم بنجاح');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'فشل في إضافة المستخدم');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await axios.delete(`http://localhost:8000/api/v1/auth/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchUsers();
            } catch (err) {
                console.error(err);
                alert('فشل في حذف المستخدم');
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans text-right">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                                <i className="bi bi-people-fill"></i>
                            </span>
                            إدارة المستخدمين
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 ms-12">إدارة حسابات المستخدمين والصلاحيات</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm flex items-center gap-2 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        إضافة مستخدم جديد
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in text-right">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                    <div className="flex-1">
                        <p className="text-red-800 dark:text-red-300 font-medium m-0">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden text-right">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex justify-between items-center">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center gap-2">
                        <i className="bi bi-list-ul text-emerald-600 dark:text-emerald-400"></i>
                        قائمة المستخدمين
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            {users.length}
                        </span>
                    </h5>
                </div>

                <div className="overflow-x-auto text-right">
                    <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-bold text-right">اسم المستخدم</th>
                                <th scope="col" className="px-6 py-3 font-bold text-right">الاسم الكامل</th>
                                <th scope="col" className="px-6 py-3 font-bold text-right">البريد الإلكتروني</th>
                                <th scope="col" className="px-6 py-3 font-bold text-right">الدور</th>
                                <th scope="col" className="px-6 py-3 font-bold text-right">الحالة</th>
                                <th scope="col" className="px-6 py-3 font-bold text-right">آخر دخول</th>
                                <th scope="col" className="px-6 py-3 font-bold text-end">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 transition-colors">
                            {users.map(user => (
                                <tr key={user.user_id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100 text-right">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                <i className="bi bi-person"></i>
                                            </div>
                                            {user.username}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{user.full_name}</td>
                                    <td className="px-6 py-4 text-right text-gray-400 dark:text-gray-500">{user.email || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50 transition-colors">
                                            {user.role_name || roles.find(r => r.id === user.role_id)?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded border transition-colors ${user.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>
                                            {user.is_active ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs text-right" dir="ltr">
                                        {user.last_login ? new Date(user.last_login).toLocaleString('ar-EG') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-end">
                                        {!user.is_superuser && (
                                            <button
                                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                onClick={() => handleDelete(user.user_id)}
                                                title="حذف"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <div className="bg-gray-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                            <i className="bi bi-people text-4xl text-gray-300 dark:text-gray-500"></i>
                                        </div>
                                        <h6 className="text-gray-500 dark:text-gray-400 font-medium mb-2">لا يوجد مستخدمين</h6>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm">قم بإضافة مستخدمين للبدء</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 sm:px-6 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                        <i className="bi bi-person-plus text-emerald-600 dark:text-emerald-400"></i>
                                    </div>
                                    <h3 className="text-lg leading-6 font-medium text-emerald-800 dark:text-emerald-400" id="modal-title text-right">إضافة مستخدم جديد</h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="text-right">
                                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 text-right">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المستخدم</label>
                                        <input
                                            type="text"
                                            required
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                                        <input
                                            type="text"
                                            required
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                                        <input
                                            type="password"
                                            required
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدور الصلاحي</label>
                                        <select
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.role_id}
                                            onChange={e => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني (اختياري)</label>
                                        <input
                                            type="email"
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف (اختياري)</label>
                                        <input
                                            type="text"
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 transition-colors">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm transition-colors"
                                    >
                                        حفظ المستخدم
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                        onClick={() => setShowModal(false)}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagement;
