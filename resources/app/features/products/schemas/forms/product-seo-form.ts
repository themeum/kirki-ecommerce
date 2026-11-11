import { z } from 'zod';

import { mediaId } from '@/libs/zod';

export const ProductSeoFormSchema = z.object({
  seo_title: z.string().nullish().default(''),
  seo_description: z.string().nullish().default(''),
  og_title: z.string().nullish().default(''),
  og_description: z.string().nullish().default(''),
  og_image: mediaId(),
});
