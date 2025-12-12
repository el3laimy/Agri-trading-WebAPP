import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();
    const { customers, crops } = useData();

    // Pages configuration
    const pages = [
        { title: 'لوحة التحكم', path: '/dashboard', icon: 'bi-speedometer2' },
        { title: 'المبيعات', path: '/sales', icon: 'bi-cart-check' },
        { title: 'المشتريات', path: '/purchases', icon: 'bi-bag-check' },
        { title: 'المخزون', path: '/inventory', icon: 'bi-box-seam' },
        { title: 'الخزينة', path: '/treasury', icon: 'bi-wallet2' },
        { title: 'المصروفات', path: '/expenses', icon: 'bi-cash-coin' },
        { title: 'التقارير', path: '/reports/advanced', icon: 'bi-graph-up' },
        { title: 'النسخ الاحتياطي', path: '/backups', icon: 'bi-cloud-download' }
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();

        const pageResults = pages.filter(p => p.title.toLowerCase().includes(lowerTerm))
            .map(p => ({ ...p, type: 'page' }));

        const customerResults = customers.filter(c => c.name.toLowerCase().includes(lowerTerm))
            .slice(0, 3)
            .map(c => ({
                title: c.name,
                path: `/contacts/${c.contact_id}`,
                icon: 'bi-person',
                type: 'customer'
            }));

        const cropResults = crops.filter(c => c.crop_name.toLowerCase().includes(lowerTerm))
            .slice(0, 3)
            .map(c => ({
                title: c.crop_name,
                path: '/inventory', // Could link to crop specific page if exists
                icon: 'bi-flower1',
                type: 'crop'
            }));

        setResults([...pageResults, ...customerResults, ...cropResults]);
        setSelectedIndex(0);

    }, [searchTerm, customers, crops]);

    const handleSelect = (path) => {
        navigate(path);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex].path);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '10vh'
        }} onClick={() => setIsOpen(false)}>
            <div style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                <div className="p-3 border-bottom d-flex align-items-center">
                    <i className="bi bi-search me-2 text-muted"></i>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="form-control border-0 shadow-none bg-transparent"
                        placeholder="ابحث عن صفحة، عميل، أو محصول..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}
                    />
                    <span className="badge bg-light text-dark border">ESC</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {results.length === 0 && searchTerm && (
                        <div className="p-4 text-center text-muted">لا توجد نتائج</div>
                    )}
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className={`p-3 d-flex align-items-center cursor-pointer ${index === selectedIndex ? 'bg-light' : ''}`}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: index === selectedIndex ? 'var(--primary-50)' : 'transparent',
                                borderBottom: '1px solid var(--border-light)'
                            }}
                            onClick={() => handleSelect(result.path)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className={`me-3 rounded-circle p-2 bg-light text-primary d-flex align-items-center justify-content-center`} style={{ width: 40, height: 40 }}>
                                <i className={`bi ${result.icon}`}></i>
                            </div>
                            <div>
                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{result.title}</div>
                                <small className="text-muted">
                                    {result.type === 'page' ? 'صفحة' : result.type === 'customer' ? 'عميل' : 'محصول'}
                                </small>
                            </div>
                            {index === selectedIndex && (
                                <i className="bi bi-arrow-return-left ms-auto text-muted"></i>
                            )}
                        </div>
                    ))}
                    {!searchTerm && (
                        <div className="p-3 text-muted small">
                            ابدأ الكتابة للبحث...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
