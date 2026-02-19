import React, { useState } from 'react';
import axios from 'axios';
import JournalEntryForm from '../components/JournalEntryForm';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

const JournalView = () => {
    const { showSuccess, showError } = useToast();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = 'http://localhost:8000/api/v1';

    const handleSave = async (payload) => {
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/journal/journal-entries`, payload);
            setSuccess('تم إنشاء قيد اليومية بنجاح!');
            showSuccess('تم إنشاء قيد اليومية بنجاح');
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'فشل إنشاء قيد اليومية';
            setError(msg);
            showError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            {/* Page Header */}
            <PageHeader
                title="قيد يومية جديد"
                subtitle="تسجيل قيد محاسبي يدوي في دفتر اليومية"
                icon="bi-journal-text"
                gradient="from-indigo-500 to-purple-500"
            >
                {/* Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                <i className="bi bi-journal-plus text-lg text-violet-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>نوع العملية</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--lg-text-primary)' }}>قيد يدوي</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                <i className="bi bi-calendar-date text-lg text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>التاريخ</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--lg-text-primary)' }}>{new Date().toLocaleDateString('en-US')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                                <i className="bi bi-balance-scale text-lg text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>المبدأ</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--lg-text-primary)' }}>القيد المزدوج</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Notifications */}
            {success && (
                <div className="lg-card p-4 mb-6 border-r-4 border-green-500 lg-animate-fade">
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                        <i className="bi bi-check-circle-fill text-xl" />
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="lg-card p-4 mb-6 border-r-4 border-red-500 lg-animate-fade">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <i className="bi bi-exclamation-triangle-fill text-xl" />
                            <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <i className="bi bi-pencil-square ml-2 text-indigo-600 dark:text-indigo-400" />
                        بيانات القيد
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">أدخل بيانات القيد المحاسبي مع التأكد من تطابق المدين والدائن</p>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <LoadingCard rows={6} />
                    ) : (
                        <JournalEntryForm
                            onSave={handleSave}
                            onCancel={() => { setSuccess(null); setError(null); }}
                        />
                    )}
                </div>
            </div>

            {/* Tips */}
            <div className="lg-card p-6 mt-6 lg-animate-fade">
                <h6 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <i className="bi bi-lightbulb text-amber-500" />نصائح
                </h6>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2"><i className="bi bi-check-circle text-green-500 mt-0.5" />تأكد من تطابق مجموع المدين مع مجموع الدائن</li>
                    <li className="flex items-start gap-2"><i className="bi bi-check-circle text-green-500 mt-0.5" />أضف وصف واضح للقيد لتسهيل المراجعة لاحقاً</li>
                    <li className="flex items-start gap-2"><i className="bi bi-check-circle text-green-500 mt-0.5" />راجع الحسابات المختارة قبل الحفظ</li>
                </ul>
            </div>
        </div>
    );
};

export default JournalView;
