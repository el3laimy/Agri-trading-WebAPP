/**
 * Weather API Service
 * Fetches real weather data from OpenWeatherMap API
 */

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '8b17866499c90b00762849172880a11f'; // Fallback for dev only
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Egyptian cities for the location picker
export const EGYPTIAN_CITIES = [
    { name: 'القاهرة', value: 'Cairo,EG' },
    { name: 'الإسكندرية', value: 'Alexandria,EG' },
    { name: 'الجيزة', value: 'Giza,EG' },
    { name: 'المنصورة', value: 'Mansoura,EG' },
    { name: 'طنطا', value: 'Tanta,EG' },
    { name: 'الزقازيق', value: 'Zagazig,EG' },
    { name: 'المحلة الكبرى', value: 'Mahalla,EG' },
    { name: 'دمنهور', value: 'Damanhur,EG' },
    { name: 'كفر الشيخ', value: 'Kafr el-Sheikh,EG' },
    { name: 'بنها', value: 'Benha,EG' },
    { name: 'شبين الكوم', value: 'Shibin El Kom,EG' },
    { name: 'الفيوم', value: 'Faiyum,EG' },
    { name: 'بني سويف', value: 'Beni Suef,EG' },
    { name: 'المنيا', value: 'Minya,EG' },
    { name: 'أسيوط', value: 'Asyut,EG' },
    { name: 'سوهاج', value: 'Sohag,EG' },
    { name: 'قنا', value: 'Qena,EG' },
    { name: 'الأقصر', value: 'Luxor,EG' },
    { name: 'أسوان', value: 'Aswan,EG' },
    { name: 'الإسماعيلية', value: 'Ismailia,EG' },
    { name: 'بورسعيد', value: 'Port Said,EG' },
    { name: 'السويس', value: 'Suez,EG' },
];

// Weather condition icons mapping
const WEATHER_ICONS = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Dust': '💨',
    'Sand': '💨',
    'Smoke': '💨',
};

// Arabic weather descriptions
const WEATHER_DESC_AR = {
    'Clear': 'صافي',
    'Clouds': 'غائم',
    'Rain': 'ممطر',
    'Drizzle': 'رذاذ',
    'Thunderstorm': 'عاصفة رعدية',
    'Snow': 'ثلوج',
    'Mist': 'شبورة',
    'Fog': 'ضباب',
    'Haze': 'ضباب خفيف',
    'Dust': 'غبار',
    'Sand': 'عاصفة رملية',
    'Smoke': 'دخان',
};

/**
 * Get visibility status based on distance in meters
 */
export function getVisibilityStatus(visibility) {
    if (visibility < 200) {
        return { text: 'رؤية ضعيفة جداً ⚠️', color: '#ef4444', level: 'critical' };
    } else if (visibility < 1000) {
        return { text: 'رؤية ضعيفة', color: '#f97316', level: 'poor' };
    } else if (visibility < 4000) {
        return { text: 'رؤية متوسطة', color: '#eab308', level: 'moderate' };
    } else {
        return { text: 'رؤية جيدة ✓', color: '#22c55e', level: 'good' };
    }
}

/**
 * Fetch weather data from OpenWeatherMap
 */
export async function fetchWeather(city = 'Cairo,EG') {
    try {
        const response = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ar`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();

        const mainCondition = data.weather[0]?.main || 'Clear';
        const visibility = data.visibility || 10000; // Default 10km if not available

        return {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            condition: mainCondition,
            icon: WEATHER_ICONS[mainCondition] || '🌡️',
            description: WEATHER_DESC_AR[mainCondition] || data.weather[0]?.description,
            visibility: visibility,
            visibilityKm: (visibility / 1000).toFixed(1),
            visibilityStatus: getVisibilityStatus(visibility),
            cityName: data.name,
            isFoggy: ['Mist', 'Fog', 'Haze'].includes(mainCondition),
            windSpeed: data.wind?.speed || 0,
        };
    } catch (error) {
        console.error('Weather API Error:', error);
        return null;
    }
}

/**
 * Get saved location from localStorage
 */
export function getSavedLocation() {
    return localStorage.getItem('weather_location') || 'Cairo,EG';
}

/**
 * Save location to localStorage
 */
export function saveLocation(city) {
    localStorage.setItem('weather_location', city);
}

/**
 * Get city display name from value
 */
export function getCityDisplayName(value) {
    const city = EGYPTIAN_CITIES.find(c => c.value === value);
    return city ? city.name : value.split(',')[0];
}
