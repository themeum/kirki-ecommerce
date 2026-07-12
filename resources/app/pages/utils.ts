import { format, formatDistanceToNow, isValid, parse } from 'date-fns';

import { store } from '@/store';
import { showToast } from '@/store/toastSlice';
import type { ToastVariant } from '@/types';
import type {
  DateFormatType,
  ProfitData,
  SuggestionItem,
  SuggestionOption,
  ToastMessageConfig,
} from '@/types/pages/common';

export const dateFormatter = (
  value: string | number | Date | null | undefined,
  type: DateFormatType = 'date',
): string => {
  if (!value) {
    return '';
  }

  let date: Date;
  if (typeof value === 'string') {
    date = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date());
  } else {
    date = new Date(value);
  }
  if (!isValid(date)) {
    return '';
  }

  if (type === 'relative') {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  const formatMap: Record<Exclude<DateFormatType, 'relative'>, string> = {
    date: 'yyyy-MM-dd',
    time: 'HH:mm:ss',
    datetime: 'yyyy-MM-dd, HH:mm:ss',
    readable: 'MMMM d, yyyy',
  };
  return format(date, formatMap[type] || formatMap.date);
};

export const makeSuggestionList = (
  data: SuggestionItem[] = [],
  selectedValues: SuggestionOption[] = [],
): SuggestionOption[] => {
  const suggestionList = data
    .filter((item) => !selectedValues.some((s) => s.value === item.id))
    .map((item) => ({
      value: item.id,
      title: item.name || item.title || '',
    }));

  return suggestionList;
};

export const dispatchToastMessage = (
  variant: ToastVariant = 'success',
  config: ToastMessageConfig = {},
): void => {
  const { title, duration, undoAction, onSuccess } = config;
  store.dispatch(
    showToast({
      title: title ?? '',
      variant,
      duration,
      undoAction,
      onSuccess,
    }),
  );
};

export const calculateProfit = (
  fieldName: string,
  data: ProfitData,
): string | undefined => {
  if ((data.price || data.sale_price) && data.cost_of_goods) {
    const effectivePrice = Number(data.sale_price || data.price);
    const profit = effectivePrice - Number(data.cost_of_goods);
    if (fieldName === 'margin') {
      const profitPercentage = (profit / effectivePrice) * 100;
      return profitPercentage.toFixed(2);
    }
    return profit.toFixed(2);
  }
};

export const normalizeErrors = (
  errorObj: Record<string, unknown> = {},
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  Object.entries(errorObj).forEach(([key, value]) => {
    const fieldName = key.split('.').pop() as string;
    normalized[fieldName] = value;
  });

  return normalized;
};
