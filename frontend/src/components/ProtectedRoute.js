import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * مكون لحماية الصفحات التي تتطلب تسجيل دخول
 */
function ProtectedRoute({ children, requiredPermission = null }) {
    const { isAuthenticated, loading, hasPermission } = useAuth();
    const location = useLocation();

    // عرض شاشة تحميل أثناء التحقق
    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p className="text-muted">جاري التحقق من تسجيل الدخول...</p>
                </div>
            </div>
        );
    }

    // إذا لم يكن مسجل دخول، توجيهه لصفحة تسجيل الدخول
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // التحقق من الصلاحية المطلوبة
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <i className="bi bi-shield-x text-danger" style={{ fontSize: '4rem' }}></i>
                    <h3 className="mt-3">غير مصرح</h3>
                    <p className="text-muted">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
                    <a href="/dashboard" className="btn btn-primary">
                        العودة للوحة التحكم
                    </a>
                </div>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;
