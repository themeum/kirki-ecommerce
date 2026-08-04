import { z } from 'zod';

import { numberOrNull, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductAddCategoryFormShape = z.object({
  name: required(z.string().default(''), __('Name is required', 'kirki-ecommerce')),
  parent_id: numberOrNull(),
});

export const ProductAddCategoryFormSchema = prepareFormSchema(ProductAddCategoryFormShape).transform((values) => ({
  name: values.name,
  parent_id: values.parent_id,
}));

export type ProductAddCategoryFormInput = z.input<typeof ProductAddCategoryFormSchema>;

export type ProductAddCategoryFormPayload = z.output<typeof ProductAddCategoryFormSchema>;
