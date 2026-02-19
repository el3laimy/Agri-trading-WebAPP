/**
 * Centralized API Client
 * 
 * This module provides a pre-configured axios instance with:
 * - Base URL configuration
 * - Request interceptors (authentication, loading states)
 * - Response interceptors (error handling)
 * - Common error handling
 */
import axios from 'axios';

// Base API URL - uses Vite's proxy in development
const BASE_URL = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});



// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Track start time for performance monitoring
        config.metadata = { startTime: new Date() };

        // Get token if exists (stored as 'token' by AuthContext)
        const token = localStorage.getItem('token');
        if (token) {
            // Use standard OAuth2 Bearer token format
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime;

        // Log slow requests (e.g., > 800ms)
        if (duration > 800) {
            console.warn(`⚠️ Slow API Call: ${response.config.url} took ${duration}ms`);
        }

        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            const status = error.response.status;
            const requestUrl = error.config?.url || '';

            // Handle authentication errors - but NOT during login attempts
            if (status === 401 && !requestUrl.includes('/auth/login')) {
                // Dispatch custom event for AuthContext to handle
                window.dispatchEvent(new Event('auth:unauthorized'));
            }

            // Handle forbidden errors
            if (status === 403) {
                console.error('Permission denied:', error.response.data?.detail);
            }

            // Handle server errors
            if (status >= 500) {
                console.error('Server error:', error.response.data?.detail || 'An unexpected error occurred');
            }
        } else if (error.request) {
            // Network error
            console.error('Network error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Helper methods for common operations
export const api = {
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),
};

// Export both the instance and the api helper
export default apiClient;
