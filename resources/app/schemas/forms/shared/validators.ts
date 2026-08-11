import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';
import { __ } from '@/wpi18n';

/**
 * @deprecated use `required(z.string().default(''), message)` from
 * `@/libs/zod` directly; kept only until every remaining consumer converts
 * to the canonical form-schema pattern (see design.md - Decision 6). This
 * builder is input===output on purpose, matching the 1-generic `useForm`
 * sites that still import it — switching it to `required()`'s nullish input
 * would break every one of them until they convert individually.
 */
const requiredString = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('This field is required', 'kirki-ecommerce'));

/**
 * @deprecated use `z.string().nullish().default('')` directly; kept only
 * until every remaining consumer is converted to the canonical form-schema
 * pattern.
 */
const optionalNullableString = () => z.string().optional().nullable();

/** @deprecated use `required(z.string().default(''), message)` directly once the form is converted. */
const slug = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('Slug is required', 'kirki-ecommerce'));

/** @deprecated use `required(z.string().default(''), message).pipe(z.string().email(...))` directly once the form is converted. */
const email = (message?: string) =>
  z
    .string()
    .min(1, message ?? __('Email is required', 'kirki-ecommerce'))
    .email(__('Please enter a valid email', 'kirki-ecommerce'));

const moneyAmount = MoneyAmountSchema;

export {
  email,
  moneyAmount,
  optionalNullableString,
  requiredString,
  slug,
};
