import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div className="ReloadPrompt-container">
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 left-4 z-[10000] p-4 bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-2xl border border-slate-600 flex flex-col gap-3 animate-bounce-in max-w-sm" dir="rtl">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl pt-1">
                            {offlineReady ? <span>✅</span> : <span>🚀</span>}
                        </div>
                        <div className="flex-1">
                            <h6 className="font-bold mb-1">
                                {offlineReady ? 'التطبيق جاهز للعمل offline' : 'تحديث جديد متوفر'}
                            </h6>
                            <p className="text-sm text-slate-300">
                                {offlineReady
                                    ? 'يمكنك الآن استخدام التطبيق بدون اتصال بالإنترنت.'
                                    : 'نسخة جديدة متاحة، اضغط تحديث للترقية.'}
                            </p>
                        </div>
                    </div>
                    {needRefresh && (
                        <div className="flex gap-2 mr-auto mt-2">
                            <button
                                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-semibold transition-colors"
                                onClick={() => updateServiceWorker(true)}
                            >
                                تحديث الآن
                            </button>
                            <button
                                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                                onClick={close}
                            >
                                إغلاق
                            </button>
                        </div>
                    )}
                    {offlineReady && (
                        <button
                            className="mr-auto px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                            onClick={close}
                        >
                            حسناً
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ReloadPrompt;
