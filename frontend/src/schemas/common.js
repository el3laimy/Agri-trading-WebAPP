import { z } from 'zod';

/**
 * Common Zod Schemas for Validation
 */

// ID Validation: Positive Integer
export const idSchema = z.number()
    .int("ID must be an integer")
    .positive("ID must be positive");

// Amount Validation: Positive, Finite, Max Safe Integer
// Allows 0 if explicitly needed, but usually financial transactions are > 0.
// We'll use nonNegative for general, positive for strictly > 0.
export const amountSchema = z.number()
    .finite("Amount must be finite")
    .positive("Amount must be positive")
    .max(Number.MAX_SAFE_INTEGER, "Amount causes overflow")
    .refine(val => {
        // Optional: Check precision (max 2 decimals)
        // This regex checks for max 2 decimal places
        return /^\d+(\.\d{1,2})?$/.test(val.toString());
    }, "Amount allows maximum 2 decimal places");

// Description/Text Validation: No XSS, Max Length
export const secureStringSchema = (maxLength = 500) => z.string()
    .max(maxLength, `Text too long (max ${maxLength})`)
    .regex(/^[^<>]*$/, "Input contains unsafe characters (<, >)"); // Basic Anti-XSS

// Date Validation
export const dateSchema = z.coerce.date();
