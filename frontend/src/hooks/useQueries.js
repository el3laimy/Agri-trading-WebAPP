/**
 * Custom React Query hooks for data fetching
 * Replaces DataContext with efficient cached queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCrops } from '../api/crops';
import { getContacts } from '../api/contacts';
import { getSeasons } from '../api/seasons';
import { getInventory } from '../api/inventory';
import { getDebtAnalysis } from '../api/reports';

// Query Keys - centralized for consistency
export const queryKeys = {
    crops: ['crops'],
    contacts: ['contacts'],
    seasons: ['seasons'],
    inventory: ['inventory'],
    suppliers: ['contacts', 'suppliers'],
    customers: ['contacts', 'customers'],
    debtAnalysis: ['debtAnalysis'],
};

/**
 * Hook to fetch crops data
 */
export const useCrops = () => {
    return useQuery({
        queryKey: queryKeys.crops,
        queryFn: getCrops,
    });
};

/**
 * Hook to fetch all contacts
 */
export const useContacts = () => {
    return useQuery({
        queryKey: queryKeys.contacts,
        queryFn: getContacts,
    });
};

/**
 * Hook to fetch suppliers only
 */
export const useSuppliers = () => {
    return useQuery({
        queryKey: queryKeys.suppliers,
        queryFn: async () => {
            const contacts = await getContacts();
            return contacts.filter(c => c.is_supplier);
        },
    });
};

/**
 * Hook to fetch customers only
 */
export const useCustomers = () => {
    return useQuery({
        queryKey: queryKeys.customers,
        queryFn: async () => {
            const contacts = await getContacts();
            return contacts.filter(c => c.is_customer);
        },
    });
};

/**
 * Hook to fetch seasons data
 */
export const useSeasons = () => {
    return useQuery({
        queryKey: queryKeys.seasons,
        queryFn: getSeasons,
    });
};

/**
 * Hook to fetch inventory data
 */
export const useInventory = () => {
    return useQuery({
        queryKey: queryKeys.inventory,
        queryFn: () => getInventory().catch(() => []),
    });
};

/**
 * Hook to fetch debt analysis data (receivables & payables)
 */
export const useDebtAnalysis = () => {
    return useQuery({
        queryKey: queryKeys.debtAnalysis,
        queryFn: getDebtAnalysis,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to invalidate and refetch specific data
 */
export const useRefreshData = () => {
    const queryClient = useQueryClient();

    return {
        refreshCrops: () => queryClient.invalidateQueries({ queryKey: queryKeys.crops }),
        refreshContacts: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts }),
        refreshSeasons: () => queryClient.invalidateQueries({ queryKey: queryKeys.seasons }),
        refreshInventory: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        refreshDebtAnalysis: () => queryClient.invalidateQueries({ queryKey: queryKeys.debtAnalysis }),
        refreshAll: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.crops });
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
        },
    };
};
