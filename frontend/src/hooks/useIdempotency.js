import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * useIdempotency Hook
 * 
 * يوفر Idempotency Keys لمنع تكرار العمليات المالية عند:
 * - النقر المتعدد على زر الحفظ
 * - إعادة الإرسال بسبب مشاكل الشبكة
 * - إعادة تحميل الصفحة أثناء الإرسال
 * 
 * @returns {Object} { getIdempotencyKey, resetKey, isSubmitting, withIdempotency }
 */
export const useIdempotency = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentKeyRef = useRef(null);
    const usedKeysRef = useRef(new Set());

    /**
     * توليد مفتاح جديد للعملية
     * يُستخدم مرة واحدة فقط لكل عملية
     */
    const getIdempotencyKey = useCallback(() => {
        if (!currentKeyRef.current) {
            currentKeyRef.current = uuidv4();
        }
        return currentKeyRef.current;
    }, []);

    /**
     * إعادة تعيين المفتاح بعد نجاح العملية
     */
    const resetKey = useCallback(() => {
        if (currentKeyRef.current) {
            usedKeysRef.current.add(currentKeyRef.current);
        }
        currentKeyRef.current = null;
    }, []);

    /**
     * التحقق مما إذا كان المفتاح قد استُخدم من قبل
     */
    const isKeyUsed = useCallback((key) => {
        return usedKeysRef.current.has(key);
    }, []);

    /**
     * تغليف دالة الإرسال مع حماية Idempotency
     * 
     * @param {Function} submitFn - دالة الإرسال الأصلية
     * @returns {Function} - دالة محمية
     */
    const withIdempotency = useCallback((submitFn) => {
        return async (...args) => {
            // منع الإرسال المتكرر
            if (isSubmitting) {
                console.warn('[Idempotency] تم رفض الإرسال: عملية جارية بالفعل');
                return { success: false, reason: 'already_submitting' };
            }

            const key = getIdempotencyKey();

            // التحقق من عدم استخدام المفتاح سابقاً
            if (isKeyUsed(key)) {
                console.warn('[Idempotency] تم رفض الإرسال: المفتاح مستخدم سابقاً');
                resetKey();
                return { success: false, reason: 'key_already_used' };
            }

            setIsSubmitting(true);

            try {
                // إضافة المفتاح للـ headers
                const result = await submitFn(...args, { idempotencyKey: key });
                resetKey();
                return { success: true, data: result };
            } catch (error) {
                // عند الخطأ، نحتفظ بالمفتاح للمحاولة مرة أخرى
                // إلا إذا كان الخطأ 409 (تكرار)
                if (error.response?.status === 409) {
                    resetKey();
                    return { success: false, reason: 'duplicate_request', error };
                }
                throw error;
            } finally {
                setIsSubmitting(false);
            }
        };
    }, [isSubmitting, getIdempotencyKey, isKeyUsed, resetKey]);

    return {
        getIdempotencyKey,
        resetKey,
        isSubmitting,
        withIdempotency,
        isKeyUsed
    };
};

/**
 * Hook مبسط للنماذج - يوفر حماية من الإرسال المتكرر فقط
 * بدون الحاجة لـ UUID (للاستخدام في الواجهة فقط)
 */
export const useFormSubmission = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    const DEBOUNCE_MS = 1000; // منع الإرسال المتكرر خلال ثانية

    const submitWithGuard = useCallback(async (submitFn) => {
        const now = Date.now();

        // منع الإرسال المتكرر
        if (isSubmitting) {
            console.warn('[FormSubmission] تم رفض: عملية جارية');
            return;
        }

        // Debounce - منع النقر السريع المتكرر
        if (now - lastSubmitTime < DEBOUNCE_MS) {
            console.warn('[FormSubmission] تم رفض: نقر سريع متكرر');
            return;
        }

        setIsSubmitting(true);
        setLastSubmitTime(now);

        try {
            await submitFn();
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, lastSubmitTime]);

    return {
        isSubmitting,
        submitWithGuard
    };
};

export default useIdempotency;
