import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSales, createSale, updateSale, deleteSale, getLastSalePrice } from '../api/sales';

/**
 * Query Keys للمبيعات
 */
export const salesKeys = {
    all: ['sales'],
    lists: () => [...salesKeys.all, 'list'],
    list: (filters) => [...salesKeys.all, 'list', filters],
    details: () => [...salesKeys.all, 'detail'],
    detail: (id) => [...salesKeys.all, 'detail', id],
    lastPrice: (cropId, customerId) => [...salesKeys.all, 'lastPrice', cropId, customerId],
};

/**
 * Hook لجلب قائمة المبيعات
 */
export const useSales = (options = {}) => {
    return useQuery({
        queryKey: salesKeys.lists(),
        queryFn: getSales,
        ...options,
    });
};

/**
 * Hook لجلب آخر سعر بيع لمحصول لعميل معين
 */
export const useLastSalePrice = (cropId, customerId, options = {}) => {
    return useQuery({
        queryKey: salesKeys.lastPrice(cropId, customerId),
        queryFn: () => getLastSalePrice(cropId, customerId),
        enabled: !!cropId && !!customerId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook لإنشاء عملية بيع جديدة
 */
export const useCreateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSale,
        onSuccess: () => {
            // Invalidate sales list to refetch
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            // Invalidate dashboard data as well
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

/**
 * Hook لتحديث عملية بيع
 */
export const useUpdateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ saleId, data }) => updateSale(saleId, data),
        onMutate: async ({ saleId, data }) => {
            await queryClient.cancelQueries({ queryKey: salesKeys.lists() });
            const previousSales = queryClient.getQueryData(salesKeys.lists());

            queryClient.setQueryData(salesKeys.lists(), (old) => {
                return old?.map((sale) =>
                    sale.sale_id === saleId ? { ...sale, ...data } : sale
                );
            });

            return { previousSales };
        },
        onError: (err, newSale, context) => {
            queryClient.setQueryData(salesKeys.lists(), context.previousSales);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

/**
 * Hook لحذف عملية بيع
 */
export const useDeleteSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSale,
        onMutate: async (saleId) => {
            await queryClient.cancelQueries({ queryKey: salesKeys.lists() });
            const previousSales = queryClient.getQueryData(salesKeys.lists());

            queryClient.setQueryData(salesKeys.lists(), (old) => {
                return old?.filter((sale) => sale.sale_id !== saleId);
            });

            return { previousSales };
        },
        onError: (err, saleId, context) => {
            queryClient.setQueryData(salesKeys.lists(), context.previousSales);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export default useSales;
