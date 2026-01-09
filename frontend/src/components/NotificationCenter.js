import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as notifApi from '../api/notifications';
import { FaBell, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUnreadCount = React.useCallback(async () => {
        try {
            const data = await notifApi.getUnreadCount(token);
            setUnreadCount(data.count);
        } catch (err) {
            console.error("Failed to load notification count", err);
        }
    }, [token]);

    // Initial load and periodic polling
    useEffect(() => {
        if (!token) return;

        loadUnreadCount();

        const pollInterval = setInterval(() => {
            loadUnreadCount();
        }, 60000);

        return () => clearInterval(pollInterval);
    }, [token, loadUnreadCount]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            await notifApi.checkAlerts(token);
            const data = await notifApi.getNotifications(token);
            setNotifications(data);

            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            loadNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAsRead = async (details, e) => {
        e && e.stopPropagation();
        try {
            await notifApi.markAsRead(token, details.id);
            setNotifications(prev => prev.map(n =>
                n.id === details.id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notifApi.markAllAsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await handleMarkAsRead(notif);
        }
        setIsOpen(false);
        if (notif.action_url) {
            navigate(notif.action_url);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'LOW_STOCK':
                return (
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <FaExclamationTriangle className="w-4 h-4" />
                    </div>
                );
            case 'OVERDUE_DEBT':
                return (
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <FaExclamationCircle className="w-4 h-4" />
                    </div>
                );
            case 'SUCCESS':
                return (
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <FaCheckCircle className="w-4 h-4" />
                    </div>
                );
            default:
                return (
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <FaInfoCircle className="w-4 h-4" />
                    </div>
                );
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={toggleDropdown}
                className={`group relative p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-inner'
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md'
                    }`}
                title="التنبيهات"
            >
                <FaBell className={`w-5 h-5 transition-transform duration-500 ${unreadCount > 0 ? 'animate-bounce-subtle' : ''}`} />

                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 min-w-[20px] px-1 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-red-500/20">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-down origin-top-left transition-colors">
                    {/* Header */}
                    <div className="px-5 py-4 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-bottom dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 antialiased animate-pulse"></span>
                            <h6 className="m-0 font-bold text-gray-800 dark:text-gray-100">التنبيهات</h6>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 space-y-3">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">جاري تحميل التنبيهات...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-full mb-4">
                                    <FaBell className="w-8 h-8 text-gray-300 dark:text-gray-600 opacity-50" />
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">لا توجد تنبيهات جديدة حالياً</span>
                                <p className="text-xs text-gray-400 mt-1">سنخطرك عند حدوث أي نشاط جديد</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`group flex gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!notif.is_read ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-r-4 border-emerald-500' : 'border-r-4 border-transparent'
                                            }`}
                                    >
                                        <div className="flex-shrink-0 pt-1">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h6 className={`text-sm truncate leading-tight ${!notif.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                    {notif.title}
                                                </h6>
                                                <span className="text-[10px] whitespace-nowrap text-gray-400 font-medium bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                                    {new Date(notif.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-0">
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 group-hover:scale-125 transition-transform duration-200"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-t dark:border-slate-700">
                        <button
                            onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                            className="w-full py-2 px-4 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-sm transition-all duration-200"
                        >
                            عرض السجل بالكامل
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
