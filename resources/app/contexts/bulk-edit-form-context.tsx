import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

import type {
  ProductVariant,
  UnitPriceValue,
  UpdateVariantsPayload,
} from '@/types';

type BulkEditFormState = {
  loaded: boolean;
  variants: ProductVariant[];
};

type BulkEditFormAction =
  | { type: 'SET_VARIANTS'; payload: ProductVariant[] }
  | { type: 'UPDATE_VARIANTS'; payload: UpdateVariantsPayload }
  | { type: 'RESET' };

const initialState: BulkEditFormState = {
  loaded: false,
  variants: [],
};

const applyVariantField = (
  variant: ProductVariant,
  key: string,
  value: unknown,
) => {
  if (key === 'base_price_per_unit') {
    const unitValue = value as UnitPriceValue;
    variant.total_unit_amount =
      unitValue?.total_unit_amount as ProductVariant['total_unit_amount'];
    variant.total_unit = unitValue?.total_unit as ProductVariant['total_unit'];
    variant.base_unit_amount =
      unitValue?.base_unit_amount as ProductVariant['base_unit_amount'];
    variant.base_unit = unitValue?.base_unit as ProductVariant['base_unit'];
    return;
  }

  if (key === 'in_stock') {
    variant.in_stock =
      typeof value === 'string'
        ? value.toLowerCase() !== 'false'
        : Boolean(value);
    return;
  }

  (variant as Record<string, unknown>)[key] = value;
};

const bulkEditFormReducer = (
  state: BulkEditFormState,
  action: BulkEditFormAction,
): BulkEditFormState => {
  if (action.type === 'SET_VARIANTS') {
    return {
      loaded: true,
      variants: action.payload,
    };
  }

  if (action.type === 'UPDATE_VARIANTS') {
    const { key, value, variant_index = [] } = action.payload;
    const variants = state.variants.map((variant) => ({ ...variant }));

    variant_index.forEach((index) => {
      if (!variants[index]) {
        return;
      }
      applyVariantField(variants[index], key, value);
    });

    return {
      ...state,
      variants,
    };
  }

  if (action.type === 'RESET') {
    return initialState;
  }

  return state;
};

type BulkEditFormContextValue = {
  state: BulkEditFormState;
  dispatch: Dispatch<BulkEditFormAction>;
  variants: ProductVariant[];
  loaded: boolean;
  setVariants: (variants: ProductVariant[]) => void;
  updateVariants: (payload: UpdateVariantsPayload) => void;
  reset: () => void;
};

const BulkEditFormContext = createContext<BulkEditFormContextValue | null>(
  null,
);

type BulkEditFormProviderProps = {
  children: ReactNode;
};

const BulkEditFormProvider = ({ children }: BulkEditFormProviderProps) => {
  const [state, dispatch] = useReducer(bulkEditFormReducer, initialState);

  const value = useMemo<BulkEditFormContextValue>(
    () => ({
      state,
      dispatch,
      variants: state.variants,
      loaded: state.loaded,
      setVariants: (payload) => {
        dispatch({ type: 'SET_VARIANTS', payload });
      },
      updateVariants: (payload) => {
        dispatch({ type: 'UPDATE_VARIANTS', payload });
      },
      reset: () => {
        dispatch({ type: 'RESET' });
      },
    }),
    [state],
  );

  return (
    <BulkEditFormContext.Provider value={value}>
      {children}
    </BulkEditFormContext.Provider>
  );
};

const useBulkEditForm = () => {
  const context = useContext(BulkEditFormContext);
  if (!context) {
    throw new Error('useBulkEditForm must be used within BulkEditFormProvider');
  }
  return context;
};

BulkEditFormProvider.displayName = 'BulkEditFormProvider';

export { BulkEditFormProvider, useBulkEditForm };
export type { BulkEditFormState, BulkEditFormAction };
