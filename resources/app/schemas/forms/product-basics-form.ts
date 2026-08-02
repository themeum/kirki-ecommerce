import { z } from 'zod';

import { optionalNullableString, requiredString } from '@/schemas/forms/shared/validators';
import type { Product } from '@/types';
import { __ } from '@/wpi18n';

export const ProductBasicsFormSchema = z.object({
  title: requiredString(__('Title is required', 'kirki-ecommerce')),
  ribbon: optionalNullableString(),
  slug: optionalNullableString(),
  short_description: optionalNullableString(),
  description: optionalNullableString(),
});

export type ProductBasicsFormValues = z.infer<typeof ProductBasicsFormSchema>;

export const mapProductBasicsFromProduct = (
  product: Product,
): ProductBasicsFormValues => ({
  title: product.title ?? '',
  ribbon: product.ribbon ?? '',
  slug: product.slug ?? '',
  short_description: product.short_description ?? '',
  description: product.description ?? '',
});

export const productBasicsDefaultValues: ProductBasicsFormValues = {
  title: '',
  ribbon: '',
  slug: '',
  short_description: '',
  description: '',
};
