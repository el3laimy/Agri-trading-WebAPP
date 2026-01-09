import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient مركزي لإدارة جميع طلبات البيانات في التطبيق
 * 
 * الإعدادات الافتراضية:
 * - staleTime: 5 دقائق - البيانات تبقى "طازجة" لمدة 5 دقائق
 * - retry: 1 - إعادة المحاولة مرة واحدة فقط عند الفشل
 * - refetchOnWindowFocus: false - عدم إعادة الجلب عند التركيز على النافذة
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 0,
        },
    },
});

export default queryClient;
