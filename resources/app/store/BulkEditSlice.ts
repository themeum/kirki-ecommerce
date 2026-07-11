import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  AxiosErrorLike,
  ListQueryParams,
  ListState,
  ProductVariant,
  UnitPriceValue,
  UpdateVariantsPayload,
} from '@/types';

import { commonActions, getOptions, putOptions } from './utils';

type BulkEditData = {
  variants: ProductVariant[];
};

type BulkEditState = ListState<BulkEditData>;

const initialState: BulkEditState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  limit: '10',
  toggler: false,
};

export const bulkEditSlice = createSlice({
  name: APP_PREFIX + '-bulk',
  initialState,
  reducers: {
    ...commonActions,
    setBulkVariants: (
      state,
      action: PayloadAction<ProductVariant[]>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data = { variants: payload };
      return state;
    },

    updateBulkVariants: (
      state,
      action: PayloadAction<UpdateVariantsPayload>,
    ) => {
      const { data } = state;
      const { payload } = action;
      const { variants } = data as BulkEditData;
      const { key, value, variant_index = [] } = payload;
      if (variant_index.length > 0) {
        variant_index.forEach((item) => {
          if (key === 'base_price_per_unit') {
            const unitValue = value as UnitPriceValue;
            variants[item].total_unit_amount =
              unitValue?.total_unit_amount as ProductVariant['total_unit_amount'];
            variants[item].total_unit =
              unitValue?.total_unit as ProductVariant['total_unit'];
            variants[item].base_unit_amount =
              unitValue?.base_unit_amount as ProductVariant['base_unit_amount'];
            variants[item].base_unit =
              unitValue?.base_unit as ProductVariant['base_unit'];
          } else if (key === 'in_stock') {
            (variants[item] as Record<string, unknown>)[key] =
              (value as string).toLowerCase() === 'false' ? false : true;
          } else {
            (variants[item] as Record<string, unknown>)[key] = value;
          }
        });
      }
      return state;
    },
  },
});

export const getVariantsListByIdAPI =
  (
    ids: number[],
    params: ListQueryParams = {
      search: '',
      sort_by: 'id',
      sort_order: 'asc',
      page: 1,
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/variants/bulk/' + ids.join(','), params))
      .then(function (response) {
        const { data } = response;
        dispatch(setBulkVariants(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const updateBulkVariantAPI = async (
  params: Record<string, unknown>,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(putOptions('/variants/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const { setBulkVariants, updateBulkVariants, setKeyValue } =
  bulkEditSlice.actions;

export default bulkEditSlice.reducer;
