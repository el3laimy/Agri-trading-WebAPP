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
vi.mock('axios');

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
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await login('admin', 'password123');

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/auth/login',
            expect.any(URLSearchParams),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Verify URLSearchParams content
        const formData = axios.post.mock.calls[0][1];
        expect(formData.get('username')).toBe('admin');
        expect(formData.get('password')).toBe('password123');
    });

    test('logout should send correct headers', async () => {
        const mockResponse = { message: 'Logged out' };
        axios.post.mockResolvedValue({ data: mockResponse });

        const token = 'test-token';
        const result = await logout(token);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/auth/logout',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-Token': token
                }
            }
        );
    });

    test('getCurrentUser should fetch user data', async () => {
        const mockResponse = { id: 1, username: 'admin' };
        axios.get.mockResolvedValue({ data: mockResponse });

        const result = await getCurrentUser('token');

        expect(result).toEqual(mockResponse);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/me', {
            headers: { 'Authorization': 'Bearer token' }
        });
    });

    test('changePassword should send correct payload', async () => {
        const mockResponse = { message: 'Password updated' };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await changePassword('token', 'old', 'new');

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/auth/change-password',
            { current_password: 'old', new_password: 'new' },
            { headers: { 'Authorization': 'Bearer token' } }
        );
    });
});

// =============================================================================
// User Management Tests
// =============================================================================

describe('User Management', () => {

    test('getUsers should fetch list of users', async () => {
        const mockData = [{ id: 1, username: 'user1' }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getUsers('token');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/users', {
            headers: { 'Authorization': 'Bearer token' }
        });
    });

    test('createUser should post user data', async () => {
        const userData = { username: 'newuser', password: 'pw' };
        const mockResponse = { id: 2, ...userData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await createUser('token', userData);

        expect(result).toEqual(mockResponse);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/auth/users',
            userData,
            { headers: { 'Authorization': 'Bearer token' } }
        );
    });

    test('updateUser should put user data', async () => {
        const userData = { email: 'new@email.com' };
        const mockResponse = { id: 1, ...userData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await updateUser('token', 1, userData);

        expect(result).toEqual(mockResponse);
        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/auth/users/1',
            userData,
            { headers: { 'Authorization': 'Bearer token' } }
        );
    });

    test('getRoles should fetch roles', async () => {
        const mockData = ['admin', 'user'];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getRoles('token');

        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/roles', {
            headers: { 'Authorization': 'Bearer token' }
        });
    });

    test('updateDashboardConfig should handle string and object config', async () => {
        axios.put.mockResolvedValue({ data: { success: true } });

        // Test object config (should be stringified)
        await updateDashboardConfig('token', { theme: 'dark' });
        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/auth/me/config',
            { dashboard_config: '{"theme":"dark"}' },
            { headers: { 'Authorization': 'Bearer token' } }
        );

        // Test string config (should be passed as is)
        await updateDashboardConfig('token', '{"theme":"light"}');
        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/auth/me/config',
            { dashboard_config: '{"theme":"light"}' },
            { headers: { 'Authorization': 'Bearer token' } }
        );
    });
});

// =============================================================================
// Error Handling
// =============================================================================

describe('Auth Error Handling', () => {
    test('should propagate network errors', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));
        await expect(login('u', 'p')).rejects.toThrow('Network Error');
    });

    test('should propagate 401 Unauthorized', async () => {
        axios.get.mockRejectedValue({ response: { status: 401 } });
        await expect(getCurrentUser('bad-token')).rejects.toBeDefined();
    });
});
