type FormErrors = Record<string, string | string[] | null | undefined>;

type DateFormatType = 'date' | 'time' | 'datetime' | 'readable' | 'relative';

type SuggestionItem = {
  id: number | string;
  name?: string;
  title?: string;
};

type SuggestionOption = {
  value: number | string;
  title: string;
};

type ToastMessageConfig = {
  title?: string;
  duration?: number;
  undoAction?: () => void;
  onSuccess?: () => void | Promise<void>;
};

type ToastVariant = 'default' | 'warning' | 'delete' | 'success' | 'error';

type ProfitData = {
  base_price?: number | string | null;
  base_sale_price?: number | string | null;
  base_cost_of_goods?: number | string | null;
};

type MediaChangePayload = {
  id?: string | number;
  url?: string;
};

export type {
  DateFormatType,
  FormErrors,
  MediaChangePayload,
  ProfitData,
  SuggestionItem,
  SuggestionOption,
  ToastMessageConfig,
  ToastVariant,
};
