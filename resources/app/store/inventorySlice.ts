import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  InventoryVariant,
  ListQueryParams,
  ListState,
  PaginatedData,
} from '@/types';

import { commonActions, getOptions } from './utils';

type InventoryStoredData = {
  results: Record<number, InventoryVariant>;
  total: number;
  per_page: number;
};

type InventoryState = ListState<InventoryStoredData> & {
  hasChanges: boolean;
};

const initialState: InventoryState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  limit: '10',
  toggler: false,
  hasChanges: false,
};

export const inventorySlice = createSlice({
  name: APP_PREFIX + '-inventory',
  initialState,
  reducers: {
    ...commonActions,
    setInventory: (
      state,
      action: PayloadAction<PaginatedData<InventoryVariant>>,
    ) => {
      const { results, ...meta } = action.payload;
      state.loaded = true;
      state.data = {
        results: results.reduce(
          (entities: Record<number, InventoryVariant>, item) => {
            entities[item.id] = item;
            return entities;
          },
          {},
        ),
        ...meta,
      };
    },

    updateInventory: (
      state,
      action: PayloadAction<{
        id: number;
        changes: Partial<InventoryVariant>;
      }>,
    ) => {
      const { id, changes } = action.payload;
      const item = state.data?.results?.[id];
      if (!item) {
        return;
      }
      state.data!.results[id] = { ...item, ...changes };
    },
  },
});

export const getInventoryAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'id',
      sort_order: 'asc',
      page: 1,
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/variants', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setInventory(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const { setInventory, updateInventory, setKeyValue } =
  inventorySlice.actions;

export default inventorySlice.reducer;
