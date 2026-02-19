/**
 * CommandPalette.js
 * Command Palette Component (Ctrl+K) for quick navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Command Items
    const commands = [
        // Navigation
        { id: 'dashboard', label: 'لوحة التحكم', icon: 'bi-speedometer2', path: '/dashboard', category: 'التنقل', gradient: 'from-emerald-500 to-teal-500' },
        { id: 'sales', label: 'المبيعات', icon: 'bi-cart-check', path: '/sales', category: 'التنقل', gradient: 'from-green-500 to-emerald-500' },
        { id: 'purchases', label: 'المشتريات', icon: 'bi-bag', path: '/purchases', category: 'التنقل', gradient: 'from-blue-500 to-cyan-500' },
        { id: 'inventory', label: 'المخزون', icon: 'bi-box-seam', path: '/inventory', category: 'التنقل', gradient: 'from-amber-500 to-orange-500' },
        { id: 'treasury', label: 'الخزينة', icon: 'bi-safe2', path: '/treasury', category: 'التنقل', gradient: 'from-yellow-500 to-amber-500' },
        { id: 'expenses', label: 'المصروفات', icon: 'bi-receipt', path: '/expenses', category: 'التنقل', gradient: 'from-red-500 to-rose-500' },
        { id: 'contacts', label: 'جهات الاتصال', icon: 'bi-people', path: '/contacts', category: 'التنقل', gradient: 'from-purple-500 to-violet-500' },

        // Actions
        { id: 'new-sale', label: 'إنشاء عملية بيع جديدة', icon: 'bi-cart-plus', path: '/sales', action: 'new', category: 'إجراءات', gradient: 'from-emerald-500 to-green-500' },
        { id: 'new-purchase', label: 'إنشاء عملية شراء جديدة', icon: 'bi-bag-plus', path: '/purchases', action: 'new', category: 'إجراءات', gradient: 'from-blue-500 to-indigo-500' },
        { id: 'new-expense', label: 'إضافة مصروف جديد', icon: 'bi-plus-circle', path: '/expenses', action: 'new', category: 'إجراءات', gradient: 'from-red-500 to-pink-500' },

        // Reports
        { id: 'income-statement', label: 'قائمة الدخل', icon: 'bi-graph-up', path: '/reports/income-statement', category: 'التقارير', gradient: 'from-cyan-500 to-blue-500' },
        { id: 'capital-distribution', label: 'توزيع رأس المال', icon: 'bi-pie-chart', path: '/reports/capital-distribution', category: 'التقارير', gradient: 'from-pink-500 to-rose-500' },
        { id: 'general-ledger', label: 'دفتر الأستاذ العام', icon: 'bi-journal-bookmark', path: '/reports/general-ledger', category: 'التقارير', gradient: 'from-purple-500 to-pink-500' },
        { id: 'debt-report', label: 'تقرير الديون', icon: 'bi-file-earmark-text', path: '/debtors', category: 'التقارير', gradient: 'from-indigo-500 to-purple-500' },

        // Settings
        { id: 'crops', label: 'إدارة المحاصيل', icon: 'bi-flower1', path: '/crops', category: 'الإعدادات', gradient: 'from-lime-500 to-green-500' },
        { id: 'seasons', label: 'إدارة المواسم', icon: 'bi-calendar-check', path: '/seasons', category: 'الإعدادات', gradient: 'from-orange-500 to-amber-500' },
        { id: 'users', label: 'إدارة المستخدمين', icon: 'bi-person-gear', path: '/users', category: 'الإعدادات', gradient: 'from-slate-500 to-gray-500' },
    ];

    // Filter commands based on query
    const filteredCommands = query
        ? commands.filter(cmd =>
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.category.toLowerCase().includes(query.toLowerCase())
        )
        : commands;

    // Group by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredCommands.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredCommands.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        executeCommand(filteredCommands[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, onClose]);

    const executeCommand = useCallback((command) => {
        navigate(command.path);
        onClose();
    }, [navigate, onClose]);

    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div
                className="command-palette animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="relative">
                    <i className="bi bi-search absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="ابحث عن أمر..."
                        className="command-palette-input pr-12"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-mono">
                            ESC
                        </kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="command-palette-results">
                    {filteredCommands.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <i className="bi bi-search text-4xl mb-3 block opacity-50" />
                            <p>لا توجد نتائج لـ "{query}"</p>
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, items]) => (
                            <div key={category} className="mb-4">
                                <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {category}
                                </div>
                                {items.map((cmd) => {
                                    const globalIndex = filteredCommands.indexOf(cmd);
                                    const isActive = globalIndex === selectedIndex;

                                    return (
                                        <div
                                            key={cmd.id}
                                            onClick={() => executeCommand(cmd)}
                                            className={`command-palette-item ${isActive ? 'active' : ''}`}
                                        >
                                            <div className={`command-palette-item-icon bg-gradient-to-br ${cmd.gradient} text-white`}>
                                                <i className={`bi ${cmd.icon}`} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {cmd.label}
                                                </p>
                                                {cmd.action && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {cmd.action === 'new' ? 'إنشاء جديد' : cmd.action}
                                                    </p>
                                                )}
                                            </div>
                                            {isActive && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">↵</kbd>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded shadow-sm border border-gray-200 dark:border-slate-600">↑↓</kbd>
                            للتنقل
                        </span>
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded shadow-sm border border-gray-200 dark:border-slate-600">↵</kbd>
                            للفتح
                        </span>
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded shadow-sm border border-gray-200 dark:border-slate-600">ESC</kbd>
                            للإغلاق
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
