import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

import type { InventoryVariant, PaginatedData } from '@/types';

type InventoryStoredData = {
  results: Record<number, InventoryVariant>;
  total: number;
  count?: number;
  per_page: number;
  current_page?: number;
  last_page?: number;
  from?: number | null;
  to?: number | null;
  has_more_pages?: boolean;
};

type InventoryFormState = {
  loaded: boolean;
  data: InventoryStoredData | null;
  hasChanges: boolean;
};

type InventoryFormAction =
  | { type: 'SET_INVENTORY'; payload: PaginatedData<InventoryVariant> }
  | {
      type: 'UPDATE_INVENTORY';
      payload: { id: number; changes: Partial<InventoryVariant> };
    }
  | { type: 'SET_HAS_CHANGES'; payload: boolean }
  | { type: 'RESET_CHANGES' };

const initialState: InventoryFormState = {
  loaded: false,
  data: null,
  hasChanges: false,
};

const inventoryFormReducer = (
  state: InventoryFormState,
  action: InventoryFormAction,
): InventoryFormState => {
  if (action.type === 'SET_INVENTORY') {
    const { results, ...meta } = action.payload;
    return {
      loaded: true,
      hasChanges: false,
      data: {
        results: results.reduce(
          (entities: Record<number, InventoryVariant>, item) => {
            entities[item.id] = item;
            return entities;
          },
          {},
        ),
        ...meta,
      },
    };
  }

  if (action.type === 'UPDATE_INVENTORY') {
    const { id, changes } = action.payload;
    const item = state.data?.results?.[id];
    if (!item || !state.data) {
      return state;
    }

    return {
      ...state,
      hasChanges: true,
      data: {
        ...state.data,
        results: {
          ...state.data.results,
          [id]: { ...item, ...changes },
        },
      },
    };
  }

  if (action.type === 'SET_HAS_CHANGES') {
    return {
      ...state,
      hasChanges: action.payload,
    };
  }

  if (action.type === 'RESET_CHANGES') {
    return {
      ...state,
      hasChanges: false,
    };
  }

  return state;
};

type InventoryFormContextValue = {
  state: InventoryFormState;
  dispatch: Dispatch<InventoryFormAction>;
  data: InventoryStoredData | null;
  loaded: boolean;
  hasChanges: boolean;
  setInventory: (payload: PaginatedData<InventoryVariant>) => void;
  updateInventory: (payload: {
    id: number;
    changes: Partial<InventoryVariant>;
  }) => void;
  setHasChanges: (value: boolean) => void;
  resetChanges: () => void;
};

const InventoryFormContext = createContext<InventoryFormContextValue | null>(
  null,
);

type InventoryFormProviderProps = {
  children: ReactNode;
};

const InventoryFormProvider = ({ children }: InventoryFormProviderProps) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);

  const value = useMemo<InventoryFormContextValue>(
    () => ({
      state,
      dispatch,
      data: state.data,
      loaded: state.loaded,
      hasChanges: state.hasChanges,
      setInventory: (payload) => {
        dispatch({ type: 'SET_INVENTORY', payload });
      },
      updateInventory: (payload) => {
        dispatch({ type: 'UPDATE_INVENTORY', payload });
      },
      setHasChanges: (payload) => {
        dispatch({ type: 'SET_HAS_CHANGES', payload });
      },
      resetChanges: () => {
        dispatch({ type: 'RESET_CHANGES' });
      },
    }),
    [state],
  );

  return (
    <InventoryFormContext.Provider value={value}>
      {children}
    </InventoryFormContext.Provider>
  );
};

const useInventoryForm = () => {
  const context = useContext(InventoryFormContext);
  if (!context) {
    throw new Error(
      'useInventoryForm must be used within InventoryFormProvider',
    );
  }
  return context;
};

InventoryFormProvider.displayName = 'InventoryFormProvider';

export { InventoryFormProvider, useInventoryForm };
export type { InventoryFormState, InventoryFormAction, InventoryStoredData };
