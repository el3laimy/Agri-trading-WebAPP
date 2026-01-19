/**
 * usePageState Hook Tests
 * 
 * Tests for usePageState.js - Global UI State Management
 * Target coverage: 100%
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageState, useErrorHandler, useLoading, useSuccessMessage } from '../hooks/usePageState';

describe('useErrorHandler', () => {
    test('should handle string error', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError('Simple Error');
        });

        expect(result.current.error).toBe('Simple Error');
    });

    test('should handle Error object', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError(new Error('Object Error'));
        });

        expect(result.current.error).toBe('Object Error');
    });

    test('should handle FastAPI error format', () => {
        const { result } = renderHook(() => useErrorHandler());
        const apiError = {
            response: {
                data: { detail: 'API Error' }
            }
        };

        act(() => {
            result.current.handleError(apiError);
        });

        expect(result.current.error).toBe('API Error');
    });

    test('should handle unknown error type', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError({});
        });

        expect(result.current.error).toBe('حدث خطأ غير متوقع');
    });

    test('should allow custom message override', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError(new Error('Orig'), 'Custom Msg');
        });

        expect(result.current.error).toBe('Custom Msg');
    });

    test('should clear error', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError('Error');
        });
        expect(result.current.error).toBe('Error');

        act(() => {
            result.current.clearError();
        });
        expect(result.current.error).toBeNull();
    });
});

describe('useLoading', () => {
    test('should toggle loading state', () => {
        const { result } = renderHook(() => useLoading());

        expect(result.current.isLoading).toBe(false);

        act(() => {
            result.current.startLoading();
        });
        expect(result.current.isLoading).toBe(true);

        act(() => {
            result.current.stopLoading();
        });
        expect(result.current.isLoading).toBe(false);
    });

    test('withLoading should wrap async function', async () => {
        const { result } = renderHook(() => useLoading());
        const mockFn = vi.fn().mockResolvedValue('Success');

        let promise;
        act(() => {
            promise = result.current.withLoading(mockFn);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await promise;
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockFn).toHaveBeenCalled();
    });

    test('withLoading should handle errors and stop loading', async () => {
        const { result } = renderHook(() => useLoading());
        const mockFn = vi.fn().mockRejectedValue(new Error('Fail'));

        let promise;
        act(() => {
            promise = result.current.withLoading(mockFn);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            try {
                await promise;
            } catch (e) {
                // Expected
            }
        });

        expect(result.current.isLoading).toBe(false);
    });
});

describe('useSuccessMessage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('should show and auto-clear message', () => {
        const { result } = renderHook(() => useSuccessMessage(1000));

        act(() => {
            result.current.showSuccess('Done');
        });

        expect(result.current.successMessage).toBe('Done');

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.successMessage).toBe('');
    });
});

describe('usePageState', () => {
    test('should combine all hooks', () => {
        const { result } = renderHook(() => usePageState());

        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBeDefined();
        expect(result.current.successMessage).toBeDefined();
    });
});
