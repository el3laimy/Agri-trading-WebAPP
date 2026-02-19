/**
 * Auth API Tests
 * 
 * Tests for auth.js - Authentication & User Management
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions from auth.js
import {
    login,
    logout,
    getCurrentUser,
    changePassword,
    getUsers,
    createUser,
    updateUser,
    getRoles,
    updateDashboardConfig
} from '../api/auth';

// Mock axios
// Mock apiClient
vi.mock('../api/client', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            patch: vi.fn(),
            defaults: { headers: { common: {} } },
            interceptors: actual.default.interceptors
        }
    };
});
import apiClient from '../api/client';

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// Authentication Tests (Login/Logout/Me)
// =============================================================================

describe('Authentication Operations', () => {

    test('login should send form data and return token', async () => {
        const mockResponse = { access_token: 'valid-token', token_type: 'bearer' };
        apiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await login('admin', 'password123');

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/auth/login',
            expect.any(URLSearchParams),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Verify URLSearchParams content
        const formData = apiClient.post.mock.calls[0][1];
        expect(formData.get('username')).toBe('admin');
        expect(formData.get('password')).toBe('password123');
    });

    test('logout should send correct headers', async () => {
        const mockResponse = { message: 'Logged out' };
        apiClient.post.mockResolvedValue({ data: mockResponse });

        const token = 'test-token';
        const result = await logout(token);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/auth/logout',
            {}
        );
    });

    test('getCurrentUser should fetch user data', async () => {
        const mockResponse = { id: 1, username: 'admin' };
        apiClient.get.mockResolvedValue({ data: mockResponse });

        const result = await getCurrentUser('token');

        expect(result).toEqual(mockResponse);
        expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    });

    test('changePassword should send correct payload', async () => {
        const mockResponse = { message: 'Password updated' };
        apiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await changePassword('old', 'new');

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/auth/change-password',
            { current_password: 'old', new_password: 'new' }
        );
    });
});

// =============================================================================
// User Management Tests
// =============================================================================

describe('User Management', () => {

    test('getUsers should fetch list of users', async () => {
        const mockData = [{ id: 1, username: 'user1' }];
        apiClient.get.mockResolvedValue({ data: mockData });

        const result = await getUsers();

        expect(result).toEqual(mockData);
        expect(apiClient.get).toHaveBeenCalledWith('/auth/users');
    });

    test('createUser should post user data', async () => {
        const userData = { username: 'newuser', password: 'pw' };
        const mockResponse = { id: 2, ...userData };
        apiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await createUser(userData);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/auth/users',
            userData
        );
    });

    test('updateUser should put user data', async () => {
        const userData = { email: 'new@email.com' };
        const mockResponse = { id: 1, ...userData };
        apiClient.put.mockResolvedValue({ data: mockResponse });

        const result = await updateUser(1, userData);

        expect(result).toEqual(mockResponse);
        expect(apiClient.put).toHaveBeenCalledWith(
            '/auth/users/1',
            userData
        );
    });

    test('getRoles should fetch roles', async () => {
        const mockData = ['admin', 'user'];
        apiClient.get.mockResolvedValue({ data: mockData });

        const result = await getRoles();

        expect(result).toEqual(mockData);
        expect(apiClient.get).toHaveBeenCalledWith('/auth/roles');
    });

    test('updateDashboardConfig should handle string and object config', async () => {
        apiClient.put.mockResolvedValue({ data: { success: true } });

        // Test object config (should be stringified)
        await updateDashboardConfig({ theme: 'dark' });
        expect(apiClient.put).toHaveBeenCalledWith(
            '/auth/me/config',
            { dashboard_config: '{"theme":"dark"}' }
        );

        // Test string config (should be passed as is)
        await updateDashboardConfig('{"theme":"light"}');
        expect(apiClient.put).toHaveBeenCalledWith(
            '/auth/me/config',
            { dashboard_config: '{"theme":"light"}' }
        );
    });
});

// =============================================================================
// Error Handling
// =============================================================================

describe('Auth Error Handling', () => {
    test('should propagate network errors', async () => {
        apiClient.post.mockRejectedValue(new Error('Network Error'));
        await expect(login('u', 'p')).rejects.toThrow('Network Error');
    });

    test('should propagate 401 Unauthorized', async () => {
        apiClient.get.mockRejectedValue({ response: { status: 401 } });
        await expect(getCurrentUser('bad-token')).rejects.toBeDefined();
    });
});
