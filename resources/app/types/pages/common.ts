import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

import type { SetKeyValuePayload } from '../store/common-actions';

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
  onSuccess?: () => Promise<void>;
};

type ProfitData = {
  price?: number | string | null;
  sale_price?: number | string | null;
  cost_of_goods?: number | string | null;
};

type MarkListHandlers = {
  isSelected: (id: string | number) => boolean;
  handleSingleCheckboxClick: (
    value: unknown,
    id: string | number,
  ) => void;
};

type TaxonomyTableHeader = {
  title: string;
  sortable?: {
    sort_by: string;
    reducer: string;
    setKeyValue: ActionCreatorWithPayload<SetKeyValuePayload>;
  };
};

type MediaChangePayload = {
  id?: number;
  url?: string;
};

export type {
  FormErrors,
  DateFormatType,
  SuggestionItem,
  SuggestionOption,
  ToastMessageConfig,
  ProfitData,
  MarkListHandlers,
  TaxonomyTableHeader,
  MediaChangePayload,
};
