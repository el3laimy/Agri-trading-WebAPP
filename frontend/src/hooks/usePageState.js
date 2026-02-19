import { useState, useCallback } from 'react';

/**
 * Custom hook for unified error handling across the application
 * @returns {Object} Error state and handlers
 */
export function useErrorHandler() {
    const [error, setError] = useState(null);

    const handleError = useCallback((err, customMessage = null) => {
        console.error('Error caught:', err);

        // Extract error message from different error formats
        let message = customMessage;

        if (!message) {
            if (err?.response?.data?.detail) {
                // FastAPI error format
                message = err.response.data.detail;
            } else if (err?.message) {
                message = err.message;
            } else if (typeof err === 'string') {
                message = err;
            } else {
                message = 'حدث خطأ غير متوقع';
            }
        }

        setError(message);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const showError = useCallback((message) => {
        setError(message);
    }, []);

    return {
        error,
        handleError,
        clearError,
        showError
    };
}

/**
 * Custom hook for loading state management
 * @param {boolean} initialState - Initial loading state
 * @returns {Object} Loading state and handlers
 */
export function useLoading(initialState = false) {
    const [isLoading, setIsLoading] = useState(initialState);

    const startLoading = useCallback(() => setIsLoading(true), []);
    const stopLoading = useCallback(() => setIsLoading(false), []);

    const withLoading = useCallback(async (asyncFn) => {
        setIsLoading(true);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        startLoading,
        stopLoading,
        withLoading
    };
}

/**
 * Custom hook for success messages
 * @param {number} timeout - Auto-clear timeout in ms
 * @returns {Object} Success state and handlers
 */
export function useSuccessMessage(timeout = 3000) {
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), timeout);
    }, [timeout]);

    const clearSuccess = useCallback(() => {
        setSuccessMessage('');
    }, []);

    return {
        successMessage,
        showSuccess,
        clearSuccess
    };
}

/**
 * Combined hook for common page state management
 * @returns {Object} Combined error, loading, and success handlers
 */
export function usePageState() {
    const { error, handleError, clearError, showError } = useErrorHandler();
    const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
    const { successMessage, showSuccess, clearSuccess } = useSuccessMessage();

    return {
        // Error
        error,
        handleError,
        clearError,
        showError,
        // Loading
        isLoading,
        startLoading,
        stopLoading,
        withLoading,
        // Success
        successMessage,
        showSuccess,
        clearSuccess
    };
}
