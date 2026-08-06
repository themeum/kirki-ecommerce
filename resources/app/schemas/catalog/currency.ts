import { z } from 'zod';

export const CurrencySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
    symbol: z.string().nullish(),
    exchange_rate: z.union([z.number(), z.string()]).nullish(),
    is_base: z.boolean().nullish(),
    is_active: z.boolean().nullish(),
    is_enabled: z.boolean().nullish(),
    is_automatic_update_enabled: z.boolean().nullish(),
    api_provider: z.string().nullish(),
    last_sync_at: z.string().nullish(),
    next_sync_at: z.string().nullish(),
    created_at: z.string().nullish(),
    updated_at: z.string().nullish(),
  })
  .passthrough();

export type Currency = z.infer<typeof CurrencySchema>;

/**
 * `GET /currencies/list` — the world-currency catalog used to populate the
 * "Add Currency" picker. A different, unrelated resource from `Currency`
 * above: no `id`, no `exchange_rate`, no `is_base`. Confirmed against
 * `docs/ecommerce/currencies/all-currency-list.yml`; the codebase's prior
 * `Currency[]` typing for this endpoint was never correct.
 */
export const CurrencyOptionSchema = z.object({
  name: z.string(),
  code: z.string(),
  symbol: z.string().nullish(),
});

export type CurrencyOption = z.infer<typeof CurrencyOptionSchema>;

/**
 * The `items` shape `createCurrency`/`updateCurrency` actually send: a
 * currency being added (no `id` yet) or an existing one having a single
 * field toggled (`id` present). Not `Currency` itself, since a draft is
 * never guaranteed the server-assigned fields. `is_base`/`is_active` are
 * nullish rather than merely optional so a full `Currency` (which allows
 * `null` on both) can be spread directly into a draft, matching how
 * `available-currency-list.tsx` builds its toggle payloads.
 */
export const CurrencyDraftSchema = z
  .object({
    id: z.number().optional(),
    name: z.string(),
    code: z.string(),
    symbol: z.string().nullish(),
    exchange_rate: z.union([z.number(), z.string()]).nullish(),
    is_base: z.boolean().nullish(),
    is_active: z.boolean().nullish(),
  })
  .passthrough();

export type CurrencyDraft = z.infer<typeof CurrencyDraftSchema>;

export const CurrencyExchangeProviderSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullish(),
    description: z.string().nullish(),
  })
  .passthrough();

export type CurrencyExchangeProvider = z.infer<typeof CurrencyExchangeProviderSchema>;
