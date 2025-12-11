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

    // Initial load and periodic polling
    useEffect(() => {
        if (!token) return;

        loadUnreadCount();

        // Check for new alerts occasionally
        const pollInterval = setInterval(() => {
            loadUnreadCount();
        }, 60000); // Every minute

        return () => clearInterval(pollInterval);
    }, [token]);

    const loadUnreadCount = async () => {
        try {
            const data = await notifApi.getUnreadCount(token);
            setUnreadCount(data.count);
        } catch (err) {
            console.error("Failed to load notification count", err);
        }
    };

    const loadNotifications = async () => {
        setLoading(true);
        try {
            // Trigger a check first to ensure fresh data
            await notifApi.checkAlerts(token);

            const data = await notifApi.getNotifications(token);
            setNotifications(data);

            // Update count as well
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
        e.stopPropagation();
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
            await handleMarkAsRead(notif, { stopPropagation: () => { } });
        }
        if (notif.action_url) {
            setIsOpen(false);
            navigate(notif.action_url);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'LOW_STOCK': return <FaExclamationTriangle className="text-yellow-500" />;
            case 'OVERDUE_DEBT': return <FaExclamationCircle className="text-red-500" />;
            case 'SUCCESS': return <FaCheckCircle className="text-green-500" />;
            default: return <FaInfoCircle className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-600 hover:text-green-700 transition-colors focus:outline-none"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 text-right direction-rtl origin-top-left">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">التنبيهات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">لا توجد تنبيهات جديدة</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(notif.created_at).toLocaleString('ar-EG')}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="flex flex-col justify-center">
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notif, e)}
                                                    className="w-2 h-2 bg-blue-600 rounded-full hover:bg-blue-800"
                                                    title="تحديد كمقروء"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                        <button onClick={() => navigate('/notifications')} className="text-xs text-gray-600 hover:text-gray-900">
                            عرض كل التنبيهات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
