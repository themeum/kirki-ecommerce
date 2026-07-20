import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const VariationValueFormSchema = z
  .object({
    value: requiredString(__('Title is required', 'kirki-ecommerce')),
    color: z.string().optional().nullable(),
    type: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'color' && !data.color) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: __('Color is required', 'kirki-ecommerce'),
        path: ['color'],
      });
    }
  });

export type VariationValueFormValues = z.infer<typeof VariationValueFormSchema>;
