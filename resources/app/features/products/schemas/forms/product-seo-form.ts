import { z } from 'zod';

import { mediaId, numberOrNull } from '@/libs/zod';

export const ProductSeoFormSchema = z.object({
  seo_title: z.string().nullish().default(''),
  seo_description: z.string().nullish().default(''),
  llm_instructions: z.string().nullish().default(''),
  og_title: z.string().nullish().default(''),
  og_description: z.string().nullish().default(''),
  og_image: mediaId(),
  schema_id: numberOrNull(),
});
