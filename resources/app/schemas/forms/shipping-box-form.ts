import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const dimension = (defaultValue: number) => z.union([z.string(), z.number()]).default(defaultValue);

const ShippingBoxFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  length: dimension(120),
  width: dimension(80),
  height: dimension(80),
  unit: z.enum(['cm', 'in']).default('in'),
  is_default: z.boolean().default(false),
});

export const ShippingBoxFormSchema = prepareFormSchema(ShippingBoxFormShape).transform((values) => ({
  name: values.name,
  length: Number(values.length),
  width: Number(values.width),
  height: Number(values.height),
  unit: values.unit,
  is_default: values.is_default,
}));

export type ShippingBoxFormInput = z.input<typeof ShippingBoxFormSchema>;

export type ShippingBoxFormPayload = z.output<typeof ShippingBoxFormSchema>;
