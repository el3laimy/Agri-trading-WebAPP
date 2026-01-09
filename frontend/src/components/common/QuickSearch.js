import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global Quick Search Component - Tailwind CSS version
 * Access with Ctrl+K or clicking the search icon
 */
function QuickSearch({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Navigation items for quick access
    const navigationItems = [
        { label: 'لوحة التحكم', path: '/', icon: 'bi-speedometer2', keywords: ['dashboard', 'home', 'الرئيسية'] },
        { label: 'المشتريات', path: '/purchases', icon: 'bi-bag-check', keywords: ['purchases', 'شراء', 'فاتورة'] },
        { label: 'المبيعات', path: '/sales', icon: 'bi-cart', keywords: ['sales', 'بيع', 'فاتورة'] },
        { label: 'المخزون', path: '/inventory', icon: 'bi-box-seam', keywords: ['inventory', 'stock', 'مخزن'] },
        { label: 'جهات التعامل', path: '/contacts', icon: 'bi-people', keywords: ['contacts', 'عملاء', 'موردين'] },
        { label: 'الخزينة', path: '/treasury', icon: 'bi-safe', keywords: ['treasury', 'cash', 'نقدية'] },
        { label: 'المصروفات', path: '/expenses', icon: 'bi-receipt', keywords: ['expenses', 'مصاريف'] },
        { label: 'التقارير', path: '/reports', icon: 'bi-bar-chart', keywords: ['reports', 'تقارير'] },
        { label: 'إضافة مشتريات', path: '/purchases?add=true', icon: 'bi-plus-circle', keywords: ['add purchase', 'شراء جديد'] },
        { label: 'إضافة مبيعات', path: '/sales?add=true', icon: 'bi-plus-circle', keywords: ['add sale', 'بيع جديد'] },
    ];

    // Filter items based on query
    const filteredItems = query.trim()
        ? navigationItems.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
        )
        : navigationItems.slice(0, 6); // Show top 6 when no query

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
                e.preventDefault();
                handleSelect(filteredItems[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleSelect = (item) => {
        navigate(item.path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="absolute left-1/2 -translate-x-1/2 top-[15%] w-[90%] max-w-[500px]"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
                            <span className="px-3 text-gray-400">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="flex-grow py-2.5 px-2 text-lg bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                placeholder="ابحث أو انتقل إلى... (Ctrl+K)"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                                autoFocus
                            />
                            <span className="px-3">
                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs rounded">Esc</kbd>
                            </span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <i className="bi bi-search text-4xl block mb-2 opacity-50"></i>
                                لا توجد نتائج
                            </div>
                        ) : (
                            filteredItems.map((item, index) => (
                                <button
                                    key={item.path}
                                    className={`w-full flex items-center gap-3 py-3 px-4 text-right transition-colors ${index === selectedIndex
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                    onClick={() => handleSelect(item)}
                                >
                                    <i className={`bi ${item.icon} text-xl opacity-75`}></i>
                                    <span className="flex-grow">{item.label}</span>
                                    <i className="bi bi-arrow-return-left opacity-50"></i>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="p-2 bg-gray-50 dark:bg-slate-900 text-center text-sm text-gray-500 dark:text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-xs">↑</kbd>
                        {' '}
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-xs">↓</kbd>
                        {' '}للتنقل •{' '}
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-xs">Enter</kbd>
                        {' '}للاختيار •{' '}
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-xs">Esc</kbd>
                        {' '}للإغلاق
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(callbacks) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape' && callbacks.onEscape) {
                    callbacks.onEscape();
                }
                return;
            }

            // Ctrl+K: Quick Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                callbacks.onQuickSearch?.();
            }

            // Ctrl+N: New item (context-dependent)
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                callbacks.onNew?.();
            }

            // Ctrl+S: Save (forms)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                callbacks.onSave?.();
            }

            // Escape: Close/Cancel
            if (e.key === 'Escape') {
                callbacks.onEscape?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callbacks]);
}

export default QuickSearch;
