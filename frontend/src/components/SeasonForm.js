import React, { useState, useEffect } from 'react';
import { createSeason, updateSeason } from '../api/seasons';

const SeasonForm = ({ season, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        status: 'UPCOMING'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (season) {
            setFormData({
                name: season.name,
                start_date: season.start_date,
                end_date: season.end_date,
                status: season.status
            });
        }
    }, [season]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (season) {
                await updateSeason(season.season_id, formData);
            } else {
                await createSeason(formData);
            }
            onClose(true); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.detail || 'فشل في حفظ الموسم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6 text-right transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
                <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center gap-2">
                    <i className={`bi ${season ? 'bi-pencil' : 'bi-plus-lg'} text-emerald-600 dark:text-emerald-400`}></i>
                    {season ? 'تعديل موسم' : 'إضافة موسم جديد'}
                </h5>
            </div>
            <div className="p-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in text-right">
                        <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                        <div className="flex-1">
                            <p className="text-red-800 dark:text-red-300 font-medium m-0">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموسم</label>
                        <input
                            type="text"
                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البداية</label>
                            <input
                                type="date"
                                className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ النهاية</label>
                            <input
                                type="date"
                                className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
                        <select
                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="UPCOMING">قادم</option>
                            <option value="ACTIVE">نشط</option>
                            <option value="COMPLETED">مكتمل</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </span>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    حفظ الموسم
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                            onClick={() => onClose(false)}
                            disabled={loading}
                        >
                            <i className="bi bi-x-lg"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeasonForm;
