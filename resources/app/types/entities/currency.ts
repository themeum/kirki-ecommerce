type Currency = {
  id: number;
  name: string;
  code: string;
  symbol?: string;
  exchange_rate?: number | string;
  is_base?: boolean;
  is_active?: boolean;
  is_enabled?: boolean;
  is_automatic_update_enabled?: boolean;
  api_provider?: string | null;
  last_sync_at?: string | null;
  next_sync_at?: string | null;
};

type CurrencyFormData = {
  name?: string;
  code?: string;
  symbol?: string;
  exchange_rate?: number | string;
  is_base?: boolean;
  is_active?: boolean;
  is_enabled?: boolean;
  items?: Currency[];
  [key: string]: unknown;
};

export type { Currency, CurrencyFormData };
