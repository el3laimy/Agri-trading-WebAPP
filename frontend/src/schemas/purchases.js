import { z } from 'zod';
import { amountSchema, secureStringSchema, idSchema, dateSchema } from './common';

export const BasePurchaseSchema = z.object({
    crop_id: idSchema,
    supplier_id: idSchema,
    quantity_kg: amountSchema,
    unit_price: amountSchema,
    total_cost: amountSchema.optional(), // Backend will calculate if not provided
    amount_paid: z.number()
        .nonnegative()
        .finite()
        .max(Number.MAX_SAFE_INTEGER)
        .refine(val => /^\d+(\.\d{1,2})?$/.test(val.toString()), "Amount allows maximum 2 decimal places")
        .optional()
        .default(0),
    purchase_date: dateSchema,
    notes: secureStringSchema(500).optional(),
    purchasing_pricing_unit: z.string().optional(),
    conversion_factor: z.number().optional(),
    gross_quantity: z.number().optional().nullable(),
    bag_count: z.number().optional(),
    tare_weight: z.number().optional(),
    calculation_formula: z.string().optional().nullable(),
});

export const PurchaseSchema = BasePurchaseSchema;

