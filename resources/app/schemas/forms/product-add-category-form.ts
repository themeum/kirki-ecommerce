import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ProductAddCategoryFormSchema = z.object({
  name: requiredString(__('Name is required', 'kirki-ecommerce')),
  parent_id: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
});

export type ProductAddCategoryFormValues = z.infer<
  typeof ProductAddCategoryFormSchema
>;
