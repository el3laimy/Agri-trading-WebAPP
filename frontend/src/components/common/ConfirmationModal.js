/**
 * ConfirmationModal - مكون تأكيد موحد لاستبدال window.confirm
 * يوفر تجربة مستخدم أفضل مع تصميم متسق
 */
import React from 'react';

const ConfirmationModal = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'تأكيد العملية',
    message = 'هل أنت متأكد من هذا الإجراء؟',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    variant = 'danger', // 'danger' | 'warning' | 'info'
    isLoading = false
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bi-exclamation-triangle-fill',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            confirmBtn: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
        },
        warning: {
            icon: 'bi-exclamation-circle-fill',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
        },
        info: {
            icon: 'bi-info-circle-fill',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            confirmBtn: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        }
    };

    const style = variantStyles[variant] || variantStyles.danger;

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
                    onClick={onCancel}
                />

                {/* Modal */}
                <div className="inline-block align-bottom lg-card text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full animate-fade-in-scale">
                    <div className="p-6">
                        {/* Icon & Title */}
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <i className={`bi ${style.icon} text-2xl ${style.iconColor}`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 lg-card-footer flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="lg-btn lg-btn-secondary px-5 py-2.5"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 ${style.confirmBtn}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري التنفيذ...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg" />
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
