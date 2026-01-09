import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';

const IncomeStatement = () => {
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

            const response = await fetch(`http://localhost:8000/api/v1/reports/income-statement?start_date=${start}&end_date=${end}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate report');
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
            showError(err.message);
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
                title="قائمة الدخل"
                subtitle="تقرير الأرباح والخسائر والنتائج التشغيلية"
                icon="bi-graph-up-arrow"
            />

            {/* Filter Card */}
            <Card className="mb-6">
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
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={handlePrint}>
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

            {isLoading && <PageLoading text="جاري إعداد قائمة الدخل..." />}

            {reportData && !isLoading && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 print-section overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-700 text-center py-6 border-b border-gray-200 dark:border-slate-600">
                        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">قائمة الدخل</h3>
                        <p className="text-gray-500 dark:text-gray-400">للفترة من {reportData.start_date} إلى {reportData.end_date}</p>
                    </div>
                    <div className="p-6">
                        {/* Revenues */}
                        <div className="mb-6">
                            <h5 className="font-bold text-green-600 dark:text-green-400 border-b-2 border-green-200 dark:border-green-800 pb-2 mb-4 flex items-center gap-2">
                                <i className="bi bi-arrow-down-circle"></i>الإيرادات
                            </h5>
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {reportData.revenues.map((item, index) => (
                                        <tr key={`rev-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{item.account_name}</td>
                                            <td className="py-3 text-left font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-green-50 dark:bg-green-900/20 font-bold">
                                        <td className="py-3 px-4 text-green-700 dark:text-green-400">إجمالي الإيرادات</td>
                                        <td className="py-3 px-4 text-left text-green-700 dark:text-green-400">{formatCurrency(reportData.total_revenue)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Expenses */}
                        <div className="mb-6">
                            <h5 className="font-bold text-red-500 dark:text-red-400 border-b-2 border-red-200 dark:border-red-800 pb-2 mb-4 flex items-center gap-2">
                                <i className="bi bi-arrow-up-circle"></i>المصروفات
                            </h5>
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {reportData.expenses.map((item, index) => (
                                        <tr key={`exp-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{item.account_name}</td>
                                            <td className="py-3 text-left font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-red-50 dark:bg-red-900/20 font-bold">
                                        <td className="py-3 px-4 text-red-600 dark:text-red-400">إجمالي المصروفات</td>
                                        <td className="py-3 px-4 text-left text-red-600 dark:text-red-400">{formatCurrency(reportData.total_expense)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Net Income Summary */}
                        <div className={`flex justify-between items-center p-6 rounded-xl mt-6 shadow-sm ${reportData.net_income >= 0 ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
                            <div>
                                <h4 className={`font-bold text-lg ${reportData.net_income >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>صافي الربح / (الخسارة)</h4>
                                <small className="text-gray-500 dark:text-gray-400">الناتج النهائي للعمليات خلال الفترة</small>
                            </div>
                            <h2 className={`font-bold text-3xl ${reportData.net_income >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {formatCurrency(reportData.net_income)}
                            </h2>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatement;
