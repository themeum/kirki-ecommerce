import { z } from 'zod';

/**
 * Covers three surfaces that all return "an online payment provider" with
 * different subsets of fields: the list (`GET /online-payments`), the detail
 * (`GET /online-payments/:id`, which adds `settings`/`fields`/webhook info),
 * and the installable list (`GET /online-payments/installable`, which adds
 * `is_installed`/`is_available` and omits `is_enabled`/`is_offline`). `id`
 * stays optional to keep the schema lenient, per the response-schema rule in
 * openspec/project.md.
 */
export const OnlinePaymentFieldSchema = z
  .object({
    name: z.string(),
    label: z.string().optional(),
    type: z.string().optional(),
    required: z.boolean().optional(),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    default: z.unknown().optional(),
  })
  .passthrough();

export const OnlinePaymentSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().nullish(),
    icon: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    enabled: z.boolean().nullish(),
    is_offline: z.boolean().nullish(),
    description: z.string().nullish(),
    instructions: z.string().nullish(),
    config: z.union([z.record(z.unknown()), z.array(z.unknown())]).nullish(),
    settings: z.record(z.unknown()).optional(),
    fields: z.array(OnlinePaymentFieldSchema).optional(),
    webhook_url: z.string().optional(),
    webhook_events: z.array(z.string()).optional(),
    is_installed: z.boolean().optional(),
  })
  .passthrough();

export type OnlinePayment = z.infer<typeof OnlinePaymentSchema>;
export type OnlinePaymentField = z.infer<typeof OnlinePaymentFieldSchema>;
export type OnlinePaymentFields = OnlinePaymentField[];

/**
 * `GET /online-payments` returns an object keyed by provider id
 * (`{"stripe": {...}}`) rather than an array — PHP associative arrays
 * losing their integer keys on JSON encode, the same class of issue
 * `services/helpers.ts`'s `unwrapDataList` exists to paper over. Normalizing
 * happens here, ahead of validation, so the result is both reshaped and
 * checked rather than reshaped and trusted.
 */
const normalizeProviderCollection = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return value;
};

export const OnlinePaymentListSchema = z.preprocess(
  normalizeProviderCollection,
  z.array(OnlinePaymentSchema),
);

export const OfflinePaymentSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().nullish(),
    icon: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    is_offline: z.boolean().nullish(),
    instructions: z.string().nullish(),
    config: z.union([z.record(z.unknown()), z.array(z.unknown())]).nullish(),
  })
  .passthrough();

export type OfflinePayment = z.infer<typeof OfflinePaymentSchema>;

/**
 * The offline providers embedded in `GET /settings/payment` are the same
 * entity as `GET /offline-payments`, minus `id` — the settings option stores
 * the list verbatim and the documented response omits it (see
 * `docs/ecommerce/settings/payment.yml`). Kept as a separate id-optional
 * variant so the `/offline-payments` schema can keep requiring `id`, which
 * the list UI relies on for its React keys and its update/delete calls.
 */
export const OfflinePaymentSettingsSchema = OfflinePaymentSchema.extend({
  id: z.union([z.string(), z.number()]).optional(),
});
