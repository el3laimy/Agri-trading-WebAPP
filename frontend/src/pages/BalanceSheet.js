import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';
import { getBalanceSheet } from '../api/reports';
import { getSeasons } from '../api/seasons';

const BalanceSheet = () => {
    const [reportData, setReportData] = useState(null);
    const [endDate, setEndDate] = useState(new Date());
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');

    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError
    } = usePageState();

    // Import CSS animations
    React.useEffect(() => {
        import('../styles/dashboardAnimations.css');
        import('../styles/liquidglass.css');
    }, []);

    const handleGenerateReport = async () => {
        startLoading();
        setReportData(null);

        try {
            const dateStr = endDate.toISOString().split('T')[0];
            const data = await getBalanceSheet(dateStr);
            setReportData(data);
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.detail || err.message || 'Failed to generate report');
        } finally {
            stopLoading();
        }
    };

    const fetchSeasons = async () => {
        try {
            const data = await getSeasons();
            setSeasons(data);
        } catch (err) { console.error("Failed to fetch seasons", err); }
    };

    React.useEffect(() => {
        fetchSeasons();
    }, []);

    const handleSeasonChange = (e) => {
        const seasonId = e.target.value;
        setSelectedSeason(seasonId);
        if (seasonId) {
            const season = seasons.find(s => s.season_id === parseInt(seasonId));
            if (season) {
                setEndDate(new Date(season.end_date));
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <PageHeader
                title="الميزانية العمومية"
                subtitle="تقرير المركز المالي (الأصول، الخصوم، وحقوق الملكية)"
                icon="bi-bank"
            />

            {/* Filter Card */}
            <div className="lg-card p-6 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الميزانية في تاريخ</label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="w-full lg-input rounded-xl"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الموسم</label>
                        <select
                            className="w-full lg-input rounded-xl"
                            value={selectedSeason}
                            onChange={handleSeasonChange}
                        >
                            <option value="">تخصيص تاريخ</option>
                            {seasons.map(s => <option key={s.season_id} value={s.season_id}>{s.name} ({s.status})</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-grow px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            {isLoading ? 'جاري التحضير...' : 'عرض التقرير'}
                        </button>
                        {reportData && (
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={handlePrint}>
                                <i className="bi bi-printer"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
                    {error}
                </div>
            )}

            {isLoading && <PageLoading text="جاري إعداد الميزانية العمومية..." />}

            {reportData && !isLoading && (
                <div className="lg-card overflow-hidden print-section lg-animate-fade">
                    <div className="bg-gray-50 dark:bg-slate-700/50 text-center py-6 border-b border-gray-200 dark:border-slate-600">
                        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">الميزانية العمومية</h3>
                        <p className="text-gray-500 dark:text-gray-400">كما في {reportData.end_date}</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assets Column */}
                            <div className="lg-card lg-glass-thin overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                                <div className="bg-green-600 text-white py-4 px-5">
                                    <h5 className="font-bold text-center">الأصول</h5>
                                </div>
                                <div className="p-4">
                                    <table className="w-full">
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {reportData.assets.map((item, index) => (
                                                <tr key={`asset-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="py-3 text-gray-700 dark:text-gray-300">{item.account_name}</td>
                                                    <td className="py-3 text-left font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700 px-5 py-4 flex justify-between items-center font-bold text-lg">
                                    <span className="text-gray-700 dark:text-gray-300">إجمالي الأصول</span>
                                    <span className="text-green-600 dark:text-green-400">{formatCurrency(reportData.total_assets)}</span>
                                </div>
                            </div>

                            {/* Liabilities & Equity Column */}
                            <div className="flex flex-col gap-6">
                                {/* Liabilities */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex-grow">
                                    <div className="bg-amber-500 text-white py-4 px-5">
                                        <h5 className="font-bold text-center">الخصوم (الالتزامات)</h5>
                                    </div>
                                    <div className="p-4">
                                        <table className="w-full">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {reportData.liabilities.map((item, index) => (
                                                    <tr key={`lia-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="py-3 text-gray-700 dark:text-gray-300">{item.account_name}</td>
                                                        <td className="py-3 text-left font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-700 px-5 py-4 flex justify-between items-center font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">إجمالي الخصوم</span>
                                        <span className="text-gray-800 dark:text-gray-200">{formatCurrency(reportData.total_liabilities)}</span>
                                    </div>
                                </div>

                                {/* Equity */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex-grow">
                                    <div className="bg-cyan-600 text-white py-4 px-5">
                                        <h5 className="font-bold text-center">حقوق الملكية</h5>
                                    </div>
                                    <div className="p-4">
                                        <table className="w-full">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {reportData.equity.map((item, index) => (
                                                    <tr key={`eq-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="py-3 text-gray-700 dark:text-gray-300">{item.account_name}</td>
                                                        <td className="py-3 text-left font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-700 px-5 py-4 flex justify-between items-center font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">إجمالي حقوق الملكية</span>
                                        <span className="text-gray-800 dark:text-gray-200">{formatCurrency(reportData.total_equity)}</span>
                                    </div>
                                </div>

                                {/* Total Liabilities + Equity */}
                                <div className="bg-gray-100 dark:bg-slate-700 rounded-xl p-5 flex justify-between items-center font-bold text-lg shadow-sm">
                                    <span className="text-gray-700 dark:text-gray-300">إجمالي الخصوم وحقوق الملكية</span>
                                    <span className="text-gray-800 dark:text-gray-200">{formatCurrency(reportData.total_liabilities_and_equity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheet;
