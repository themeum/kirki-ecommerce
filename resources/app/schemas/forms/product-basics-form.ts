import { z } from 'zod';

import { optionalNullableString, requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ProductBasicsFormSchema = z.object({
  title: requiredString(__('Title is required', 'kirki-ecommerce')),
  ribbon: optionalNullableString(),
  slug: optionalNullableString(),
  short_description: optionalNullableString(),
  description: optionalNullableString(),
});
