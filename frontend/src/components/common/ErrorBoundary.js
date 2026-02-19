import React, { Component } from 'react';

/**
 * ErrorBoundary - مكون لالتقاط أخطاء React وعرض واجهة بديلة
 * 
 * يلتقط الأخطاء في:
 * - render methods
 * - lifecycle methods
 * - constructors of the whole tree below them
 * 
 * لا يلتقط:
 * - Event handlers
 * - Async code
 * - Server-side rendering
 * - Errors in the error boundary itself
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // تحديث state لعرض واجهة الخطأ
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // تسجيل الخطأ
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // يمكن إرسال الخطأ لخدمة تتبع الأخطاء هنا
        // مثل Sentry أو LogRocket
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // واجهة الخطأ المخصصة
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <div className="max-w-lg w-full text-center">
                        {/* أيقونة الخطأ */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-lg">
                            <i className="bi bi-exclamation-triangle text-5xl text-red-500 dark:text-red-400"></i>
                        </div>

                        {/* العنوان */}
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            حدث خطأ غير متوقع
                        </h1>

                        {/* الوصف */}
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            نعتذر عن هذا الخطأ. يمكنك تحديث الصفحة أو المحاولة مرة أخرى.
                        </p>

                        {/* تفاصيل الخطأ (للمطورين) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-right overflow-auto max-h-48">
                                <p className="text-sm font-mono text-red-700 dark:text-red-300">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* أزرار الإجراءات */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-medium"
                            >
                                <i className="bi bi-arrow-counterclockwise ml-2"></i>
                                المحاولة مرة أخرى
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg"
                            >
                                <i className="bi bi-arrow-clockwise ml-2"></i>
                                تحديث الصفحة
                            </button>
                        </div>

                        {/* رابط الرجوع */}
                        <div className="mt-8">
                            <a
                                href="/dashboard"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <i className="bi bi-house ml-1"></i>
                                العودة للصفحة الرئيسية
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * مكون ErrorBoundary وظيفي مع hook
 * للاستخدام في المكونات الوظيفية
 */
export const withErrorBoundary = (WrappedComponent, fallback = null) => {
    return function WithErrorBoundary(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
};

export default ErrorBoundary;
