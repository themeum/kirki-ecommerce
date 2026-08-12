import { z } from 'zod';

import { prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

const VariationValueFormShape = z.object({
  value: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  color: requiredWhen(
    z.string().nullish(),
    (values) => values.type === 'color' && !values.color,
    __('Color is required', 'kirki-ecommerce'),
  ),
  type: z.string().nullish(),
  attribute_id: z.number().optional(),
  value_id: z.number().optional(),
});

export const VariationValueFormSchema = prepareFormSchema(VariationValueFormShape).transform((values) => ({
  attribute_id: values.attribute_id!,
  value: values.value,
  color: values.type === 'color' ? values.color || null : null,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 0 is not a valid value_id, so it has to collapse to undefined like a missing one
  value_id: values.value_id || undefined,
}));

export type VariationValueFormInput = z.input<typeof VariationValueFormSchema>;

export type VariationValueFormPayload = z.output<typeof VariationValueFormSchema>;
