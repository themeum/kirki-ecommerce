import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ProductAdditionalInfoFormShape = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  description: required(z.string().default(''), __('Description is required', 'kirki-ecommerce')),
});

export const ProductAdditionalInfoFormSchema = prepareFormSchema(ProductAdditionalInfoFormShape).transform((values) => ({
  title: values.title,
  description: values.description,
}));

export type ProductAdditionalInfoFormInput = z.input<typeof ProductAdditionalInfoFormSchema>;

export type ProductAdditionalInfoFormPayload = z.output<typeof ProductAdditionalInfoFormSchema>;
