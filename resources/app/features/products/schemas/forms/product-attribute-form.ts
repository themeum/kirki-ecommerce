import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductAttributeValueFormShape = z.object({
  id: z.number().optional(),
  value: z.union([z.number(), z.string()]).optional(),
  title: z.string().nullish().default(''),
  color: z.string().nullish(),
});

/** Renames the multi-select's `value`/`title` pair to the attribute value payload's `id`/`value`. */
export const ProductAttributeValueSchema = ProductAttributeValueFormShape.transform((item) => ({
  id: item.value as number,
  value: item.title || '',
  color: item.color || undefined,
}));

export type ProductAttributeValueInput = z.input<typeof ProductAttributeValueSchema>;

export type ProductAttributeValuePayload = z.output<typeof ProductAttributeValueSchema>;

const ProductAttributeFormShape = z.object({
  id: z.number({
    required_error: __('Select a variation name', 'kirki-ecommerce'),
  }),
  name: required(z.string().default(''), __('Variation name is required', 'kirki-ecommerce')),
  slug: z.string().nullish(),
  type: z.string().nullish(),
  values: z
    .array(ProductAttributeValueFormShape)
    .min(1, __('Add at least one variation value', 'kirki-ecommerce')),
});

export const ProductAttributeFormSchema = prepareFormSchema(ProductAttributeFormShape).transform((values) => ({
  id: values.id,
  name: values.name,
  values: values.values.map((item) => ({
    id: item.value as number,
    value: item.title || '',
    color: item.color || undefined,
  })),
}));

export type ProductAttributeFormInput = z.input<typeof ProductAttributeFormSchema>;

export type ProductAttributeFormPayload = z.output<typeof ProductAttributeFormSchema>;
