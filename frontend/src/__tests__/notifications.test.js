/**
 * Notifications API Tests
 * 
 * Tests for notifications.js
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Import actual functions
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    checkAlerts
} from '../api/notifications';

// Mock axios
vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Notifications Operations', () => {

    test('getNotifications should fetch notifications with unread param', async () => {
        const mockData = [{ id: 1, text: 'Alert' }];
        axios.get.mockResolvedValue({ data: mockData });

        // Test with default param (unreadOnly = false)
        await getNotifications('token');
        expect(axios.get).toHaveBeenCalledWith('/api/v1/notifications/', {
            params: { unread_only: false },
            headers: { Authorization: 'Bearer token' }
        });

        // Test with unreadOnly = true
        await getNotifications('token', true);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/notifications/', {
            params: { unread_only: true },
            headers: { Authorization: 'Bearer token' }
        });
    });

    test('getUnreadCount should fetch count', async () => {
        const mockData = { count: 5 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getUnreadCount('token');
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/api/v1/notifications/count', {
            headers: { Authorization: 'Bearer token' }
        });
    });

    test('markAsRead should put update', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValue({ data: mockData });

        const result = await markAsRead('token', 123);
        expect(result).toEqual(mockData);
        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/notifications/123/read',
            {},
            { headers: { Authorization: 'Bearer token' } }
        );
    });

    test('markAllAsRead should put update all', async () => {
        const mockData = { count: 10 };
        axios.put.mockResolvedValue({ data: mockData });

        const result = await markAllAsRead('token');
        expect(result).toEqual(mockData);
        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/notifications/read-all',
            {},
            { headers: { Authorization: 'Bearer token' } }
        );
    });

    test('checkAlerts should trigger backend check', async () => {
        const mockData = { triggered: true };
        axios.post.mockResolvedValue({ data: mockData });

        const result = await checkAlerts('token');
        expect(result).toEqual(mockData);
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/notifications/check',
            {},
            { headers: { Authorization: 'Bearer token' } }
        );
    });

    test('should propagate errors', async () => {
        axios.get.mockRejectedValue(new Error('Auth Error'));
        await expect(getUnreadCount('token')).rejects.toThrow('Auth Error');
    });
});
