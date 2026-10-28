import { z } from 'zod';

import { getTrackingTemplateError } from '@/features/settings';
import { prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const OTHER_CARRIER_VALUE = '__other__';

const asTrimmedText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const isOtherCarrier = (values: Record<string, unknown>) => values.carrier === OTHER_CARRIER_VALUE;

const getOtherUrlError = (values: Record<string, unknown>) =>
  getTrackingTemplateError(asTrimmedText(values.other_url));

const AddTrackingFormShape = z.object({
  carrier: required(z.string().default(''), __('Select a carrier', 'kirki-ecommerce')),
  tracking_number: required(
    z.string().trim().default(''),
    __('Tracking number is required', 'kirki-ecommerce'),
  ),
  other_name: requiredWhen(
    z.string().trim().default(''),
    (values) => isOtherCarrier(values) && !asTrimmedText(values.other_name),
    __('Carrier name is required', 'kirki-ecommerce'),
  ),
  other_url: requiredWhen(
    z.string().trim().default(''),
    (values) => isOtherCarrier(values) && getOtherUrlError(values) !== null,
    (values) => getOtherUrlError(values) ?? '',
  ),
});

export const AddTrackingFormSchema = prepareFormSchema(AddTrackingFormShape).transform((values) =>
  values.carrier === OTHER_CARRIER_VALUE
    ? {
        carrier: values.other_name,
        tracking_number: values.tracking_number,
        tracking_url: values.other_url,
      }
    : { carrier_id: values.carrier, tracking_number: values.tracking_number },
);

export type AddTrackingFormInput = z.input<typeof AddTrackingFormSchema>;

export type AddTrackingFormPayload = z.output<typeof AddTrackingFormSchema>;
