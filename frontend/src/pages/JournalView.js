import React, { useState } from 'react';
import axios from 'axios';
import JournalEntryForm from '../components/JournalEntryForm';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-journal-plus text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نوع العملية</p>
                                <p className="text-sm font-bold">قيد يدوي</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-calendar-date text-lg text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">التاريخ</p>
                                <p className="text-sm font-bold">{new Date().toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-balance-scale text-lg text-purple-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">المبدأ</p>
                                <p className="text-sm font-bold">القيد المزدوج</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Notifications */}
            {success && (
                <div className="neumorphic p-4 mb-6 border-r-4 border-green-500 animate-fade-in">
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                        <i className="bi bi-check-circle-fill text-xl" />
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="neumorphic p-4 mb-6 border-r-4 border-red-500 animate-fade-in">
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
            <div className="neumorphic overflow-hidden animate-fade-in">
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
            <div className="neumorphic p-6 mt-6 animate-fade-in">
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
