import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDebtAnalysis } from '../api/reports';
import html2canvas from 'html2canvas';

function DebtorsView() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('type') === 'payables' ? 'payables' : 'receivables';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [debtData, setDebtData] = useState({ receivables: [], payables: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const tableRef = useRef(null);

    useEffect(() => {
        fetchDebtData();
    }, []);

    const fetchDebtData = async () => {
        setLoading(true);
        try {
            const data = await getDebtAnalysis();
            setDebtData(data);
        } catch (err) {
            console.error("Failed to fetch debt data:", err);
            setError("فشل تحميل بيانات المديونية");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Filter data based on search
    const currentData = activeTab === 'receivables' ? debtData.receivables : debtData.payables;
    const filteredData = currentData.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm)
    );

    // Calculate totals
    const totalAmount = filteredData.reduce((sum, item) => sum + (item.balance_due || 0), 0);

    // Print functionality
    const handlePrint = () => {
        window.print();
    };

    // Share as text via WhatsApp
    const handleShareText = () => {
        const title = activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين';
        let message = `📋 ${title}\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;

        filteredData.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   المبلغ: ${formatCurrency(item.balance_due)}\n`;
            if (item.phone) message += `   الهاتف: ${item.phone}\n`;
            message += `\n`;
        });

        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `📊 الإجمالي: ${formatCurrency(totalAmount)}\n`;
        message += `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Share as image via WhatsApp
    const handleShareImage = async () => {
        if (!tableRef.current) return;

        try {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            canvas.toBlob(async (blob) => {
                try {
                    // Try to use the share API if available
                    if (navigator.share && navigator.canShare({ files: [new File([blob], 'debtors.png', { type: 'image/png' })] })) {
                        await navigator.share({
                            files: [new File([blob], 'debtors.png', { type: 'image/png' })],
                            title: activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين'
                        });
                    } else {
                        // Fallback: download the image
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeTab === 'receivables' ? 'مستحقات_العملاء' : 'مستحقات_الموردين'}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert('تم تحميل الصورة. يمكنك إرسالها عبر الواتساب يدوياً.');
                    }
                } catch (shareError) {
                    console.error('Share failed:', shareError);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Failed to create image:', err);
            alert('فشل إنشاء الصورة');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    <i className="bi bi-arrow-right me-2"></i>
                    العودة
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-outline-secondary me-3"
                            onClick={() => navigate('/dashboard')}
                        >
                            <i className="bi bi-arrow-right me-1"></i>
                            العودة
                        </button>
                        <div>
                            <h2 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>
                                <i className="bi bi-cash-coin me-2"></i>
                                إدارة المديونيات
                            </h2>
                            <p className="text-muted mb-0">عرض وإدارة مستحقات العملاء والموردين</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 flex-wrap">
                        <button className="btn btn-outline-secondary" onClick={handlePrint}>
                            <i className="bi bi-printer me-2"></i>
                            طباعة
                        </button>
                        <div className="btn-group">
                            <button
                                className="btn btn-success dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="bi bi-whatsapp me-2"></i>
                                مشاركة واتساب
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <button className="dropdown-item" onClick={handleShareText}>
                                        <i className="bi bi-chat-text me-2"></i>
                                        إرسال كنص
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={handleShareImage}>
                                        <i className="bi bi-image me-2"></i>
                                        إرسال كصورة
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <ul className="nav nav-tabs nav-justified" style={{ fontSize: '1.1rem' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'receivables' ? 'active' : ''}`}
                                onClick={() => setActiveTab('receivables')}
                                style={{ fontWeight: activeTab === 'receivables' ? 'bold' : 'normal' }}
                            >
                                <i className="bi bi-person-check me-2"></i>
                                مستحقات من العملاء
                                <span className="badge bg-warning text-dark ms-2">
                                    {debtData.receivables?.length || 0}
                                </span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'payables' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payables')}
                                style={{ fontWeight: activeTab === 'payables' ? 'bold' : 'normal' }}
                            >
                                <i className="bi bi-truck me-2"></i>
                                مستحقات للموردين
                                <span className="badge bg-danger ms-2">
                                    {debtData.payables?.length || 0}
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Search Bar */}
            <div className="row mb-3">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="بحث بالاسم أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-md-end">
                    <div className="d-inline-block p-2 rounded" style={{ backgroundColor: activeTab === 'receivables' ? '#fff3cd' : '#f8d7da' }}>
                        <strong>الإجمالي: </strong>
                        <span className={`fs-5 fw-bold ${activeTab === 'receivables' ? 'text-warning' : 'text-danger'}`}>
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card border-0 shadow-sm" ref={tableRef}>
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold">
                        <i className={`bi ${activeTab === 'receivables' ? 'bi-person-check' : 'bi-truck'} me-2`}></i>
                        {activeTab === 'receivables' ? 'قائمة العملاء المدينين' : 'قائمة الموردين الدائنين'}
                        <small className="text-muted ms-2">({filteredData.length} سجل)</small>
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredData.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-emoji-smile fs-1 text-success d-block mb-3"></i>
                            <p className="text-muted fs-5">
                                {searchTerm
                                    ? 'لا توجد نتائج للبحث'
                                    : activeTab === 'receivables'
                                        ? 'لا يوجد عملاء مدينين 🎉'
                                        : 'لا يوجد موردين دائنين 🎉'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th>الاسم</th>
                                        <th>الهاتف</th>
                                        <th className="text-center">إجمالي العمليات</th>
                                        <th className="text-center">المدفوع/المستلم</th>
                                        <th className="text-center">المبلغ المستحق</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold text-muted">{index + 1}</td>
                                            <td>
                                                <i className={`bi ${activeTab === 'receivables' ? 'bi-person' : 'bi-truck'} me-2 text-primary`}></i>
                                                <strong>{item.name}</strong>
                                            </td>
                                            <td>
                                                {item.phone ? (
                                                    <a href={`tel:${item.phone}`} className="text-decoration-none">
                                                        <i className="bi bi-telephone me-1"></i>
                                                        {item.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {formatCurrency(item.total_amount || item.total_sales || item.total_purchases)}
                                            </td>
                                            <td className="text-center text-success">
                                                {formatCurrency(item.paid_amount || item.total_received || item.total_paid)}
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${activeTab === 'receivables' ? 'bg-warning text-dark' : 'bg-danger'} fs-6 px-3 py-2`}>
                                                    {formatCurrency(item.balance_due)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => navigate(`/contacts/${item.contact_id || index}`)}
                                                        title="كشف الحساب"
                                                    >
                                                        <i className="bi bi-file-text"></i>
                                                    </button>
                                                    {item.phone && (
                                                        <a
                                                            href={`https://wa.me/${item.phone.replace(/\D/g, '').startsWith('01') ? '2' + item.phone.replace(/\D/g, '') : item.phone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-outline-success"
                                                            title="تواصل عبر واتساب"
                                                        >
                                                            <i className="bi bi-whatsapp"></i>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-dark">
                                    <tr>
                                        <td colSpan="5" className="text-end fw-bold">الإجمالي:</td>
                                        <td className="text-center">
                                            <span className="badge bg-light text-dark fs-6 px-3 py-2">
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .btn, .nav-tabs, .input-group, .dropdown { display: none !important; }
                    .card { box-shadow: none !important; }
                    .table { font-size: 12px; }
                }
            `}</style>
        </div>
    );
}

export default DebtorsView;
