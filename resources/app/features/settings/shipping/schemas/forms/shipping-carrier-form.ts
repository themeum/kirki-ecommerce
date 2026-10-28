import { z } from 'zod';

import { getTrackingTemplateError } from '@/features/settings/shipping/lib/shipping-carrier-url';
import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ShippingCarrierFormShape = z.object({
  name: required(
    z.string().trim().max(100).default(''),
    __('Carrier name is required', 'kirki-ecommerce'),
  ),
  tracking_url: required(
    z.string().trim().default(''),
    __('URL is required', 'kirki-ecommerce'),
  ).refine(
    (value) => !value || getTrackingTemplateError(value) === null,
    (value) => ({ message: getTrackingTemplateError(value ?? '') ?? '' }),
  ),
  logo: mediaId(),
});

export const ShippingCarrierFormSchema = prepareFormSchema(ShippingCarrierFormShape).transform(
  (values) => ({
    name: values.name,
    tracking_url: values.tracking_url,
    logo: typeof values.logo === 'object' && values.logo !== null ? values.logo.id : values.logo,
  }),
);

export type ShippingCarrierFormInput = z.input<typeof ShippingCarrierFormSchema>;

export type ShippingCarrierFormPayload = z.output<typeof ShippingCarrierFormSchema>;
