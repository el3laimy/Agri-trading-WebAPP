import React from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';

function Layout({ children }) {
    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
            <Sidebar />
            <div className="flex-grow-1" style={{ marginRight: 'var(--sidebar-width)', transition: 'margin-right 0.3s' }}>
                {/* Top Header can go here if needed */}
                <header className="bg-white shadow-sm p-3 mb-4 d-flex justify-content-between align-items-center">
                    <h5 className="m-0 text-muted">لوحة المعلومات</h5>
                    <div className="d-flex align-items-center gap-3">
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
