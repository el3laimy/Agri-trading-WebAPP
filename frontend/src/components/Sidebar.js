import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
    const [openMenus, setOpenMenus] = useState({ reports: false, settings: false, system: false });

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
    };

    // العمليات اليومية الأساسية
    const dailyOperations = [
        { path: '/dashboard', label: 'لوحة التحكم', icon: 'bi-speedometer2' },
        { path: '/treasury', label: 'الخزينة اليومية', icon: 'bi-wallet2' },
        { path: '/sales', label: 'المبيعات', icon: 'bi-cart-check' },
        { path: '/purchases', label: 'المشتريات', icon: 'bi-bag-check' },
        { path: '/expenses', label: 'المصروفات', icon: 'bi-cash-coin' },
    ];

    // إدارة المخزون
    const inventoryItems = [
        { path: '/inventory', label: 'عرض المخزون', icon: 'bi-box-seam' },
        { path: '/inventory-adjustments', label: 'تسوية المخزون', icon: 'bi-sliders' },
    ];

    // التقارير المالية
    const reports = [
        { path: '/reports/capital-distribution', label: 'توزيع رأس المال', icon: 'bi-pie-chart' },
        { path: '/reports/cash-flow', label: 'التدفقات النقدية', icon: 'bi-arrow-left-right' },
        { path: '/reports/income-statement', label: 'قائمة الدخل', icon: 'bi-graph-up' },
        { path: '/reports/balance-sheet', label: 'الميزانية العمومية', icon: 'bi-clipboard-data' },
        { path: '/reports/trial-balance', label: 'ميزان المراجعة', icon: 'bi-calculator' },
        { path: '/reports/general-ledger', label: 'دفتر الأستاذ', icon: 'bi-journal-bookmark' },
        { path: '/reports/equity-statement', label: 'حقوق الملكية', icon: 'bi-bank' },
    ];

    // الإعدادات
    const settings = [
        { path: '/crops', label: 'المحاصيل', icon: 'bi-flower1' },
        { path: '/contacts', label: 'جهات التعامل', icon: 'bi-people' },
        { path: '/financial-accounts', label: 'الحسابات المالية', icon: 'bi-credit-card' },
        { path: '/seasons', label: 'المواسم', icon: 'bi-calendar-range' },
        { path: '/daily-prices', label: 'الأسعار اليومية', icon: 'bi-currency-exchange' },
        { path: '/journal', label: 'قيود اليومية', icon: 'bi-journal-text' },
    ];

    // إدارة النظام
    const system = [
        { path: '/backups', label: 'النسخ الاحتياطي', icon: 'bi-database-fill-gear' },
        // { path: '/users', label: 'المستخدمين', icon: 'bi-people-fill' }, // Soon
    ];

    const NavItem = ({ item, isSubItem = false }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `nav-link d-flex align-items-center ${isActive ? 'active-link' : ''} ${isSubItem ? 'text-white-50 py-2' : 'text-white py-2'}`
            }
            style={({ isActive }) => ({
                backgroundColor: isActive && !isSubItem ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderRadius: '8px',
                fontSize: isSubItem ? '0.9rem' : '0.95rem',
                transition: 'all 0.2s ease',
                paddingRight: isSubItem ? '1rem' : '0.75rem',
                marginBottom: '2px',
            })}
        >
            <i className={`bi ${item.icon} ms-2`} style={{ fontSize: isSubItem ? '0.85rem' : '1rem' }}></i>
            <span>{item.label}</span>
        </NavLink>
    );

    const MenuSection = ({ title, icon, items, menuKey }) => (
        <div className="mb-2">
            <button
                className="nav-link text-white w-100 d-flex align-items-center justify-content-between py-2"
                onClick={() => toggleMenu(menuKey)}
                style={{
                    background: openMenus[menuKey] ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                }}
            >
                <span className="d-flex align-items-center">
                    <i className={`bi ${icon} ms-2`}></i>
                    {title}
                </span>
                <i className={`bi bi-chevron-${openMenus[menuKey] ? 'up' : 'down'} transition-transform`}
                    style={{
                        fontSize: '0.75rem',
                        transition: 'transform 0.2s ease'
                    }}></i>
            </button>
            <div className={`collapse-menu ${openMenus[menuKey] ? 'show' : ''}`}
                style={{
                    maxHeight: openMenus[menuKey] ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease'
                }}>
                <ul className="nav flex-column me-3 mt-1 pe-2"
                    style={{ borderRight: '2px solid rgba(196, 163, 90, 0.3)' }}>
                    {items.map(item => (
                        <li className="nav-item" key={item.path}>
                            <NavItem item={item} isSubItem={true} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    return (
        <div className="sidebar d-flex flex-column flex-shrink-0 p-3 text-white"
            style={{
                width: 'var(--sidebar-width)',
                background: 'linear-gradient(180deg, #1E5631 0%, #0D3320 100%)',
                height: '100vh',
                position: 'fixed',
                right: 0,
                top: 0,
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '-4px 0 20px rgba(0,0,0,0.15)'
            }}>

            {/* Logo Section */}
            <a href="/" className="d-flex align-items-center mb-3 text-white text-decoration-none p-2 rounded"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="d-flex align-items-center">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '10px',
                            marginLeft: '10px',
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                    />
                    <div>
                        <span className="fw-bold d-block" style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>
                            المحاسبة الزراعية
                        </span>
                        <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                            نظام إدارة متكامل
                        </small>
                    </div>
                </div>
            </a>

            <hr style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '0.5rem 0 1rem' }} />

            {/* Navigation */}
            <nav className="flex-grow-1">
                {/* العمليات اليومية */}
                <div className="mb-3">
                    <small className="text-white-50 text-uppercase fw-bold px-2 d-block mb-2"
                        style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                        العمليات اليومية
                    </small>
                    <ul className="nav nav-pills flex-column">
                        {dailyOperations.map(item => (
                            <li className="nav-item" key={item.path}>
                                <NavItem item={item} />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* المخزون */}
                <div className="mb-3">
                    <small className="text-white-50 text-uppercase fw-bold px-2 d-block mb-2"
                        style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                        المخزون
                    </small>
                    <ul className="nav nav-pills flex-column">
                        {inventoryItems.map(item => (
                            <li className="nav-item" key={item.path}>
                                <NavItem item={item} />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* التقارير */}
                <MenuSection
                    title="التقارير المالية"
                    icon="bi-file-earmark-bar-graph"
                    items={reports}
                    menuKey="reports"
                />

                {/* الإعدادات */}
                <MenuSection
                    title="الإعدادات"
                    icon="bi-gear"
                    items={settings}
                    menuKey="settings"
                />

                {/* النظام */}
                <MenuSection
                    title="النظام"
                    icon="bi-shield-lock"
                    items={system}
                    menuKey="system"
                />
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-center text-white-50" style={{ fontSize: '0.75rem' }}>
                    <small>الإصدار 2.0</small>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
