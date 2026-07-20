import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const SchemaProfileFormSchema = z.object({
  name: requiredString(__('Schema name cannot be empty', 'kirki-ecommerce')),
  schema: z.record(z.array(z.string())).refine(
    (value) => Object.keys(value).length > 0,
    {
      message: __('Select at least one schema field', 'kirki-ecommerce'),
    },
  ),
  is_default: z.boolean().optional(),
});

export type SchemaProfileFormValues = z.infer<typeof SchemaProfileFormSchema>;
