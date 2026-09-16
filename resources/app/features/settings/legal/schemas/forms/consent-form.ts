import { z } from 'zod';

import {
  CONSENT_METHODS,
  type ConsentLocation,
} from '@/features/settings/legal/schemas/catalog/legal';
import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ConsentFormShape = z.object({
  title: required(z.string().default(''), __('Consent title is required', 'kirki-ecommerce')),
  show_on_signup: z.boolean().default(false),
  show_on_login: z.boolean().default(false),
  show_on_checkout: z.boolean().default(true),
  message: required(z.string().default(''), __('Consent message is required', 'kirki-ecommerce')),
  method: z.enum(CONSENT_METHODS).default('mandatory_checkbox'),
});

/**
 * The three booleans exist because `CheckboxField` binds a boolean and there
 * is no multi-checkbox field; they are flattened back into the `locations`
 * array the API stores.
 */
export const ConsentFormSchema = prepareFormSchema(ConsentFormShape)
  .superRefine((values, ctx) => {
    if (!values.show_on_signup && !values.show_on_login && !values.show_on_checkout) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['show_on_checkout'],
        message: __('Select at least one place to show this consent', 'kirki-ecommerce'),
      });
    }
  })
  .transform((values) => ({
    title: values.title,
    message: values.message,
    method: values.method,
    locations: [
      values.show_on_signup ? 'signup' : null,
      values.show_on_login ? 'login' : null,
      values.show_on_checkout ? 'checkout' : null,
    ].filter(Boolean) as ConsentLocation[],
  }));

export type ConsentFormInput = z.input<typeof ConsentFormSchema>;

export type ConsentFormPayload = z.output<typeof ConsentFormSchema>;
