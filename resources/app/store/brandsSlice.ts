import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  ApiResponse,
  AxiosErrorLike,
  Brand,
  BrandFormData,
  BulkActionParams,
  ListQueryParams,
  ListState,
  PaginatedData,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from './utils';

type BrandsState = ListState<PaginatedData<Brand>>;

const initialState: BrandsState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'name',
  limit: '10',
  toggler: false,
};

export const brandsSlice = createSlice({
  name: APP_PREFIX + '-brand',
  initialState,
  reducers: {
    ...commonActions,
    setBrands: (state, action: PayloadAction<PaginatedData<Brand>>) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateBrand: (state, action: PayloadAction<Brand>) => {
      const { payload } = action;
      state.data!.results = state.data!.results.map((item) =>
        item.id === payload.id ? payload : item,
      );

      return state;
    },
  },
});

export const getBrandsAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: '10',
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/brands', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setBrands(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteBrandsAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/brands/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.error(error);
    });

  return data;
};

export const deleteBrandByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/brands/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.error(data);
    });
  return data;
};

export const addBrandAPI = async (
  params: BrandFormData,
): Promise<ApiCallResult<Brand>> => {
  let data: ApiCallResult<Brand> = false;
  await axios
    .request(postOptions('/brands', params))
    .then(function (response) {
      data = response.data as ApiResponse<Brand>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const updateBrandAPI = async (
  id: number,
  params: BrandFormData,
): Promise<ApiCallResult<Brand>> => {
  let data: ApiCallResult<Brand> = false;
  if (typeof params.logo === 'object') {
    params.logo = (params.logo as { id: number }).id;
  }

  await axios
    .request(putOptions('/brands/' + id, params))
    .then(function (response) {
      data = response.data as ApiResponse<Brand>;
    })
    .catch(function (error) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const { setKeyValue, setBrands, updateBrand } = brandsSlice.actions;

export default brandsSlice.reducer;
