import { format, formatDistanceToNow, isValid, parse } from 'date-fns';
import { toast } from 'sonner';

import type { ToastVariant } from '@/types';
import type {
  DateFormatType,
  ProfitData,
  SuggestionItem,
  SuggestionOption,
  ToastMessageConfig,
} from '@/types/pages/common';
import { __ } from '@/wpi18n';

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
  const { title, duration = 2000, undoAction, onSuccess } = config;
  const message = title ?? '';

  const options = {
    duration,
    action: undoAction
      ? {
          label: __('Undo', 'kirki-ecommerce'),
          onClick: () => {
            undoAction();
          },
        }
      : undefined,
    onAutoClose: () => {
      void onSuccess?.();
    },
    onDismiss: () => {
      void onSuccess?.();
    },
  };

  if (variant === 'error' || variant === 'delete') {
    toast.error(message, options);
    return;
  }

  if (variant === 'warning') {
    toast.warning(message, options);
    return;
  }

  if (variant === 'success') {
    toast.success(message, options);
    return;
  }

  toast(message, options);
};

export const calculateProfit = (
  fieldName: string,
  data: ProfitData,
): string | undefined => {
  if ((data.base_price || data.base_sale_price) && data.base_cost_of_goods) {
    const effectivePrice = Number(data.base_sale_price || data.base_price);
    const profit = effectivePrice - Number(data.base_cost_of_goods);
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
    const fieldName = key.split('.').pop()!;
    normalized[fieldName] = value;
  });

  return normalized;
};
