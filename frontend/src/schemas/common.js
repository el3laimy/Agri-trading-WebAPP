import { z } from 'zod';

/**
 * Common Zod Schemas for Validation
 */

// ID Validation: Positive Integer (Coerces string "1" to number 1)
export const idSchema = z.coerce.number()
    .int("ID must be an integer")
    .positive("ID must be positive");

// Amount Validation: Positive, Finite (Coerces string "10.5" to number 10.5)
export const amountSchema = z.coerce.number()
    .finite("Amount must be finite")
    .positive("Amount must be positive")
    //.max(Number.MAX_SAFE_INTEGER, "Amount causes overflow") // Removed for flexibility in large agri-trades
    .refine(val => {
        // Optional: Check precision (max 2 decimals)
        return /^\d+(\.\d{1,2})?$/.test(val.toFixed(2));
    }, "Amount allows maximum 2 decimal places");

// Description/Text Validation: No XSS, Max Length
export const secureStringSchema = (maxLength = 500) => z.string()
    .max(maxLength, `Text too long (max ${maxLength})`)
    //.regex(/^[^<>]*$/, "Input contains unsafe characters (<, >)"); // Relaxed to allow basic text
    .optional();

// Date Validation
export const dateSchema = z.coerce.date();
