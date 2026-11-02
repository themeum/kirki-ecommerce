import { z } from 'zod';

import { isEmptyValue, prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductVariationPopoverFormShape = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  requires_color: z.boolean().optional(),
  color: requiredWhen(
    z.string().default(''),
    (values) => values.requires_color !== false && isEmptyValue(typeof values.color === 'string' ? values.color.trim() : values.color),
    __('Color is required', 'kirki-ecommerce'),
  ),
});

/** `value` always mirrors `title` — there is no separate input for it. */
export const ProductVariationPopoverFormSchema = prepareFormSchema(ProductVariationPopoverFormShape).transform((values) => ({
  title: values.title,
  value: values.title,
  color: values.requires_color === false ? '' : values.color,
}));

export type ProductVariationPopoverFormInput = z.input<typeof ProductVariationPopoverFormSchema>;

export type ProductVariationPopoverFormPayload = z.output<typeof ProductVariationPopoverFormSchema>;
