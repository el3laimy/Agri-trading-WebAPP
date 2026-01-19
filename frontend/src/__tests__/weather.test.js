/**
 * Weather API Tests
 * 
 * Tests for weather.js - Weather Data Management
 * Target coverage: 80%+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Import actual functions from weather.js
import {
    fetchWeather,
    getVisibilityStatus,
    getSavedLocation,
    saveLocation,
    getCityDisplayName,
    EGYPTIAN_CITIES
} from '../api/weather';

// Mock global fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// Helper Functions Tests
// =============================================================================

describe('Weather Helpers', () => {

    test('getCityDisplayName should return name for valid value', () => {
        expect(getCityDisplayName('Cairo,EG')).toBe('القاهرة');
        expect(getCityDisplayName('Alexandria,EG')).toBe('الإسكندرية');
    });

    test('getCityDisplayName should return value prefix if not found', () => {
        expect(getCityDisplayName('Unknown,City')).toBe('Unknown');
    });

    test('saveLocation should store in localStorage', () => {
        saveLocation('Giza,EG');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('weather_location', 'Giza,EG');
    });

    test('getSavedLocation should retrieve from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('Aswan,EG');
        expect(getSavedLocation()).toBe('Aswan,EG');
    });

    test('getSavedLocation should return default if missing', () => {
        localStorageMock.getItem.mockReturnValue(null);
        expect(getSavedLocation()).toBe('Cairo,EG');
    });

    test('getVisibilityStatus should categorize correctly', () => {
        expect(getVisibilityStatus(100).level).toBe('critical');
        expect(getVisibilityStatus(500).level).toBe('poor');
        expect(getVisibilityStatus(3000).level).toBe('moderate');
        expect(getVisibilityStatus(10000).level).toBe('good');
    });
});

// =============================================================================
// API Tests (fetchWeather)
// =============================================================================

describe('fetchWeather', () => {

    const mockSuccessResponse = {
        ok: true,
        json: async () => ({
            weather: [{ main: 'Clear', description: 'sky is clear' }],
            main: { temp: 25.5, feels_like: 26, humidity: 50 },
            visibility: 10000,
            wind: { speed: 5.5 },
            name: 'Cairo'
        })
    };

    test('should fetch and format weather data successfully', async () => {
        global.fetch.mockResolvedValue(mockSuccessResponse);

        const result = await fetchWeather('Cairo,EG');

        expect(result).toBeDefined();
        expect(result.temp).toBe(26); // rounded
        expect(result.cityName).toBe('Cairo');
        expect(result.condition).toBe('Clear');
        // Check arabic mapping
        expect(result.description).toBe('صافي');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('api.openweathermap.org/data/2.5/weather')
        );
    });

    test('should handle API failure (non-200)', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404
        });

        const result = await fetchWeather('InvalidCity');
        expect(result).toBeNull();
    });

    test('should handle network exception', async () => {
        global.fetch.mockRejectedValue(new Error('Network Error'));

        const result = await fetchWeather();
        expect(result).toBeNull();
    });

    test('should handle missing optional data', async () => {
        // Mock response with missing optional fields
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                weather: [], // Empty array
                main: { temp: 20, feels_like: 20, humidity: 40 },
                // Missing visibility and wind
                name: 'City'
            })
        });

        const result = await fetchWeather();

        expect(result).toBeDefined();
        expect(result.condition).toBe('Clear'); // Default
        expect(result.visibility).toBe(10000); // Default
        expect(result.windSpeed).toBe(0); // Default
    });
});
