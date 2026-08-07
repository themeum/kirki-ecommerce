import { z } from 'zod';

/**
 * Covers four surfaces that all return "a payment gateway" with different
 * subsets of fields: the list (`GET /payment-gateways`), the detail
 * (`GET /payment-gateways/:id`, which adds `settings`/`fields`/webhook info),
 * the installable list (`GET /payment-gateways/installable`, which adds
 * `is_installed` and omits `is_enabled`/`is_manual`), and the embedded form
 * inside `/settings/payment` (no `id`, `config` instead of `settings`). `id`
 * stays optional because the settings-embedded shape omits it.
 */
export const PaymentGatewayFieldSchema = z
  .object({
    name: z.string(),
    label: z.string().optional(),
    type: z.string().optional(),
    required: z.boolean().optional(),
  })
  .passthrough();

export const PaymentGatewaySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().nullish(),
    icon: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    enabled: z.boolean().nullish(),
    is_manual: z.boolean().nullish(),
    description: z.string().nullish(),
    instructions: z.string().nullish(),
    config: z.union([z.record(z.unknown()), z.array(z.unknown())]).nullish(),
    settings: z.record(z.unknown()).optional(),
    fields: z.array(PaymentGatewayFieldSchema).optional(),
    webhook_url: z.string().optional(),
    webhook_events: z.array(z.string()).optional(),
    is_installed: z.boolean().optional(),
  })
  .passthrough();

export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>;

/**
 * `GET /payment-gateways` returns an object keyed by gateway id
 * (`{"stripe": {...}}`) rather than an array — PHP associative arrays
 * losing their integer keys on JSON encode, the same class of issue
 * `services/helpers.ts`'s `unwrapDataList` exists to paper over. Normalizing
 * happens here, ahead of validation, so the result is both reshaped and
 * checked rather than reshaped and trusted.
 */
const normalizeGatewayCollection = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return value;
};

export const PaymentGatewayListSchema = z.preprocess(
  normalizeGatewayCollection,
  z.array(PaymentGatewaySchema),
);

export const PaymentMethodSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().nullish(),
    icon: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    is_manual: z.boolean().nullish(),
    instructions: z.string().nullish(),
    config: z.union([z.record(z.unknown()), z.array(z.unknown())]).nullish(),
  })
  .passthrough();

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
