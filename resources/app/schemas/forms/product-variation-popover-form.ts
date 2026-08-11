import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductVariationPopoverFormShape = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  color: required(z.string().default(''), __('Color is required', 'kirki-ecommerce')),
});

/** `value` always mirrors `title` — there is no separate input for it. */
export const ProductVariationPopoverFormSchema = prepareFormSchema(ProductVariationPopoverFormShape).transform((values) => ({
  title: values.title,
  value: values.title,
  color: values.color,
}));

export type ProductVariationPopoverFormInput = z.input<typeof ProductVariationPopoverFormSchema>;

export type ProductVariationPopoverFormPayload = z.output<typeof ProductVariationPopoverFormSchema>;
