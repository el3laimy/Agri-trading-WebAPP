import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
    getDashboardKpis,
    getDashboardAlerts,
    getSalesByCrop,
    getTopCustomers,
    getRecentActivities,
    getSeasonSummary
} from '../api/reports';

/**
 * Query Keys للـ Dashboard
 */
export const dashboardKeys = {
    all: ['dashboard'],
    kpis: () => [...dashboardKeys.all, 'kpis'],
    alerts: () => [...dashboardKeys.all, 'alerts'],
    salesByCrop: () => [...dashboardKeys.all, 'salesByCrop'],
    topCustomers: (limit) => [...dashboardKeys.all, 'topCustomers', limit],

    recentActivities: (limit) => [...dashboardKeys.all, 'activities', limit],
    seasonSummary: () => [...dashboardKeys.all, 'season'],
};

/**
 * Hook لجلب جميع بيانات لوحة التحكم
 * يستخدم useQueries لجلب البيانات بشكل متوازي
 */
export const useDashboard = (topCustomersLimit = 5, activitiesLimit = 10) => {
    const results = useQueries({
        queries: [
            {
                queryKey: dashboardKeys.kpis(),
                queryFn: getDashboardKpis,
                staleTime: 2 * 60 * 1000, // 2 minutes for KPIs
            },
            {
                queryKey: dashboardKeys.alerts(),
                queryFn: () => getDashboardAlerts().catch(() => []),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: dashboardKeys.salesByCrop(),
                queryFn: () => getSalesByCrop().catch(() => []),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: dashboardKeys.topCustomers(topCustomersLimit),
                queryFn: () => getTopCustomers(topCustomersLimit).catch(() => []),
                staleTime: 5 * 60 * 1000,
            },
            // New Queries for Enhanced Dashboard
            {
                queryKey: dashboardKeys.recentActivities(activitiesLimit),
                queryFn: () => getRecentActivities(activitiesLimit).catch(() => []),
                staleTime: 2 * 60 * 1000, // 2 minutes for activities
            },
            {
                queryKey: dashboardKeys.seasonSummary(),
                queryFn: () => getSeasonSummary().catch(() => null),
                staleTime: 10 * 60 * 1000, // 10 minutes for season
            },
        ],
    });

    const [
        kpisQuery,
        alertsQuery,
        salesByCropQuery,
        topCustomersQuery,
        activitiesQuery,
        seasonQuery
    ] = results;

    return {
        // Data
        kpis: kpisQuery.data,
        alerts: alertsQuery.data || [],
        salesByCrop: salesByCropQuery.data || [],
        topCustomers: topCustomersQuery.data || [],
        recentActivities: activitiesQuery.data || [],
        seasonSummary: seasonQuery.data,

        // Loading states
        isLoading: results.some(r => r.isLoading),
        isKpisLoading: kpisQuery.isLoading,

        // Error states
        isError: results.some(r => r.isError),
        error: results.find(r => r.error)?.error,

        // Refetch functions
        refetchAll: () => Promise.all(results.map(r => r.refetch())),
        refetchKpis: kpisQuery.refetch,
    };
};

/**
 * Hook لإعادة تحديث بيانات الـ Dashboard
 */
export const useRefreshDashboard = () => {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        invalidateKpis: () => queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() }),
    };
};

export default useDashboard;
