import React, { useState, useEffect } from 'react';
import { getCropProfitability } from '../api/reports';
import { useSeasons } from '../hooks/useQueries';
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency, formatPercentage } from '../utils';

const CropPerformance = () => {
    // TanStack Query hooks
    const { data: seasons = [] } = useSeasons();
    const [selectedSeason, setSelectedSeason] = useState('');
    const [profitability, setProfitability] = useState([]);

    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError
    } = usePageState();

    useEffect(() => {
        import('../styles/dashboardAnimations.css');
        import('../styles/liquidglass.css');
        loadData();
    }, [selectedSeason]);

    const loadData = async () => {
        startLoading();
        try {
            const data = await getCropProfitability(selectedSeason);
            if (Array.isArray(data)) {
                setProfitability(data);
            } else {
                console.error("Invalid data format received:", data);
                setProfitability([]);
            }
        } catch (err) {
            console.error(err);
            showError("فشل تحميل بيانات ربحية المحاصيل.");
            setProfitability([]);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="أداء المحاصيل"
                subtitle="تحليل الربحية والتكاليف لكل محصول"
                icon="bi-flower1"
            />

            {/* Filter */}
            <div className="lg-card p-6 mb-6 lg-animate-fade">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <label className="font-bold whitespace-nowrap text-gray-700 dark:text-gray-300">اختر الموسم:</label>
                    <select
                        className="w-full md:w-1/3 lg-input rounded-xl"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        <option value="">جميع المواسم</option>
                        {seasons.map(s => (
                            <option key={s.season_id} value={s.season_id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="lg-card p-4 mb-6 border-r-4 border-red-500 lg-animate-fade">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <i className="bi bi-exclamation-triangle-fill text-xl" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="lg-card p-6"><PageLoading text="جاري تحليل أداء المحاصيل..." /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profitability.map((crop, idx) => (
                        <div key={idx} className="lg-card overflow-hidden lg-hover-lift lg-animate-in" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h5 className="font-bold mb-1 text-gray-800 dark:text-gray-100">{crop.crop_name}</h5>
                                        <small className="text-gray-500 dark:text-gray-400">تحليل الأداء المالي</small>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${crop.profit >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                        {formatPercentage(crop.margin)} هامش
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-xl">
                                    <span className="text-gray-500 dark:text-gray-400">صافي الربح</span>
                                    <span className={`font-bold text-xl ${crop.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(crop.profit)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3">
                                        <small className="block text-gray-500 dark:text-gray-400 mb-1">الإيرادات</small>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(crop.revenue)}</span>
                                    </div>
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3">
                                        <small className="block text-gray-500 dark:text-gray-400 mb-1">التكاليف</small>
                                        <span className="font-bold text-red-500 dark:text-red-400">{formatCurrency(crop.cost)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar for Margin visual */}
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${crop.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(Math.abs(crop.margin), 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {profitability.length === 0 && (
                        <div className="col-span-full text-center py-16 lg-card lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float lg-card">
                                <i className="bi bi-inbox text-5xl text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات متاحة لهذا الموسم</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CropPerformance;
