import { useAppConfig } from '@/contexts/app-config-context';

/**
 * The store's base currency symbol, or an empty string while the app config
 * is still loading or when no base currency is configured — never a
 * hardcoded symbol, which would misrepresent a non-USD store.
 */
const useBaseCurrencySymbol = (): string => {
  const { settings } = useAppConfig();

  return settings?.base_currency?.symbol ?? '';
};

export default useBaseCurrencySymbol;
