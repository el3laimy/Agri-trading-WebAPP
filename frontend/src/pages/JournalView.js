import React, { useState } from 'react';
import axios from 'axios';
import JournalEntryForm from '../components/JournalEntryForm';

const JournalView = () => {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const API_URL = 'http://localhost:8000/api/v1'; // TODO: Move to config

    const handleSave = async (payload) => {
        setError(null);
        setSuccess(null);
        try {
            // Use axios directly or via a configured instance
            await axios.post(`${API_URL}/journal/journal-entries`, payload);

            setSuccess('تم إنشاء قيد اليومية بنجاح!');
            // In a real app, you'd probably redirect or clear the form
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'فشل إنشاء قيد اليومية';
            setError(msg);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-1">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 me-3">
                            <i className="bi bi-journal-text text-xl"></i>
                        </div>
                        قيد يومية جديد
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 ms-14">تسجيل قيد محاسبي يدوي في دفتر اليومية</p>
                </div>
            </div>

            {/* Notifications */}
            {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-s-4 border-emerald-400 p-4 mb-6 rounded-md shadow-sm animate-fade-in" role="alert">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="bi bi-check-circle-fill text-emerald-400"></i>
                        </div>
                        <div className="ms-3">
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-400 p-4 mb-6 rounded-md shadow-sm animate-fade-in" role="alert">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-400"></i>
                        </div>
                        <div className="ms-3">
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="ms-auto transition-colors hover:text-red-600">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6">
                    <JournalEntryForm
                        onSave={handleSave}
                        onCancel={() => { setSuccess(null); setError(null); }}
                    />
                </div>
            </div>

            {/* TODO: Add a list of past journal entries here */}
        </div>
    );
};

export default JournalView;
