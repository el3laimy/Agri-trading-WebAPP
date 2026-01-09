import React, { useState, useEffect } from 'react';
import { getSeasons, deleteSeason } from '../api/seasons';
import SeasonForm from '../components/SeasonForm';

const SeasonManagement = () => {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [seasonToDelete, setSeasonToDelete] = useState(null);

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        try {
            setLoading(true);
            const data = await getSeasons();
            setSeasons(data);
            setError(null);
        } catch (err) {
            setError('فشل في تحميل المواسم');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedSeason(null);
        setShowForm(true);
    };

    const handleEdit = (season) => {
        setSelectedSeason(season);
        setShowForm(true);
    };

    const handleDeleteClick = (season) => {
        setSeasonToDelete(season);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!seasonToDelete) return;

        try {
            await deleteSeason(seasonToDelete.season_id);
            fetchSeasons();
            setShowDeleteModal(false);
            setSeasonToDelete(null);
        } catch (err) {
            alert('فشل في حذف الموسم');
            console.error(err);
            setShowDeleteModal(false);
            setSeasonToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSeasonToDelete(null);
    };

    const handleFormClose = (shouldRefresh) => {
        setShowForm(false);
        setSelectedSeason(null);
        if (shouldRefresh) {
            fetchSeasons();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return { className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', text: 'نشط' };
            case 'UPCOMING':
                return { className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', text: 'قادم' };
            case 'COMPLETED':
                return { className: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-slate-600', text: 'مكتمل' };
            default:
                return { className: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-slate-600', text: status };
        }
    };

    const filteredSeasons = seasons.filter(season =>
        season.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 sm:px-6 flex items-center border-b border-red-100 dark:border-red-900/30 transition-colors">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400"></i>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                    <h3 className="text-lg leading-6 font-medium text-red-800 dark:text-red-400" id="modal-title">تأكيد الحذف</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    هل أنت متأكد من حذف الموسم <span className="font-bold text-gray-800 dark:text-gray-100">"{seasonToDelete?.name}"</span>؟
                                </p>
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex items-start gap-2 transition-colors">
                                    <i className="bi bi-exclamation-circle-fill text-amber-500 dark:text-amber-400 mt-0.5"></i>
                                    <div className="text-sm text-amber-800 dark:text-amber-300">
                                        <span className="font-bold">تحذير:</span> لا يمكن التراجع عن هذا الإجراء.
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 transition-colors">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors"
                                    onClick={confirmDelete}
                                >
                                    <i className="bi bi-trash"></i>
                                    حذف نهائياً
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                    onClick={cancelDelete}
                                >
                                    <i className="bi bi-x-lg"></i>
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center text-right">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                                <i className="bi bi-calendar-range"></i>
                            </span>
                            إدارة المواسم
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 ms-12">تتبع المواسم الزراعية وحالاتها</p>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in text-right">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                    <div className="flex-1">
                        <p className="text-red-800 dark:text-red-300 font-medium m-0">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {showForm && (
                <SeasonForm
                    season={selectedSeason}
                    onClose={handleFormClose}
                />
            )}

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 gap-4 text-right">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <i className="bi bi-search text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <input
                        type="text"
                        className="block w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 ps-10 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-slate-700 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="بحث عن موسم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="nav-link px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    onClick={handleAdd}
                >
                    <i className="bi bi-plus-lg"></i>
                    إضافة موسم جديد
                </button>
            </div>

            {/* Seasons Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden text-right">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex justify-between items-center">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center gap-2">
                        <i className="bi bi-list-ul text-emerald-600 dark:text-emerald-400"></i>
                        قائمة المواسم
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            {filteredSeasons.length}
                        </span>
                    </h5>
                </div>

                {filteredSeasons.length === 0 ? (
                    <div className="text-center py-12 transition-colors">
                        <div className="bg-gray-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <i className="bi bi-calendar-x text-4xl text-gray-300 dark:text-gray-500"></i>
                        </div>
                        <h6 className="text-gray-500 dark:text-gray-400 font-medium mb-2">لا توجد مواسم مسجلة</h6>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">قم بإضافة المواسم الزراعية للبدء</p>
                        <button
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            onClick={handleAdd}
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            إضافة أول موسم
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto text-right">
                        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">اسم الموسم</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">تاريخ البداية</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">تاريخ النهاية</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">الحالة</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-end">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 transition-colors">
                                {filteredSeasons.map((season) => {
                                    const statusBadge = getStatusBadge(season.status);
                                    return (
                                        <tr key={season.season_id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700">
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                                                        <i className="bi bi-calendar"></i>
                                                    </div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-100">{season.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-right">
                                                {new Date(season.start_date).toLocaleDateString('en-US')}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-right">
                                                {new Date(season.end_date).toLocaleDateString('en-US')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border transition-colors ${statusBadge.className}`}>
                                                    {statusBadge.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-end">
                                                <div className="flex justify-end gap-2 text-right">
                                                    <button
                                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                        onClick={() => handleEdit(season)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                        onClick={() => handleDeleteClick(season)}
                                                        title="حذف"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonManagement;
