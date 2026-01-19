import { z } from 'zod';
import { amountSchema, secureStringSchema, idSchema, dateSchema } from './common';

export const BasePurchaseSchema = z.object({
    cropId: idSchema,
    supplierId: idSchema,
    quantity_kg: amountSchema,
    unit_price: amountSchema,
    total_cost: amountSchema,
    amount_paid: z.number()
        .nonnegative()
        .finite()
        .max(Number.MAX_SAFE_INTEGER)
        .refine(val => /^\d+(\.\d{1,2})?$/.test(val.toString()), "Amount allows maximum 2 decimal places"),
    purchase_date: dateSchema,
    notes: secureStringSchema(500).optional(),
});

export const PurchaseSchema = BasePurchaseSchema.refine(data => {
    // Logic: Paid amount cannot exceed Total Cost
    return data.amount_paid <= data.total_cost;
}, {
    message: "Amount paid cannot exceed total cost",
    path: ["amount_paid"]
});
