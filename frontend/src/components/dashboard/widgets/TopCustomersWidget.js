/**
 * TopCustomersWidget - Displays top customers table
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { EmptyState } from '../DashboardWidgets';

export function TopCustomersWidget({ topCustomers, formatCurrency }) {
    const navigate = useNavigate();
    const { theme } = useTheme();

    return (
        <div className="mb-8">
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
                            <i className="bi bi-trophy text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                أفضل العملاء
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">حسب حجم المشتريات</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/contacts')}
                        className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors"
                    >
                        عرض الكل
                    </button>
                </div>
                {topCustomers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm font-semibold">
                                <tr>
                                    <th className="px-6 py-4 w-16">#</th>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4 text-left">إجمالي المشتريات</th>
                                    <th className="px-6 py-4 text-left">عدد العمليات</th>
                                    <th className="px-6 py-4 text-center">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {topCustomers.map((customer, index) => (
                                    <tr
                                        key={customer.contact_id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/contacts/${customer.contact_id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            {index === 0 && <span className="text-2xl">🥇</span>}
                                            {index === 1 && <span className="text-2xl">🥈</span>}
                                            {index === 2 && <span className="text-2xl">🥉</span>}
                                            {index > 2 && <span className="text-gray-400 font-medium">{index + 1}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        backgroundColor: theme === 'dark' ? `hsl(${customer.contact_id * 40}, 50%, 25%)` : `hsl(${customer.contact_id * 40}, 70%, 90%)`,
                                                        color: theme === 'dark' ? `hsl(${customer.contact_id * 40}, 70%, 75%)` : `hsl(${customer.contact_id * 40}, 70%, 35%)`
                                                    }}
                                                >
                                                    {customer.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(customer.total_purchases)}
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                                {customer.transaction_count || '-'} عملية
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {customer.outstanding > 0 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                    مدين: {formatCurrency(customer.outstanding, true)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    مسدد
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8">
                        <EmptyState icon="bi-people" title="لا توجد بيانات عملاء" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default TopCustomersWidget;
