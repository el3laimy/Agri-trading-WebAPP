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
// vi.mock('axios'); removed to use setup.js mock

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
        await getNotifications();
        expect(axios.get).toHaveBeenCalledWith('/notifications/', {
            params: { unread_only: false }
        });

        // Test with unreadOnly = true
        await getNotifications(true);
        expect(axios.get).toHaveBeenCalledWith('/notifications/', {
            params: { unread_only: true }
        });
    });

    test('getUnreadCount should fetch count', async () => {
        const mockData = { count: 5 };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getUnreadCount();
        expect(result).toEqual(mockData);
        expect(axios.get).toHaveBeenCalledWith('/notifications/count');
    });

    test('markAsRead should put update', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValue({ data: mockData });

        const result = await markAsRead(123);
        expect(result).toEqual(mockData);
        expect(axios.put).toHaveBeenCalledWith(
            '/notifications/123/read',
            {}
        );
    });

    test('markAllAsRead should put update all', async () => {
        const mockData = { count: 10 };
        axios.put.mockResolvedValue({ data: mockData });

        const result = await markAllAsRead();
        expect(result).toEqual(mockData);
        expect(axios.put).toHaveBeenCalledWith(
            '/notifications/read-all',
            {}
        );
    });

    test('checkAlerts should trigger backend check', async () => {
        const mockData = { triggered: true };
        axios.post.mockResolvedValue({ data: mockData });

        const result = await checkAlerts();
        expect(result).toEqual(mockData);
        expect(axios.post).toHaveBeenCalledWith(
            '/notifications/check',
            {}
        );
    });

    test('should propagate errors', async () => {
        axios.get.mockRejectedValue(new Error('Auth Error'));
        await expect(getUnreadCount()).rejects.toThrow('Auth Error');
    });
});
