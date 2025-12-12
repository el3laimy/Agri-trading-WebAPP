import React from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { useTheme } from '../context/ThemeContext';

function Layout({ children }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}> {/* Changed --bg-main to --bg-body */}
            <Sidebar />
            <div className="flex-grow-1" style={{ marginRight: 'var(--sidebar-width)', transition: 'margin-right 0.3s' }}>
                <header className="bg-white shadow-sm p-3 mb-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-card)' }}> {/* Override inline bg */}
                    <h5 className="m-0 text-muted">لوحة المعلومات</h5>
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-link text-decoration-none" onClick={toggleTheme} title="تغيير الوضع">
                            <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'} fs-5 text-secondary`}></i>
                        </button>
                        <NotificationCenter />
                        <span className="badge bg-success rounded-pill">متصل</span>
                    </div>
                </header>
                <main className="p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
