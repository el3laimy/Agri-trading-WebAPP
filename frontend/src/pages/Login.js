import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, error, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // إذا كان المستخدم مسجل دخول، توجيهه للوحة التحكم
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const success = await login(username, password);

        setLoading(false);

        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{
                background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 50%, #C4A35A 100%)'
            }}>
            <div className="card border-0 shadow-lg" style={{ width: '400px', borderRadius: '20px' }}>
                <div className="card-body p-5">
                    {/* Logo */}
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                            style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)',
                                boxShadow: '0 4px 15px rgba(30, 86, 49, 0.3)'
                            }}>
                            <i className="bi bi-bar-chart-line-fill text-white" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: '#1E5631' }}>نظام المحاسبة الزراعية</h3>
                        <p className="text-muted">مرحباً بك، سجّل دخولك للمتابعة</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">اسم المستخدم</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-person text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="أدخل اسم المستخدم"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">كلمة المرور</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-lock text-muted"></i>
                                </span>
                                <input
                                    type="password"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="أدخل كلمة المرور"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-lg w-100 text-white fw-bold"
                            style={{
                                background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)',
                                borderRadius: '10px',
                                padding: '12px'
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    جاري تسجيل الدخول...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    تسجيل الدخول
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center mt-4">
                        <small className="text-muted">
                            © 2024 نظام المحاسبة الزراعية - جميع الحقوق محفوظة
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
