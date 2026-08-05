import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TagFormShape = z.object({
  name: required(z.string().default(''), __('Name is required', 'kirki-ecommerce')),
  slug: required(z.string().default(''), __('Slug is required', 'kirki-ecommerce')),
  description: z.string().nullish().default(''),
});

const TagFormSchema = prepareFormSchema(TagFormShape).transform((values) => ({
  name: values.name,
  slug: values.slug,
  description: values.description || null,
}));

type TagFormInput = z.input<typeof TagFormSchema>;

type TagFormPayload = z.output<typeof TagFormSchema>;

export { TagFormSchema, type TagFormInput, type TagFormPayload };
