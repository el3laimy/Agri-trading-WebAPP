/**
 * RecentActivityWidget - Displays recent activity timeline and season progress
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityItem, SeasonProgressCard, EmptyState } from '../DashboardWidgets';

export function RecentActivityWidget({
    recentActivities,
    seasonSummary,
    formatCurrency,
    formatRelativeTime,
    formatDate
}) {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Activity Timeline */}
            <div className="lg:col-span-2 lg-card overflow-hidden lg-animate-fade">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                            <i className="bi bi-activity text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                النشاط الأخير
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">آخر العمليات المسجلة</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/sales')}
                        className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
                    >
                        عرض الكل
                    </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((activity) => (
                            <ActivityItem
                                key={activity.id}
                                activity={activity}
                                formatCurrency={(v) => formatCurrency(v, true)}
                                formatRelativeTime={formatRelativeTime}
                            />
                        ))
                    ) : (
                        <EmptyState icon="bi-clock-history" title="لا توجد عمليات حديثة" />
                    )}
                </div>
            </div>

            {/* Season Progress */}
            <div className="animate-fade-in">
                <SeasonProgressCard
                    season={seasonSummary}
                    formatDate={formatDate}
                />
            </div>
        </div>
    );
}

export default RecentActivityWidget;
