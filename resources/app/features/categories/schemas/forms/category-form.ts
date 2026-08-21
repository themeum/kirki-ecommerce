import { z } from 'zod';

import { mediaId, numberOrNull, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const CategoryFormShape = z.object({
  name: required(z.string().default(''), __('Name is required', 'kirki-ecommerce')),
  slug: z.string().nullish(),
  description: z.string().nullish().default(''),
  parent_id: numberOrNull(),
  image: mediaId(),
  is_active: z.boolean().nullish(),
});

const CategoryFormSchema = prepareFormSchema(CategoryFormShape).transform((values) => ({
  name: values.name,
  slug: values.slug,
  description: values.description || null,
  parent_id: values.parent_id,
  image: values.image,
  is_active: values.is_active ?? null,
}));

type CategoryFormInput = z.input<typeof CategoryFormSchema>;

type CategoryFormPayload = z.output<typeof CategoryFormSchema>;

export { type CategoryFormInput, type CategoryFormPayload, CategoryFormSchema };
