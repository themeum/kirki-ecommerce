import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  ApiResponse,
  AxiosErrorLike,
  BulkActionParams,
  Category,
  CategoryFormData,
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
} from '@/store/utils';

type CategoriesState = ListState<PaginatedData<Category>>;

const initialState: CategoriesState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'name',
  limit: '10',
  toggler: false,
};

export const categoriesSlice = createSlice({
  name: APP_PREFIX + '-category',
  initialState,
  reducers: {
    ...commonActions,
    setCategories: (
      state,
      action: PayloadAction<PaginatedData<Category>>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const { payload } = action;
      state.data!.results = state.data!.results.map((item) =>
        item.id === payload.id ? payload : item,
      );

      return state;
    },
  },
});

export const getCategoriesAPI =
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
      .request(getOptions('/categories', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCategories(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteCategoriesAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/categories/bulk', params))
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

export const deleteCategoryByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/categories/' + id))
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

export const addCategoryAPI = async (
  params: CategoryFormData,
): Promise<ApiCallResult<Category>> => {
  let data: ApiCallResult<Category> = false;
  await axios
    .request(postOptions('/categories', params))
    .then(function (response) {
      data = response.data as ApiResponse<Category>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const updateCategoryAPI = async (
  id: number,
  params: CategoryFormData,
): Promise<ApiCallResult<Category>> => {
  if (typeof params.image === 'object') {
    params.image = (params.image as { id: number }).id;
  }

  let data: ApiCallResult<Category> = false;
  await axios
    .request(putOptions('/categories/' + id, params))
    .then(function (response) {
      data = response.data as ApiResponse<Category>;
    })
    .catch(function (error) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const { setKeyValue, setCategories, updateCategory } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
