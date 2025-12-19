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

    // Styling constants using app theme
    const styles = {
        container: {
            position: 'relative',
        },
        button: {
            position: 'relative',
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: isOpen ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        badge: {
            position: 'absolute',
            top: '0',
            right: '0',
            minWidth: '18px',
            height: '18px',
            padding: '0 5px',
            borderRadius: '10px',
            backgroundColor: 'var(--danger-color)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--bg-card)',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
        },
        dropdown: {
            position: 'absolute',
            left: '0',
            top: 'calc(100% + 15px)',
            width: '360px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'slideIn 0.2s ease-out forwards',
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column',
        },
        header: {
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card-hover)',
        },
        list: {
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0',
            margin: '0',
            listStyle: 'none',
        },
        item: {
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            gap: '15px',
            alignItems: 'start',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            textAlign: 'right',
        },
        footer: {
            padding: '12px',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card-hover)',
        },
        empty: {
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
        },
        iconWrapper: (bgColor, color) => ({
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: bgColor,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        })
    };

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

        const pollInterval = setInterval(() => {
            loadUnreadCount();
        }, 60000);

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
            case 'LOW_STOCK': return <div style={styles.iconWrapper('var(--warning-light)', 'var(--warning-color)')}><FaExclamationTriangle size={14} /></div>;
            case 'OVERDUE_DEBT': return <div style={styles.iconWrapper('var(--danger-light)', 'var(--danger-color)')}><FaExclamationCircle size={14} /></div>;
            case 'SUCCESS': return <div style={styles.iconWrapper('var(--success-light)', 'var(--success-color)')}><FaCheckCircle size={14} /></div>;
            default: return <div style={styles.iconWrapper('var(--info-light)', 'var(--info-color)')}><FaInfoCircle size={14} /></div>;
        }
    };

    return (
        <div style={styles.container} ref={dropdownRef}>
            <style>
                {`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                        70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                    }
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .notif-item:hover { background-color: var(--bg-hover) !important; }
                `}
            </style>

            <button
                onClick={toggleDropdown}
                style={styles.button}
                className="notification-bell-btn"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => !isOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
                title="التنبيهات"
            >
                <FaBell size={20} style={{ color: 'var(--text-secondary)' }} />
                {unreadCount > 0 && (
                    <span style={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <h6 style={{ margin: 0, fontWeight: 'bold' }}>التنبيهات</h6>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="btn btn-sm btn-link text-decoration-none"
                                style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    <div style={styles.list}>
                        {loading ? (
                            <div style={styles.empty}>
                                <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
                                <span className="mt-2 text-muted text-sm">جاري التحميل...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={styles.empty}>
                                <FaBell size={32} style={{ color: 'var(--text-muted)', opacity: 0.25, marginBottom: '0.5rem' }} />
                                <span className="text-muted">لا توجد تنبيهات جديدة</span>
                            </div>
                        ) : (
                            <div className="d-flex flex-column">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className="notif-item"
                                        style={{
                                            ...styles.item,
                                            backgroundColor: !notif.is_read ? 'var(--primary-50)' : 'transparent',
                                            borderRight: !notif.is_read ? '3px solid var(--primary-color)' : '3px solid transparent'
                                        }}
                                    >
                                        <div style={{ flexShrink: 0 }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <span style={{ fontWeight: !notif.is_read ? 'bold' : 'normal', fontSize: '0.9rem' }}>
                                                    {notif.title}
                                                </span>
                                                <span className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(notif.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="mb-0 text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.footer}>
                        <button
                            onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                            className="btn btn-sm w-100 text-muted"
                            style={{ fontSize: '0.85rem' }}
                        >
                            عرض كل التنبيهات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
