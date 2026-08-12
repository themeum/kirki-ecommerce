import { z } from 'zod';

import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const BrandFormShape = z.object({
  name: required(z.string().max(255).default(''), __('Name is required', 'kirki-ecommerce')),
  slug: z.string().nullish(),
  description: z.string().nullish().default(''),
  logo: mediaId(),
});

const BrandFormSchema = prepareFormSchema(BrandFormShape).transform((values) => ({
  name: values.name,
  slug: values.slug,
  description: values.description || null,
  logo: values.logo,
}));

type BrandFormInput = z.input<typeof BrandFormSchema>;

type BrandFormPayload = z.output<typeof BrandFormSchema>;

export { type BrandFormInput, type BrandFormPayload, BrandFormSchema };
