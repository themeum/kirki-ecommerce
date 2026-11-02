import { format, formatDistanceStrict, isValid, parse } from 'date-fns';
import z from 'zod';

import {
  type CurrencyDraft,
  CurrencySchema,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import type {
  CurrencyRateItem,
  MultiCurrencySettingsFormInput,
} from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import type { CurrencyBulkPayload } from '@/features/settings/multi-currency/services/currency';
import { __, sprintf } from '@/wpi18n';

export const CurrencyListItemSchema = CurrencySchema.extend({
  id: z.number().optional(),
  is_toggle_disabled: z.boolean().optional(),
  is_action_disabled: z.boolean().optional(),
});

export type CurrencyListItem = z.infer<typeof CurrencyListItemSchema>;

export const toCurrencyDraft = (item: CurrencyListItem): CurrencyDraft => ({
  id: item.id,
  name: item.name,
  code: item.code,
  symbol: item.symbol,
  exchange_rate: item.exchange_rate,
  is_base: item.is_base ?? false,
  is_active: item.is_active ?? true,
});

export const buildCurrencyListItems = (currencies: CurrencyRateItem[]): CurrencyListItem[] =>
  currencies.map((item) => ({
    ...item,
    ...(item?.is_base && {
      is_toggle_disabled: true,
      is_action_disabled: true,
    }),
    is_enabled: item?.is_active,
    icon: item?.symbol,
  }));

export const buildCurrencyUpdatePayload = (
  currencyList: CurrencyListItem[],
  item: CurrencyListItem,
  key: keyof CurrencyRateItem,
): CurrencyBulkPayload | null => {
  const selectedCurrency = currencyList.find((currency) => currency?.id === item?.id);
  if (!selectedCurrency) {
    return null;
  }

  if (key === 'is_base') {
    return {
      items: [toCurrencyDraft({ ...selectedCurrency, is_base: true })],
    };
  }

  return {
    items: [toCurrencyDraft({ ...selectedCurrency, [key]: !selectedCurrency[key] })],
  };
};

type ProviderConfig = NonNullable<MultiCurrencySettingsFormInput['api_configs']>[string];

export const getProviderConfig = (
  apiConfigs: Record<string, ProviderConfig | undefined> | null | undefined,
  providerId: string | null | undefined,
): ProviderConfig | null => {
  if (!providerId) {
    return null;
  }

  return apiConfigs?.[providerId] ?? null;
};

export type SyncStatusInput = {
  apiProvider: string | null | undefined;
  providerName: string;
  hasApiKey: boolean;
  isAutomaticUpdateEnabled: boolean;
  lastSyncAt: string | null | undefined;
  nextSyncAt: string | null | undefined;
  lastSyncError: string | null | undefined;
  lastSyncErrorAt: string | null | undefined;
  now?: Date;
};

export type SyncStatus = {
  tone: 'default' | 'warning';
  message: string;
};

const parseSyncTime = (value: string | null | undefined, now: Date) => {
  if (!value) {
    return null;
  }

  const date = parse(`${value}Z`, 'yyyy-MM-dd HH:mm:ssX', now);

  return isValid(date) ? date : null;
};

const toRelativeTime = (value: string | null | undefined, now: Date) => {
  const date = parseSyncTime(value, now);

  return date ? formatDistanceStrict(date, now, { addSuffix: true }) : '';
};

export const formatSyncTime = (value: string | null | undefined) => {
  const date = parseSyncTime(value, new Date());

  return date ? format(date, 'd MMM, yyyy hh:mm:ss a') : '';
};

const joinSentences = (sentences: string[]) => sentences.filter(Boolean).join(' ');

export const getSyncStatus = (input: SyncStatusInput): SyncStatus => {
  const now = input.now ?? new Date();
  const lastSync = toRelativeTime(input.lastSyncAt, now);
  const nextSync = toRelativeTime(input.nextSyncAt, now);

  if (!input.apiProvider) {
    return {
      tone: 'default',
      message: __(
        'Rates are updated manually. Turn on Automatic Updates below and select a provider.',
        'kirki-ecommerce',
      ),
    };
  }

  if (!input.hasApiKey) {
    return {
      tone: 'default',
      message: sprintf(
        /* translators: %s: exchange rate provider name */
        __(
          '%s is not connected. Add an API key below to sync rates automatically.',
          'kirki-ecommerce',
        ),
        input.providerName,
      ),
    };
  }

  if (input.isAutomaticUpdateEnabled && input.lastSyncError) {
    const failedAt = toRelativeTime(input.lastSyncErrorAt, now);
    const error = /[.!?]$/.test(input.lastSyncError)
      ? input.lastSyncError
      : `${input.lastSyncError}.`;

    return {
      tone: 'warning',
      message: joinSentences([
        failedAt
          ? sprintf(
              /* translators: 1: relative time of the failure, 2: error message */
              __('Automatic sync failed %1$s: %2$s', 'kirki-ecommerce'),
              failedAt,
              error,
            )
          : sprintf(
              /* translators: %s: error message */
              __('Automatic sync failed: %s', 'kirki-ecommerce'),
              error,
            ),
        __('Rates kept.', 'kirki-ecommerce'),
        nextSync &&
          /* translators: %s: relative time of the next sync attempt */
          sprintf(__('Retry %s.', 'kirki-ecommerce'), nextSync),
      ]),
    };
  }

  if (input.isAutomaticUpdateEnabled) {
    return {
      tone: 'default',
      message: joinSentences([
        __('Automatic updates on.', 'kirki-ecommerce'),
        lastSync &&
          /* translators: %s: relative time of the last sync */
          sprintf(__('Last sync %s.', 'kirki-ecommerce'), lastSync),
        nextSync &&
          /* translators: %s: relative time of the next sync */
          sprintf(__('Next sync %s.', 'kirki-ecommerce'), nextSync),
      ]),
    };
  }

  return {
    tone: 'default',
    message: joinSentences([
      __('API connected, automatic updates off.', 'kirki-ecommerce'),
      lastSync &&
        /* translators: %s: relative time of the last sync */
        sprintf(__('Last sync %s.', 'kirki-ecommerce'), lastSync),
      __('Use Sync now to update.', 'kirki-ecommerce'),
    ]),
  };
};
