import React from 'react';

/**
 * مكون طباعة إيصال (قبض/صرف)
 */
export const PrintVoucher = ({ voucher, type = 'receipt' }) => {
    const isReceipt = type === 'receipt';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="print-voucher" style={{
            padding: '20px',
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
            maxWidth: '400px',
            margin: '0 auto',
            border: '2px solid #333'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: isReceipt ? '#28A745' : '#DC3545' }}>
                    {isReceipt ? 'إيصال قبض' : 'إيصال صرف'}
                </h3>
                <small>نظام المحاسبة الزراعية</small>
            </div>

            {/* Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '5px', fontWeight: 'bold' }}>رقم الإيصال:</td>
                        <td style={{ padding: '5px' }}>{voucher.voucher_id}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '5px', fontWeight: 'bold' }}>التاريخ:</td>
                        <td style={{ padding: '5px' }}>{formatDate(voucher.voucher_date)}</td>
                    </tr>
                    {voucher.contact_name && (
                        <tr>
                            <td style={{ padding: '5px', fontWeight: 'bold' }}>
                                {isReceipt ? 'استلمنا من:' : 'صرفنا إلى:'}
                            </td>
                            <td style={{ padding: '5px' }}>{voucher.contact_name}</td>
                        </tr>
                    )}
                    <tr>
                        <td style={{ padding: '5px', fontWeight: 'bold' }}>البيان:</td>
                        <td style={{ padding: '5px' }}>{voucher.description}</td>
                    </tr>
                </tbody>
            </table>

            {/* Amount */}
            <div style={{
                textAlign: 'center',
                margin: '20px 0',
                padding: '15px',
                backgroundColor: isReceipt ? '#D4EDDA' : '#F8D7DA',
                borderRadius: '8px'
            }}>
                <small style={{ display: 'block' }}>المبلغ</small>
                <h2 style={{ margin: 0, color: isReceipt ? '#28A745' : '#DC3545' }}>
                    {formatCurrency(voucher.amount)}
                </h2>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px dashed #333', paddingTop: '10px', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #333', marginTop: '40px', width: '100px' }}></div>
                        <small>المستلم</small>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #333', marginTop: '40px', width: '100px' }}></div>
                        <small>المسؤول</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * مكون طباعة فاتورة بيع
 */
export const PrintSaleInvoice = ({ sale, contact, crop, items = [] }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US');
    };

    return (
        <div className="print-invoice" style={{
            padding: '20px',
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '3px solid #1E5631',
                paddingBottom: '15px',
                marginBottom: '20px'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1E5631' }}>فاتورة بيع</h2>
                    <small>نظام المحاسبة الزراعية</small>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <strong>رقم الفاتورة: {sale.sale_id}</strong>
                    <br />
                    <small>التاريخ: {formatDate(sale.sale_date)}</small>
                </div>
            </div>

            {/* Customer Info */}
            <div style={{
                backgroundColor: '#F8F9FA',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <strong>معلومات العميل:</strong>
                <p style={{ margin: '5px 0 0' }}>
                    {contact?.name || 'عميل نقدي'}
                    {contact?.phone && ` - ${contact.phone}`}
                </p>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#1E5631', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'right' }}>المحصول</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>الكمية (كجم)</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>سعر الكيلو</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #DEE2E6' }}>
                        <td style={{ padding: '10px' }}>{crop?.crop_name || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{sale.quantity_sold_kg?.toLocaleString('en-US')}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{formatCurrency(sale.sale_price_per_kg)}</td>
                        <td style={{ padding: '10px', textAlign: 'left' }}>{formatCurrency(sale.total_sale_amount)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Totals */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '20px'
            }}>
                <table style={{ width: '300px' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '5px', fontWeight: 'bold' }}>الإجمالي:</td>
                            <td style={{ padding: '5px', textAlign: 'left' }}>{formatCurrency(sale.total_sale_amount)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '5px', fontWeight: 'bold' }}>المدفوع:</td>
                            <td style={{ padding: '5px', textAlign: 'left', color: '#28A745' }}>{formatCurrency(sale.amount_received)}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#FFF3CD' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>المتبقي:</td>
                            <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#DC3545' }}>
                                {formatCurrency(sale.total_sale_amount - sale.amount_received)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{
                borderTop: '2px solid #DEE2E6',
                paddingTop: '15px',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', marginTop: '50px', width: '120px' }}></div>
                    <small>توقيع العميل</small>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', marginTop: '50px', width: '120px' }}></div>
                    <small>توقيع البائع</small>
                </div>
            </div>

            {/* Print Date */}
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#6C757D', fontSize: '11px' }}>
                تاريخ الطباعة: {new Date().toLocaleString('en-US')}
            </div>
        </div>
    );
};

/**
 * دالة طباعة عامة
 */
export const printComponent = (componentId) => {
    const printContent = document.getElementById(componentId);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>طباعة</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Cairo', sans-serif; direction: rtl; }
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${printContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

/**
 * تصدير البيانات كـ CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

/**
 * تصدير البيانات كـ JSON
 */
export const exportToJSON = (data, filename = 'export.json') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

export default {
    PrintVoucher,
    PrintSaleInvoice,
    printComponent,
    exportToCSV,
    exportToJSON
};
