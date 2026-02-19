import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getLastPurchasePrice } from '../api/purchases';

/**
 * Query Keys للمشتريات
 */
export const purchasesKeys = {
    all: ['purchases'],
    lists: () => [...purchasesKeys.all, 'list'],
    list: (filters) => [...purchasesKeys.all, 'list', filters],
    details: () => [...purchasesKeys.all, 'detail'],
    detail: (id) => [...purchasesKeys.all, 'detail', id],
    lastPrice: (cropId, supplierId) => [...purchasesKeys.all, 'lastPrice', cropId, supplierId],
};

/**
 * Hook لجلب قائمة المشتريات
 */
export const usePurchases = (options = {}) => {
    return useQuery({
        queryKey: purchasesKeys.lists(),
        queryFn: getPurchases,
        ...options,
    });
};

/**
 * Hook لجلب آخر سعر شراء لمحصول من مورد معين
 */
export const useLastPurchasePrice = (cropId, supplierId, options = {}) => {
    return useQuery({
        queryKey: purchasesKeys.lastPrice(cropId, supplierId),
        queryFn: () => getLastPurchasePrice(cropId, supplierId),
        enabled: !!cropId && !!supplierId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook لإنشاء عملية شراء جديدة
 */
export const useCreatePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPurchase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchasesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

/**
 * Hook لتحديث عملية شراء
 */
export const useUpdatePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ purchaseId, data }) => updatePurchase(purchaseId, data),
        onMutate: async ({ purchaseId, data }) => {
            await queryClient.cancelQueries({ queryKey: purchasesKeys.lists() });
            const previousPurchases = queryClient.getQueryData(purchasesKeys.lists());

            queryClient.setQueryData(purchasesKeys.lists(), (old) => {
                return old?.map((purchase) =>
                    purchase.purchase_id === purchaseId ? { ...purchase, ...data } : purchase
                );
            });

            return { previousPurchases };
        },
        onError: (err, newPurchase, context) => {
            queryClient.setQueryData(purchasesKeys.lists(), context.previousPurchases);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: purchasesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

/**
 * Hook لحذف عملية شراء
 */
export const useDeletePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePurchase,
        onMutate: async (purchaseId) => {
            await queryClient.cancelQueries({ queryKey: purchasesKeys.lists() });
            const previousPurchases = queryClient.getQueryData(purchasesKeys.lists());

            queryClient.setQueryData(purchasesKeys.lists(), (old) => {
                return old?.filter((purchase) => purchase.purchase_id !== purchaseId);
            });

            return { previousPurchases };
        },
        onError: (err, purchaseId, context) => {
            queryClient.setQueryData(purchasesKeys.lists(), context.previousPurchases);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: purchasesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

export default usePurchases;
