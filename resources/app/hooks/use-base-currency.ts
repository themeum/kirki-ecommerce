import { useAppConfig } from '@/contexts/app-config-context';
import type { AppConfig } from '@/schemas/catalog/app-config';

type BaseCurrency = NonNullable<AppConfig['base_currency']>;

/**
 * The store's base currency, or null while the app config is still loading
 * or when none is configured.
 */
const useBaseCurrency = (): BaseCurrency | null => {
  const { settings } = useAppConfig();

  return settings?.base_currency ?? null;
};

/**
 * The base currency's symbol, or an empty string when it is not resolved
 * yet — never a hardcoded symbol, which would misrepresent the store.
 */
const useBaseCurrencySymbol = (): string => {
  return useBaseCurrency()?.symbol ?? '';
};

export default useBaseCurrency;
export { useBaseCurrencySymbol };
export type { BaseCurrency };
