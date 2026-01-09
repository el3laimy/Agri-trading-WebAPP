import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { useTheme } from '../context/ThemeContext';
import QuickSearch from './common/QuickSearch';

function Layout({ children }) {
    const { theme, toggleTheme } = useTheme();
    const [showQuickSearch, setShowQuickSearch] = useState(false);

    // Global keyboard shortcut for Quick Search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowQuickSearch(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-300" dir="rtl">
            <QuickSearch isOpen={showQuickSearch} onClose={() => setShowQuickSearch(false)} />

            {/* Sidebar (Fixed Right) */}
            <div className="w-64 flex-shrink-0">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-grow w-full transition-all duration-300">
                <header className="bg-white dark:bg-slate-800 shadow-sm p-4 mb-6 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 dark:border-slate-700 transition-colors duration-300">
                    <div>
                        <h5 className="m-0 text-gray-700 dark:text-gray-200 font-bold text-lg">لوحة المعلومات</h5>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Quick Search Button */}
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary transition-all text-sm"
                            onClick={() => setShowQuickSearch(true)}
                            title="بحث سريع (Ctrl+K)"
                        >
                            <i className="bi bi-search"></i>
                            <span className="hidden md:inline font-medium">بحث</span>
                            <kbd className="hidden md:inline-block bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-sans text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600 shadow-sm mx-1">Ctrl+K</kbd>
                        </button>

                        <button
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary transition-colors"
                            onClick={toggleTheme}
                            title="تغيير الوضع"
                        >
                            <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'} text-lg`}></i>
                        </button>

                        <div className="border-r border-gray-200 dark:border-slate-700 h-8 mx-1"></div>

                        <NotificationCenter />

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-100 dark:border-green-800">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            متصل
                        </div>
                    </div>
                </header>

                <main className="p-6 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
