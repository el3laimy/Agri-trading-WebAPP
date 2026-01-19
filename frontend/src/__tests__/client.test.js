/**
 * Client API Tests
 * 
 * Tests for api/client.js (Interceptors & Error Handling)
 * Target coverage: 100%
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import apiClient, { api } from '../api/client';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// Access the interceptors directly from the imported instance
// Since proper mocking of axios.create return value is tricky with modules,
// we will rely on checking the behavior mostly or simple spy if possible.
// However, getting the references to the interceptor callbacks is the most reliable way 
// to test the logic 'inside' the interceptor without making real requests.

describe('API Client Interceptors', () => {
    // Capturing interceptors
    let requestInterceptor;
    let requestErrorInterceptor;
    let responseInterceptor;
    let responseErrorInterceptor;

    beforeEach(() => {
        vi.clearAllMocks();

        // We assume apiClient is already created when module is imported.
        // We can inspect its interceptors array.
        // Axios interceptors allow internal access via 'handlers' usually, but it's internal API.
        // A better approach for unit testing interceptor LOGIC is to verify the behavior 
        // by mocking the underlying implementation or extraction.

        // Given the code structure, we can iterate over the handlers if accessible, 
        // OR we can make a dummy request and spy on things.

        // Let's try to access handlers directly if possible or simulate.
        // Actually, since we want to cover the LINES inside the interceptor, 
        // we can spy on the interceptor usage? No, that was done at creation time.

        // Alternative: Mock axios.create BEFORE import? 
        // Too late, module already imported.

        // We will simulate the logic by accessing the handlers from the exposed instance.
        // apiClient.interceptors.request.handlers[0] -> { fulfilled, rejected }

        const reqHandlers = apiClient.interceptors.request.handlers;
        if (reqHandlers.length > 0) {
            requestInterceptor = reqHandlers[0].fulfilled;
            requestErrorInterceptor = reqHandlers[0].rejected;
        }

        const resHandlers = apiClient.interceptors.response.handlers;
        if (resHandlers.length > 0) {
            responseInterceptor = resHandlers[0].fulfilled;
            responseErrorInterceptor = resHandlers[0].rejected;
        }

        // Mock window.location
        delete window.location;
        window.location = { href: '' };

        // Mock console.error to keep output clean
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    test('Request Interceptor should add token if exists', () => {
        localStorageMock.getItem.mockReturnValue('test-token');
        const config = { headers: {} };

        const result = requestInterceptor(config);

        expect(result.headers['X-Session-Token']).toBe('test-token');
    });

    test('Request Interceptor should do nothing if no token', () => {
        localStorageMock.getItem.mockReturnValue(null);
        const config = { headers: {} };

        const result = requestInterceptor(config);

        expect(result.headers['X-Session-Token']).toBeUndefined();
    });

    test('Request Error Interceptor should reject', async () => {
        const error = new Error('Req Fail');
        await expect(requestErrorInterceptor(error)).rejects.toThrow('Req Fail');
    });

    test('Response Interceptor should return response', () => {
        const response = { data: 'ok' };
        expect(responseInterceptor(response)).toBe(response);
    });

    test('Response Error Interceptor should handle 401', async () => {
        const error = {
            response: { status: 401 }
        };

        try {
            await responseErrorInterceptor(error);
        } catch (e) {
            // It rejects, but we check side effects
        }

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('session_token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
        expect(window.location.href).toBe('/login');
    });

    test('Response Error Interceptor should handle 403', async () => {
        const error = {
            response: { status: 403, data: { detail: 'Forbidden' } }
        };

        try {
            await responseErrorInterceptor(error);
        } catch (e) { }

        expect(console.error).toHaveBeenCalledWith('Permission denied:', 'Forbidden');
    });

    test('Response Error Interceptor should handle 500', async () => {
        const error = {
            response: { status: 500, data: { detail: 'Server Error' } }
        };

        try {
            await responseErrorInterceptor(error);
        } catch (e) { }

        expect(console.error).toHaveBeenCalledWith('Server error:', 'Server Error');
    });

    test('Response Error Interceptor should handle Network Error', async () => {
        const error = {
            request: {},
            message: 'Net Err'
        };

        try {
            await responseErrorInterceptor(error);
        } catch (e) { }

        expect(console.error).toHaveBeenCalledWith('Network error:', 'Net Err');
    });
});

describe('API Helper Methods', () => {
    test('should expose helper methods', () => {
        expect(api.get).toBeDefined();
        expect(api.post).toBeDefined();
        expect(api.put).toBeDefined();
        expect(api.patch).toBeDefined();
        expect(api.delete).toBeDefined();
    });

    test('helpers should call apiClient methods', async () => {
        // Spy on the instance methods
        vi.spyOn(apiClient, 'get').mockResolvedValue('get-ok');
        vi.spyOn(apiClient, 'post').mockResolvedValue('post-ok');

        await api.get('/test');
        expect(apiClient.get).toHaveBeenCalledWith('/test', undefined);

        await api.post('/test', {});
        expect(apiClient.post).toHaveBeenCalledWith('/test', {}, undefined);
    });
});
