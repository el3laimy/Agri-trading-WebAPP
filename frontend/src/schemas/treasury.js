import { z } from 'zod';
import { amountSchema, secureStringSchema, idSchema, dateSchema } from './common';

export const CashReceiptSchema = z.object({
    amount: amountSchema,
    description: secureStringSchema(200).optional(),
    receipt_date: dateSchema.optional(),
    treasury_id: idSchema.optional(),
    contact_id: idSchema
});

export const CashPaymentSchema = z.object({
    amount: amountSchema,
    description: secureStringSchema(200).optional(),
    payment_date: dateSchema.optional(),
    treasury_id: idSchema.optional(),
    contact_id: idSchema
});

export const QuickExpenseSchema = z.object({
    amount: amountSchema,
    description: secureStringSchema(200).optional(),
    expense_date: dateSchema.optional(),
    treasury_id: idSchema.optional()
});
