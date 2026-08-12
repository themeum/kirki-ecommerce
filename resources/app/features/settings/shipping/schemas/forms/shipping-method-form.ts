import { z } from 'zod';

import { isEmptyValue, numberOrNull, prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ShippingMethodTypeSchema = z.enum(['flat_rate', 'local_pickup', 'weight']);

const WeightRangeRowShape = z.object({
  from: required(numberOrNull(), __('From is required', 'kirki-ecommerce')),
  to: required(numberOrNull(), __('To is required', 'kirki-ecommerce')),
  base_amount: required(numberOrNull(), __('Rate is required', 'kirki-ecommerce')),
});

const ShippingMethodFormShape = z.object({
  type: ShippingMethodTypeSchema.default('flat_rate'),
  name: required(z.string().default(''), __('Method name is required', 'kirki-ecommerce')),
  description: z.string().nullish().default(null),

  base_amount: requiredWhen(
    numberOrNull(),
    (values) =>
      (values.type === 'flat_rate' || (values.type === 'local_pickup' && Boolean(values.has_fee))) &&
      isEmptyValue(values.base_amount),
    __('Amount is required', 'kirki-ecommerce'),
  ),
  is_taxable: z.boolean().default(false),

  address: z.string().nullish().default(null),
  has_fee: z.boolean().default(false),
  has_pick_time: z.boolean().default(false),
  pickup_time_start: z.string().nullish().default(null),
  pickup_time_end: z.string().nullish().default(null),

  ranges: requiredWhen(
    z.array(WeightRangeRowShape).default([]),
    (values) => values.type === 'weight' && isEmptyValue(values.ranges),
    __('Add at least one weight range', 'kirki-ecommerce'),
  ),
  is_free_shipping_enabled: z.boolean().default(false),
  base_free_shipping_min_amount: requiredWhen(
    numberOrNull(),
    (values) => values.type === 'weight' && Boolean(values.is_free_shipping_enabled) && isEmptyValue(values.base_free_shipping_min_amount),
    __('Amount is required', 'kirki-ecommerce'),
  ),
});

export const ShippingMethodFormSchema = prepareFormSchema(ShippingMethodFormShape).transform((values) => {
  const base = {
    name: values.name,
    description: values.description || null,
  };

  if (values.type === 'flat_rate') {
    return {
      ...base,
      type: values.type,
      base_amount: values.base_amount,
      is_taxable: values.is_taxable,
    };
  }

  if (values.type === 'local_pickup') {
    return {
      ...base,
      type: values.type,
      address: values.address || null,
      has_fee: values.has_fee,
      base_amount: values.has_fee ? values.base_amount : null,
      has_pick_time: values.has_pick_time,
      pickup_time_start: values.has_pick_time ? values.pickup_time_start || null : null,
      pickup_time_end: values.has_pick_time ? values.pickup_time_end || null : null,
    };
  }

  return {
    ...base,
    type: values.type,
    ranges: values.ranges,
    is_taxable: values.is_taxable,
    is_free_shipping_enabled: values.is_free_shipping_enabled,
    base_free_shipping_min_amount: values.is_free_shipping_enabled ? values.base_free_shipping_min_amount : null,
  };
});

export type ShippingMethodFormInput = z.input<typeof ShippingMethodFormSchema>;

export type ShippingMethodFormPayload = z.output<typeof ShippingMethodFormSchema>;
