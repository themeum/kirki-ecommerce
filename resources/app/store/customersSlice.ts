import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  ApiResponse,
  AxiosErrorLike,
  BulkActionParams,
  Customer,
  CustomerFormData,
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

type CustomersState = Omit<ListState<PaginatedData<Customer>>, 'limit'>;

const initialState: CustomersState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  toggler: false,
};

export const customersSlice = createSlice({
  name: APP_PREFIX + '-customer',
  initialState,
  reducers: {
    ...commonActions,
    setCustomers: (
      state,
      action: PayloadAction<PaginatedData<Customer>>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const { payload } = action;
      if (state.data) {
        state.data.results = state.data.results.map((item) =>
          item.id === payload.id ? payload : item,
        );
      }
      return state;
    },
  },
});

export const getCustomersAPI =
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
      .request(getOptions('/customers', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCustomers(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getCustomerByIdAPI = async (
  id: number,
): Promise<ApiCallResult<Customer>> => {
  let data: ApiCallResult<Customer> = false;
  await axios
    .request(getOptions('/customers/' + id))
    .then(function (response) {
      data = response.data as ApiResponse<Customer>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.error(data);
    });
  return data;
};

export const addCustomerAPI = async (
  params: CustomerFormData,
): Promise<ApiCallResult<Customer>> => {
  let data: ApiCallResult<Customer> = false;
  await axios
    .request(postOptions('/customers', params))
    .then(function (response) {
      data = response.data as ApiResponse<Customer>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.log(data);
    });

  return data;
};

export const updateCustomerAPI = async (
  id: number,
  params: CustomerFormData,
): Promise<ApiCallResult<Customer>> => {
  let data: ApiCallResult<Customer> = false;
  if (typeof params.photo === 'object') {
    params.photo = (params.photo as { id?: number } | null)?.id || 0;
  }

  await axios
    .request(putOptions('/customers/' + id, params))
    .then(function (response) {
      data = response.data as ApiResponse<Customer>;
    })
    .catch(function (error) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const deleteCustomersAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/customers/bulk', params))
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

export const deleteCustomerByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/customers/' + id))
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

export const { setKeyValue, setCustomers, updateCustomer } =
  customersSlice.actions;

export default customersSlice.reducer;
