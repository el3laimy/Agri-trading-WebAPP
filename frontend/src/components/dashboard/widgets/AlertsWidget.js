/**
 * AlertsWidget - Displays smart alerts
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';

const getAlertStyle = (type) => {
    const styles = {
        success: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50',
        danger: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50',
        warning: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
        info: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
    };
    return styles[type] || styles.info;
};

export function AlertsWidget({ alerts }) {
    return (
        <div className="mb-8">
            <div className="lg-card lg-animate-fade">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <i className="bi bi-bell text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                التنبيهات الذكية
                                {alerts.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">
                                        {alerts.length}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">تنبيهات تلقائية للمتابعة</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.length > 0 ? alerts.map((alert, index) => (
                            <div key={index} className={`p-4 rounded-xl border-2 flex items-start gap-3 hover-lift ${getAlertStyle(alert.type)}`}>
                                <div className="w-10 h-10 rounded-lg bg-current bg-opacity-20 flex items-center justify-center flex-shrink-0">
                                    <i className={`bi ${alert.icon} text-xl`} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm mb-1">{alert.title}</p>
                                    <p className="text-sm opacity-80">{alert.message}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <i className="bi bi-check-circle text-4xl text-emerald-500" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد تنبيهات - كل شيء على ما يرام!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlertsWidget;
