import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';

export const expensesKeys = {
    all: ['expenses'],
    lists: () => [...expensesKeys.all, 'list'],
    list: (filters) => [...expensesKeys.all, 'list', filters],
};

export const useExpenses = (options = {}) => {
    return useQuery({
        queryKey: expensesKeys.lists(),
        queryFn: getExpenses,
        ...options,
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ expenseId, data }) => updateExpense(expenseId, data),
        onMutate: async ({ expenseId, data }) => {
            await queryClient.cancelQueries({ queryKey: expensesKeys.lists() });
            const previousExpenses = queryClient.getQueryData(expensesKeys.lists());

            queryClient.setQueryData(expensesKeys.lists(), (old) => {
                return old?.map((expense) =>
                    expense.expense_id === expenseId ? { ...expense, ...data } : expense
                );
            });

            return { previousExpenses };
        },
        onError: (err, newExpense, context) => {
            queryClient.setQueryData(expensesKeys.lists(), context.previousExpenses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteExpense,
        onMutate: async (expenseId) => {
            await queryClient.cancelQueries({ queryKey: expensesKeys.lists() });
            const previousExpenses = queryClient.getQueryData(expensesKeys.lists());

            queryClient.setQueryData(expensesKeys.lists(), (old) => {
                return old?.filter((expense) => expense.expense_id !== expenseId);
            });

            return { previousExpenses };
        },
        onError: (err, expenseId, context) => {
            queryClient.setQueryData(expensesKeys.lists(), context.previousExpenses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export default useExpenses;
