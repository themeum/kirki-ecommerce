import { createContext, type ReactNode, useContext } from 'react';

import { moneyValue } from '@/features/analytics/lib/format';
import { type AmountFormat, DEFAULT_LAYOUT } from '@/features/analytics/lib/layout';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';

const AmountFormatContext = createContext<AmountFormat>(DEFAULT_LAYOUT.amounts);

type AmountFormatProviderProps = {
  format: AmountFormat;
  children: ReactNode;
};

const AmountFormatProvider = ({ format, children }: AmountFormatProviderProps) => {
  return <AmountFormatContext.Provider value={format}>{children}</AmountFormatContext.Provider>;
};

AmountFormatProvider.displayName = 'AmountFormatProvider';

/**
 * Format money in the amount format that the merchant selected: the text to
 * show, and in Short mode the long amount as the hover title.
 */
const useMoney = () => {
  const format = useContext(AmountFormatContext);

  return {
    format,
    money: (money: MoneyObject | null | undefined) => moneyValue(money, format),
  };
};

export { AmountFormatProvider, useMoney };
