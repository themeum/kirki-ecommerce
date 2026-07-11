import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  AxiosErrorLike,
  BulkActionParams,
  ListQueryParams,
  ListState,
  PaginatedData,
  ProductListItem,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
} from './utils';

type ProductsState = ListState<PaginatedData<ProductListItem>>;

const initialState: ProductsState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  limit: '10',
  toggler: false,
  filter: {},
};

export const productsSlice = createSlice({
  name: APP_PREFIX + '-products',
  initialState,
  reducers: {
    ...commonActions,
    setProducts: (
      state,
      action: PayloadAction<PaginatedData<ProductListItem>>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
  },
});

export const getProductsAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/products', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setProducts(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteProductsAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/products/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!;
      console.error(error);
    });

  return data;
};

export const deleteProductByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/products/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!;
      console.error(data);
    });
  return data;
};

export const { setKeyValue, setProducts } = productsSlice.actions;

export default productsSlice.reducer;
