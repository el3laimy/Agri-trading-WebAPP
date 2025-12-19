import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
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
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white">إدارة المستخدمين</h2>
                <Button variant="success" onClick={() => setShowModal(true)}>
                    <i className="bi bi-person-plus-fill me-2"></i>
                    إضافة مستخدم جديد
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>اسم المستخدم</th>
                                <th>الاسم الكامل</th>
                                <th>البريد الإلكتروني</th>
                                <th>الدور</th>
                                <th>الحالة</th>
                                <th>آخر دخول</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.user_id}>
                                    <td className="fw-bold">{user.username}</td>
                                    <td>{user.full_name}</td>
                                    <td>{user.email || '-'}</td>
                                    <td>
                                        <Badge bg="info">
                                            {user.role_name || roles.find(r => r.id === user.role_id)?.name}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={user.is_active ? 'success' : 'danger'}>
                                            {user.is_active ? 'نشط' : 'غير نشط'}
                                        </Badge>
                                    </td>
                                    <td dir="ltr">
                                        {user.last_login ? new Date(user.last_login).toLocaleString('ar-EG') : '-'}
                                    </td>
                                    <td>
                                        {!user.is_superuser && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(user.user_id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">
                                        لا يوجد مستخدمين
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Add User Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered dir="rtl">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>إضافة مستخدم جديد</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>اسم المستخدم</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>الاسم الكامل</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>كلمة المرور</Form.Label>
                            <Form.Control
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>الدور الصلاحي</Form.Label>
                            <Form.Select
                                value={formData.role_id}
                                onChange={e => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>البريد الإلكتروني (اختياري)</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>رقم الهاتف (اختياري)</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit">
                                حفظ المستخدم
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default UserManagement;
