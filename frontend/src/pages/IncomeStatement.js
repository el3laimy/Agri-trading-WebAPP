import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { formatCurrency } from '../utils';
import { getIncomeStatement } from '../api/reports';
import { getSeasons } from '../api/seasons';

// Import shared components
import { PageHeader, ActionButton, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

const IncomeStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
    const [endDate, setEndDate] = useState(new Date());
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');

    const { isLoading, startLoading, stopLoading, error, showError } = usePageState();

    const handleGenerateReport = async () => {
        startLoading();
        setReportData(null);
        try {
            const start = startDate.toISOString().split('T')[0];
            const end = endDate.toISOString().split('T')[0];
            const data = await getIncomeStatement(start, end);
            setReportData(data);
        } catch (err) {
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
                setStartDate(new Date(season.start_date));
                setEndDate(new Date(season.end_date));
            }
        }
    };

    const handlePrint = () => { window.print(); };

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¯Ø®Ù„"
                subtitle="ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø±Ø¨Ø§Ø­ ÙˆØ§Ù„Ø®Ø³Ø§Ø¦Ø± ÙˆØ§Ù„Ù†ØªØ§Ø¦Ø¬ Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©"
                icon="bi-graph-up-arrow"
                gradient="from-teal-500 to-cyan-500"
                actions={
                    reportData && (
                        <ActionButton
                            label="Ø·Ø¨Ø§Ø¹Ø©"
                            icon="bi-printer"
                            onClick={handlePrint}
                            variant="primary"
                        />
                    )
                }
            >
                {/* Stats Preview */}
                {reportData && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="lg-card px-4 py-3 rounded-xl lg-animate-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center lg-animate-float">
                                    <i className="bi bi-arrow-down-circle text-lg text-green-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª</p>
                                    <p className="text-lg font-bold">{formatCurrency(reportData.total_revenue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg-card px-4 py-3 rounded-xl lg-animate-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center lg-animate-float">
                                    <i className="bi bi-arrow-up-circle text-lg text-red-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª</p>
                                    <p className="text-lg font-bold">{formatCurrency(reportData.total_expense)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg-card px-4 py-3 rounded-xl lg-animate-in">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${reportData.net_income >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'} flex items-center justify-center lg-animate-float`}>
                                    <i className={`bi ${reportData.net_income >= 0 ? 'bi-graph-up' : 'bi-graph-down'} text-lg ${reportData.net_income >= 0 ? 'text-emerald-300' : 'text-red-300'}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">ØµØ§ÙÙŠ Ø§Ù„Ø±Ø¨Ø­</p>
                                    <p className="text-lg font-bold">{formatCurrency(reportData.net_income)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageHeader>

            {/* Date Filters */}
            <div className="lg-card p-6 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ù…Ù† ØªØ§Ø±ÙŠØ®</label>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="w-full p-3 lg-input rounded-xl"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ø¥Ù„Ù‰ ØªØ§Ø±ÙŠØ®</label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="w-full p-3 lg-input rounded-xl"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ø§Ù„Ù…ÙˆØ³Ù…</label>
                        <select className="w-full p-3 lg-input rounded-xl" value={selectedSeason} onChange={handleSeasonChange}>
                            <option value="">ØªØ®ØµÙŠØµ ØªØ§Ø±ÙŠØ®</option>
                            {seasons.map(s => <option key={s.season_id} value={s.season_id}>{s.name} ({s.status})</option>)}
                        </select>
                    </div>
                    <div>
                        <button
                            className="w-full px-6 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-bold transition-all hover-scale disabled:opacity-50"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            <i className="bi bi-file-earmark-bar-graph ml-2" />
                            {isLoading ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ø¶ÙŠØ±...' : 'Ø¹Ø±Ø¶ Ø§Ù„ØªÙ‚Ø±ÙŠØ±'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="lg-card p-4 mb-6 border-r-4 border-red-500 lg-animate-fade">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <i className="bi bi-exclamation-triangle-fill text-xl" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="lg-card p-6 lg-animate-fade">
                    <LoadingCard rows={8} />
                </div>
            )}

            {/* Report */}
            {reportData && !isLoading && (
                <div className="lg-card overflow-hidden lg-animate-fade print-section">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 text-center">
                        <h3 className="text-xl font-bold text-teal-700 dark:text-teal-400 mb-2">Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¯Ø®Ù„</h3>
                        <p className="text-gray-500 dark:text-gray-400">Ù„Ù„ÙØªØ±Ø© Ù…Ù† {reportData.start_date} Ø¥Ù„Ù‰ {reportData.end_date}</p>
                    </div>
                    <div className="p-6">
                        {/* Revenues */}
                        <div className="mb-8">
                            <h5 className="font-bold text-green-600 dark:text-green-400 border-b-2 border-green-200 dark:border-green-800 pb-2 mb-4 flex items-center gap-2">
                                <i className="bi bi-arrow-down-circle" />Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª
                            </h5>
                            <div className="space-y-2">
                                {reportData.revenues.map((item, index) => (
                                    <div key={`rev-${index}`} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all lg-animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                                        <span className="text-gray-700 dark:text-gray-300">{item.account_name}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 flex justify-between items-center">
                                <span className="font-bold text-green-700 dark:text-green-400">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª</span>
                                <span className="font-bold text-green-700 dark:text-green-400 text-lg">{formatCurrency(reportData.total_revenue)}</span>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="mb-8">
                            <h5 className="font-bold text-red-500 dark:text-red-400 border-b-2 border-red-200 dark:border-red-800 pb-2 mb-4 flex items-center gap-2">
                                <i className="bi bi-arrow-up-circle" />Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª
                            </h5>
                            <div className="space-y-2">
                                {reportData.expenses.map((item, index) => (
                                    <div key={`exp-${index}`} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all lg-animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                                        <span className="text-gray-700 dark:text-gray-300">{item.account_name}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 flex justify-between items-center">
                                <span className="font-bold text-red-600 dark:text-red-400">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª</span>
                                <span className="font-bold text-red-600 dark:text-red-400 text-lg">{formatCurrency(reportData.total_expense)}</span>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className={`p-6 rounded-2xl shadow-lg ${reportData.net_income >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800' : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className={`font-bold text-lg ${reportData.net_income >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        ØµØ§ÙÙŠ Ø§Ù„Ø±Ø¨Ø­ / (Ø§Ù„Ø®Ø³Ø§Ø±Ø©)
                                    </h4>
                                    <small className="text-gray-500 dark:text-gray-400">Ø§Ù„Ù†Ø§ØªØ¬ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø®Ù„Ø§Ù„ Ø§Ù„ÙØªØ±Ø©</small>
                                </div>
                                <h2 className={`font-bold text-3xl ${reportData.net_income >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {formatCurrency(reportData.net_income)}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatement;

