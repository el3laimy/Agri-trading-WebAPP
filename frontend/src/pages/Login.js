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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-600 to-amber-500">
            <div className="w-full max-w-md mx-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-8">
                        {/* Logo */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center shadow-lg">
                                <i className="bi bi-bar-chart-line-fill text-white text-4xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-800 mb-1">نظام المحاسبة الزراعية</h3>
                            <p className="text-gray-500">مرحباً بك، سجّل دخولك للمتابعة</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                                <i className="bi bi-exclamation-triangle-fill ml-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <i className="bi bi-person"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="أدخل اسم المستخدم"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <i className="bi bi-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="أدخل كلمة المرور"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>جاري تسجيل الدخول...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-in-right"></i>
                                        <span>تسجيل الدخول</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <small className="text-gray-400 text-xs">
                                © 2024 نظام المحاسبة الزراعية - جميع الحقوق محفوظة
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

