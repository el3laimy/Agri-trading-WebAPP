import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as backupApi from '../api/backup';
import Sidebar from '../components/Sidebar';
import {
    FaDatabase, FaDownload, FaUpload, FaTrash, FaUndo,
    FaPlus, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';

const BackupManagement = () => {
    const { token, user } = useAuth();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'restore'|'delete', filename: '' }
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadBackups();
    }, [token]);

    const loadBackups = async () => {
        setLoading(true);
        try {
            const data = await backupApi.getBackups(token);
            setBackups(data);
            setError(null);
        } catch (err) {
            setError("فشل تحميل قائمة النسخ الاحتياطية");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setLoading(true);
        try {
            await backupApi.createBackup(token);
            setSuccess("تم إنشاء النسخة الاحتياطية بنجاح");
            await loadBackups();
        } catch (err) {
            setError("فشل إنشاء النسخة الاحتياطية");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (filename) => {
        setLoading(true);
        try {
            await backupApi.restoreBackup(token, filename);
            setSuccess("تم استعادة النظام بنجاح. يرجى إعادة تحميل الصفحة.");
            setConfirmAction(null);
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setError("فشل استعادة النظام");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename) => {
        setLoading(true);
        try {
            await backupApi.deleteBackup(token, filename);
            setSuccess("تم حذف ملف النسخة الاحتياطية");
            setConfirmAction(null);
            await loadBackups();
        } catch (err) {
            setError("فشل حذف الملف");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            await backupApi.uploadBackup(token, file);
            setSuccess("تم رفع الملف بنجاح");
            await loadBackups();
        } catch (err) {
            setError("فشل رفع الملف. تأكد من أنه ملف .db صالح");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (filename) => {
        const url = backupApi.getDownloadUrl(filename);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // تحويل الحجم إلى صيغة مقروءة
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('en-US');
    };

    return (
        <div className="flex h-screen bg-gray-50 direction-rtl">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <FaDatabase className="text-green-600" />
                            إدارة النسخ الاحتياطي
                        </h1>
                        <p className="text-gray-600 mt-2">
                            إنشاء واستعادة نسخ احتياطية لقاعدة البيانات لضمان سلامة المعلومات
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <label className="btn-secondary cursor-pointer flex items-center gap-2">
                            <FaUpload />
                            <span>رفع ملف</span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".db"
                                onChange={handleUpload}
                                disabled={uploading || loading}
                            />
                        </label>
                        <button
                            onClick={handleCreateBackup}
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            <FaPlus />
                            <span>نسخة جديدة</span>
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm flex items-center justify-between">
                        <div className="flex items-center">
                            <FaExclamationTriangle className="ml-2" />
                            <p>{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-700 font-bold">&times;</button>
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border-r-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm flex items-center">
                        <FaCheckCircle className="ml-2" />
                        <p>{success}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">سجل النسخ الاحتياطية</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="p-4">اسم الملف</th>
                                    <th className="p-4">تاريخ الإنشاء</th>
                                    <th className="p-4">الحجم</th>
                                    <th className="p-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && backups.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            جاري التحميل...
                                        </td>
                                    </tr>
                                ) : backups.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            لا توجد نسخ احتياطية حتى الآن
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((backup) => (
                                        <tr key={backup.filename} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-800 ltr-text text-right" dir="ltr">
                                                {backup.filename}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {formatDate(backup.created_at)}
                                            </td>
                                            <td className="p-4 text-gray-600 dir-ltr text-right">
                                                {formatSize(backup.size)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownload(backup.filename)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="تحميل"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'restore', filename: backup.filename })}
                                                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                                        title="استعادة"
                                                    >
                                                        <FaUndo />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'delete', filename: backup.filename })}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="حذف"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal التأكيد */}
                {confirmAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4 text-amber-600">
                                <FaExclamationTriangle className="text-3xl" />
                                <h3 className="text-xl font-bold text-gray-800">تأكيد الإجراء</h3>
                            </div>

                            <p className="text-gray-600 mb-6">
                                {confirmAction.type === 'restore'
                                    ? `هل أنت متأكد من رغبتك في استعادة النظام من النسخة "${confirmAction.filename}"؟ سيتم فقدان أي بيانات تم إضافتها بعد تاريخ هذه النسخة.`
                                    : `هل أنت متأكد من حذف ملف النسخة الاحتياطية "${confirmAction.filename}"؟ لا يمكن التراجع عن هذا الإجراء.`
                                }
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={() => confirmAction.type === 'restore'
                                        ? handleRestore(confirmAction.filename)
                                        : handleDelete(confirmAction.filename)
                                    }
                                    className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmAction.type === 'restore'
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {confirmAction.type === 'restore' ? 'تأكيد الاستعادة' : 'تأكيد الحذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackupManagement;
