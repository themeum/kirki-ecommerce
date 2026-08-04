import { z } from 'zod';

import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const CollectionFormShape = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  slug: required(z.string().default(''), __('Slug is required', 'kirki-ecommerce')),
  description: z.string().nullish().default(''),
  banner: mediaId(),
  seo_title: z.string().nullish().default(''),
  seo_description: z.string().nullish().default(''),
});

const CollectionFormSchema = prepareFormSchema(CollectionFormShape).transform((values) => ({
  title: values.title,
  slug: values.slug,
  description: values.description || null,
  banner: values.banner,
  seo_title: values.seo_title || null,
  seo_description: values.seo_description || null,
}));

type CollectionFormInput = z.input<typeof CollectionFormSchema>;

type CollectionFormPayload = z.output<typeof CollectionFormSchema>;

export { CollectionFormSchema, type CollectionFormInput, type CollectionFormPayload };
