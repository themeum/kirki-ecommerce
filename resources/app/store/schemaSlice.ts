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
  SchemaFormData,
  SchemaProfile,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from './utils';

type SchemaState = ListState<SchemaProfile[]>;

const initialState: SchemaState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  limit: -1,
  toggler: false,
};

export const schemaSlice = createSlice({
  name: APP_PREFIX + '-schema',
  initialState,
  reducers: {
    ...commonActions,
    setSchema: (state, action: PayloadAction<SchemaProfile[] | null>) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
  },
});

export const getSchemaProfileListAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: '10',
    },
  ) =>
  async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const response = await axios.request(
        getOptions('/product-schemas', params),
      );
      dispatch(setSchema(response.data.data.results));
    } catch (error) {
      console.error(error);
      return (error as AxiosErrorLike)?.response?.data || false;
    }
  };

export const createSchemaProfileAPI = async (
  data: SchemaFormData,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(postOptions(`/product-schemas`, data));
    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const updateSchemaProfileAPI = async (
  id: number,
  data: SchemaFormData,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(
      putOptions(`/product-schemas/${id}`, data),
    );

    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const deleteSchemaByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(
      deleteOptions(`/product-schemas/${id}`),
    );
    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const { setKeyValue, setSchema } = schemaSlice.actions;

export default schemaSlice.reducer;
