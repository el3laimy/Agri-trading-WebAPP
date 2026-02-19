/**
 * LocationPicker Component
 * Modal for selecting weather location
 */

import React, { useState } from 'react';
import { EGYPTIAN_CITIES, saveLocation, getCityDisplayName } from '../../api/weather';

export function LocationPicker({ isOpen, onClose, currentLocation, onLocationChange }) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredCities = EGYPTIAN_CITIES.filter(city =>
        city.name.includes(searchTerm) || city.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (cityValue) => {
        saveLocation(cityValue);
        onLocationChange(cityValue);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <i className="bi bi-geo-alt-fill"></i>
                            اختر موقعك
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <p className="text-sm text-white/70 mt-1">
                        اختر المدينة لعرض حالة الطقس
                    </p>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <i className="bi bi-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن مدينة..."
                            className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl 
                                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            dir="rtl"
                        />
                    </div>
                </div>

                {/* Cities List */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {filteredCities.map((city) => (
                        <button
                            key={city.value}
                            onClick={() => handleSelect(city.value)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                                      hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                                      ${currentLocation === city.value
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                    : 'text-gray-700 dark:text-gray-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                          ${currentLocation === city.value
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <i className={`bi ${currentLocation === city.value ? 'bi-check-lg' : 'bi-geo'}`}></i>
                            </div>
                            <span className="font-medium">{city.name}</span>
                            {currentLocation === city.value && (
                                <span className="mr-auto text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                                    الموقع الحالي
                                </span>
                            )}
                        </button>
                    ))}

                    {filteredCities.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <i className="bi bi-search text-3xl mb-2 block"></i>
                            <p>لم يتم العثور على نتائج</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LocationPicker;
