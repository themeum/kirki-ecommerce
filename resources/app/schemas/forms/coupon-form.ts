import { z } from 'zod';

import {
  CouponDiscountTargetSchema,
  CouponDiscountTypeSchema,
  CouponDiscountValueTypeSchema,
  CouponMethodSchema,
} from '@/schemas/catalog/coupon';
import { __ } from '@/wpi18n';

export const CouponFormSchema = z
  .object({
    method: CouponMethodSchema.default('code'),
    title: z.string(),
    code: z.string().optional(),
    discount_type: CouponDiscountTypeSchema.default('amount-off'),
    discount_target: CouponDiscountTargetSchema.default('order'),
    discount_value_type: CouponDiscountValueTypeSchema.optional().nullable(),
    discount_amount: z.string().optional(),
    start_date: z.string().optional(),
    start_time: z.string().optional(),
    has_end_datetime: z.boolean().default(false),
    end_date: z.string().optional(),
    end_time: z.string().optional(),
    has_usage_limit: z.boolean().default(false),
    usage_limit: z.string().optional(),
    has_customer_limit: z.boolean().default(false),
    customer_limit: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.method === 'code' && !values.code?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: __('Coupon code is required', 'kirki-ecommerce'),
      });
    }

    if (values.discount_type === 'amount-off') {
      if (!values.discount_value_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discount_value_type'],
          message: __('Discount type is required', 'kirki-ecommerce'),
        });
      }

      const amount = Number(values.discount_amount);

      if (!values.discount_amount?.trim() || Number.isNaN(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discount_amount'],
          message: __('Enter a valid discount value', 'kirki-ecommerce'),
        });
      }
    }

    if (values.has_end_datetime) {
      if (!values.end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: __('End date is required', 'kirki-ecommerce'),
        });
      }

      if (!values.end_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_time'],
          message: __('End time is required', 'kirki-ecommerce'),
        });
      }
    }

    if (values.has_usage_limit) {
      const usageLimit = Number(values.usage_limit);

      if (!values.usage_limit?.trim() || Number.isNaN(usageLimit) || usageLimit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['usage_limit'],
          message: __('Enter a valid usage limit', 'kirki-ecommerce'),
        });
      }
    }

    if (values.has_customer_limit) {
      const customerLimit = Number(values.customer_limit);

      if (!values.customer_limit?.trim() || Number.isNaN(customerLimit) || customerLimit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customer_limit'],
          message: __('Enter a valid customer usage limit', 'kirki-ecommerce'),
        });
      }
    }
  });

export type CouponFormValues = z.input<typeof CouponFormSchema>;
export type CouponFormOutput = z.output<typeof CouponFormSchema>;
