import React, { useState, useEffect } from 'react';
import { getCashFlowReport, getCashFlowDetails } from '../api/reports';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function CashFlowReport() {
    const [report, setReport] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const start = startDate.toISOString().slice(0, 10);
            const end = endDate.toISOString().slice(0, 10);

            const [reportData, detailsData] = await Promise.all([
                getCashFlowReport(start, end),
                getCashFlowDetails(start, end)
            ]);

            setReport(reportData);
            setDetails(detailsData);
        } catch (error) {
            console.error("Failed to fetch cash flow:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="bi bi-arrow-left-right text-emerald-600"></i>
                        تقرير التدفقات النقدية
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">مصادر واستخدامات النقدية</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">من:</span>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 w-28"
                            dateFormat="yyyy-MM-dd"
                        />
                        <span className="text-gray-500 dark:text-gray-400 text-sm">إلى:</span>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 w-28"
                            dateFormat="yyyy-MM-dd"
                        />
                        <button className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors" onClick={fetchReport}>
                            <i className="bi bi-search"></i>
                        </button>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1" onClick={handlePrint}>
                        <i className="bi bi-printer"></i>
                        طباعة
                    </button>
                </div>
            </div>

            {report && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center">
                            <small className="text-gray-500 dark:text-gray-400">رصيد البداية</small>
                            <h4 className="text-xl font-bold text-gray-600 dark:text-gray-300">{formatCurrency(report.opening_balance)}</h4>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center border-t-4 border-green-500">
                            <small className="text-gray-500 dark:text-gray-400">صافي التدفق التشغيلي</small>
                            <h4 className={`text-xl font-bold ${report.operating_activities.net_operating_cash_flow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {formatCurrency(report.operating_activities.net_operating_cash_flow)}
                            </h4>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center border-t-4 border-cyan-500">
                            <small className="text-gray-500 dark:text-gray-400">صافي التغير</small>
                            <h4 className={`text-xl font-bold ${report.net_cash_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {formatCurrency(report.net_cash_change)}
                            </h4>
                        </div>
                        <div className="rounded-xl shadow-sm p-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)' }}>
                            <small className="text-white/60">رصيد الإغلاق</small>
                            <h4 className="text-xl font-bold">{formatCurrency(report.closing_balance)}</h4>
                        </div>
                    </div>

                    {/* Cash Flow Statement */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                                    <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <i className="bi bi-file-text text-emerald-600"></i>
                                        قائمة التدفقات النقدية
                                    </h5>
                                </div>
                                <div className="p-5">
                                    {/* Operating Activities */}
                                    <div className="mb-6">
                                        <h6 className="font-bold text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-200 dark:border-emerald-800 pb-2 mb-4 flex items-center gap-2">
                                            <i className="bi bi-gear"></i>
                                            التدفقات من الأنشطة التشغيلية
                                        </h6>
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">تحصيلات من العملاء</td><td className="py-2 text-left text-green-600 dark:text-green-400">+{formatCurrency(report.operating_activities.customer_collections)}</td></tr>
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">مدفوعات للموردين</td><td className="py-2 text-left text-red-500 dark:text-red-400">-{formatCurrency(report.operating_activities.supplier_payments)}</td></tr>
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">مصروفات تشغيلية</td><td className="py-2 text-left text-red-500 dark:text-red-400">-{formatCurrency(report.operating_activities.operating_expenses)}</td></tr>
                                                <tr className="font-bold bg-gray-50 dark:bg-slate-700"><td className="py-3 px-2 text-gray-800 dark:text-gray-200">صافي التدفقات التشغيلية</td><td className={`py-3 text-left ${report.operating_activities.net_operating_cash_flow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{formatCurrency(report.operating_activities.net_operating_cash_flow)}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Investing Activities */}
                                    <div className="mb-6">
                                        <h6 className="font-bold text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-200 dark:border-cyan-800 pb-2 mb-4 flex items-center gap-2">
                                            <i className="bi bi-building"></i>
                                            التدفقات من الأنشطة الاستثمارية
                                        </h6>
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">إيرادات استثمارية</td><td className="py-2 text-left text-green-600 dark:text-green-400">+{formatCurrency(report.investing_activities.inflows)}</td></tr>
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">مصروفات رأسمالية</td><td className="py-2 text-left text-red-500 dark:text-red-400">-{formatCurrency(report.investing_activities.outflows)}</td></tr>
                                                <tr className="font-bold bg-gray-50 dark:bg-slate-700"><td className="py-3 px-2 text-gray-800 dark:text-gray-200">صافي التدفقات الاستثمارية</td><td className={`py-3 text-left ${report.investing_activities.net_investing_cash_flow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{formatCurrency(report.investing_activities.net_investing_cash_flow)}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Financing Activities */}
                                    <div className="mb-6">
                                        <h6 className="font-bold text-amber-600 dark:text-amber-400 border-b-2 border-amber-200 dark:border-amber-800 pb-2 mb-4 flex items-center gap-2">
                                            <i className="bi bi-bank"></i>
                                            التدفقات من الأنشطة التمويلية
                                        </h6>
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">مساهمات رأس المال</td><td className="py-2 text-left text-green-600 dark:text-green-400">+{formatCurrency(report.financing_activities.capital_contributions)}</td></tr>
                                                <tr><td className="py-2 pr-6 text-gray-700 dark:text-gray-300">سحوبات رأس المال</td><td className="py-2 text-left text-red-500 dark:text-red-400">-{formatCurrency(report.financing_activities.capital_withdrawals)}</td></tr>
                                                <tr className="font-bold bg-gray-50 dark:bg-slate-700"><td className="py-3 px-2 text-gray-800 dark:text-gray-200">صافي التدفقات التمويلية</td><td className={`py-3 text-left ${report.financing_activities.net_financing_cash_flow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{formatCurrency(report.financing_activities.net_financing_cash_flow)}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary */}
                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                <tr className="font-bold text-base"><td className="py-3 text-gray-800 dark:text-gray-200">صافي التغير في النقدية</td><td className={`py-3 text-left ${report.net_cash_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{formatCurrency(report.net_cash_change)}</td></tr>
                                                <tr><td className="py-2 text-gray-700 dark:text-gray-300">رصيد البداية</td><td className="py-2 text-left text-gray-800 dark:text-gray-200">{formatCurrency(report.opening_balance)}</td></tr>
                                                <tr className="font-bold text-lg bg-green-50 dark:bg-green-900/20"><td className="py-4 px-2 text-green-700 dark:text-green-400">رصيد الإغلاق</td><td className="py-4 text-left text-green-700 dark:text-green-400">{formatCurrency(report.closing_balance)}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                                    <h6 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <i className="bi bi-list-ul"></i>
                                        آخر الحركات
                                    </h6>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {details.length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {details.slice(0, 20).map((item, index) => (
                                                <div key={index} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <div>
                                                        <small className="text-gray-400 dark:text-gray-500 block text-xs">
                                                            {new Date(item.date).toLocaleDateString('en-US')}
                                                        </small>
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.description}</span>
                                                    </div>
                                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${item.flow_type === 'IN' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                        {item.flow_type === 'IN' ? '+' : '-'}{formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                                            <i className="bi bi-inbox text-4xl block mb-2"></i>
                                            لا توجد حركات
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CashFlowReport;
