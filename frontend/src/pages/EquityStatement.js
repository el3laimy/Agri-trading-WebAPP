import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';
import { getEquityStatement } from '../api/reports';

const EquityStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
    const [endDate, setEndDate] = useState(new Date());

    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError
    } = usePageState();

    const handleGenerateReport = async () => {
        startLoading();
        setReportData(null);

        try {
            const start = startDate.toISOString().split('T')[0];
            const end = endDate.toISOString().split('T')[0];
            const data = await getEquityStatement(start, end);
            setReportData(data);
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.detail || err.message || 'Failed to generate report');
        } finally {
            stopLoading();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <PageHeader
                title="بيان حقوق الملكية"
                subtitle="تتبع التغيرات في رأس المال وحقوق الملاك خلال الفترة"
                icon="bi-pie-chart"
            />

            {/* Filter Card */}
            <Card className="mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">من تاريخ</label>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إلى تاريخ</label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-grow px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            {isLoading ? 'جاري التحضير...' : 'عرض التقرير'}
                        </button>
                        {reportData && (
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={handlePrint} title="طباعة">
                                <i className="bi bi-printer"></i>
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
                    {error}
                </div>
            )}

            {isLoading && <PageLoading text="جاري إعداد بيان حقوق الملكية..." />}

            {reportData && !isLoading && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 print-section overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-700 text-center py-6 border-b border-gray-200 dark:border-slate-600">
                        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">بيان حقوق الملكية</h3>
                        <p className="text-gray-500 dark:text-gray-400">للفترة من {reportData.start_date} إلى {reportData.end_date}</p>
                    </div>
                    <div className="p-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-center">
                                <small className="text-gray-500 dark:text-gray-400 block mb-1">رصيد بداية المدة</small>
                                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(reportData.beginning_equity)}</h4>
                            </div>
                            <div className={`p-4 border rounded-lg text-center ${reportData.net_income >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                <small className="text-gray-500 dark:text-gray-400 block mb-1">صافي نتيجة الأعمال</small>
                                <h4 className={`text-xl font-bold ${reportData.net_income >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {formatCurrency(reportData.net_income)}
                                </h4>
                            </div>
                            <div className="p-4 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                                <small className="text-gray-500 dark:text-gray-400 block mb-1">رصيد نهاية المدة</small>
                                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.ending_equity)}</h4>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">البيان</th>
                                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '200px' }}>المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    <tr className="bg-white dark:bg-slate-800">
                                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-hourglass-top text-gray-400"></i>
                                                <strong>رصيد حقوق الملكية (بداية المدة)</strong>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-left font-bold text-gray-800 dark:text-gray-200">{formatCurrency(reportData.beginning_equity)}</td>
                                    </tr>

                                    {/* Additions Section */}
                                    <tr className="border-t-2 border-gray-300 dark:border-slate-600">
                                        <td colSpan="2" className="py-2 px-4 text-green-600 dark:text-green-400 text-sm font-bold uppercase bg-gray-50 dark:bg-slate-700">يضاف:</td>
                                    </tr>
                                    <tr className="bg-white dark:bg-slate-800">
                                        <td className="py-3 px-4 pr-8 text-gray-700 dark:text-gray-300">
                                            مساهمات وإضافات لرأس المال
                                            <small className="block text-gray-400 dark:text-gray-500">أموال تم ضخها من قبل الملاك</small>
                                        </td>
                                        <td className="py-3 px-4 text-left text-green-600 dark:text-green-400">+{formatCurrency(reportData.owner_contributions)}</td>
                                    </tr>
                                    {reportData.net_income >= 0 && (
                                        <tr className="bg-white dark:bg-slate-800">
                                            <td className="py-3 px-4 pr-8 text-gray-700 dark:text-gray-300">
                                                صافي الربح للفترة
                                                <small className="block text-gray-400 dark:text-gray-500">أرباح النشاط المرحلة</small>
                                            </td>
                                            <td className="py-3 px-4 text-left text-green-600 dark:text-green-400">+{formatCurrency(reportData.net_income)}</td>
                                        </tr>
                                    )}

                                    {/* Deductions Section */}
                                    <tr className="border-t-2 border-gray-300 dark:border-slate-600">
                                        <td colSpan="2" className="py-2 px-4 text-red-500 dark:text-red-400 text-sm font-bold uppercase bg-gray-50 dark:bg-slate-700">يخصم:</td>
                                    </tr>
                                    <tr className="bg-white dark:bg-slate-800">
                                        <td className="py-3 px-4 pr-8 text-gray-700 dark:text-gray-300">
                                            المسحوبات الشخصية
                                            <small className="block text-gray-400 dark:text-gray-500">مبالغ تم سحبها من قبل الملاك</small>
                                        </td>
                                        <td className="py-3 px-4 text-left text-red-500 dark:text-red-400">({formatCurrency(reportData.owner_draws)})</td>
                                    </tr>
                                    {reportData.net_income < 0 && (
                                        <tr className="bg-white dark:bg-slate-800">
                                            <td className="py-3 px-4 pr-8 text-gray-700 dark:text-gray-300">
                                                صافي الخسارة للفترة
                                                <small className="block text-gray-400 dark:text-gray-500">خسائر النشاط المرحلة</small>
                                            </td>
                                            <td className="py-3 px-4 text-left text-red-500 dark:text-red-400">({formatCurrency(Math.abs(reportData.net_income))})</td>
                                        </tr>
                                    )}

                                    {/* Footer */}
                                    <tr className="bg-slate-800 dark:bg-slate-900 text-white font-bold text-lg">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-hourglass-bottom"></i>
                                                رصيد حقوق الملكية (نهاية المدة)
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-left">{formatCurrency(reportData.ending_equity)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Note */}
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mt-6 flex items-start gap-3">
                            <i className="bi bi-info-circle-fill text-cyan-600 dark:text-cyan-400 text-xl"></i>
                            <div className="text-cyan-800 dark:text-cyan-300">
                                <strong>توضيح:</strong> يعكس هذا التقرير التغير في ثروة الملاك. الزيادة تعني نمو الاستثمار (من الأرباح أو ضخ أموال)، والنقصان يعني تآكل الاستثمار (من الخسائر أو المسحوبات).
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquityStatement;
