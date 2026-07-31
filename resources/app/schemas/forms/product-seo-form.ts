import { z } from 'zod';

import { optionalNullableString } from '@/schemas/forms/shared/validators';
import { MediaRefSchema } from '@/schemas/shared/media';

export const ProductSeoFormSchema = z.object({
  seo_title: optionalNullableString(),
  seo_description: optionalNullableString(),
  llm_instructions: optionalNullableString(),
  og_title: optionalNullableString(),
  og_description: optionalNullableString(),
  og_image: MediaRefSchema.nullable().optional(),
  schema_id: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
});
