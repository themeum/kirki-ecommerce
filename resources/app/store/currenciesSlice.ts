import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  AxiosErrorLike,
  Currency,
  CurrencyFormData,
  ListQueryParams,
  SortOrder,
} from '@/types';

import { deleteOptions, getOptions, postOptions, putOptions } from './utils';

type CurrenciesState = {
  loaded: boolean;
  data: { all: Currency[] | null; available: Currency[] | null };
  search: string;
  page: number;
  sort_order: SortOrder;
  sort_by: string;
  limit: string | number;
  toggler: boolean | number;
};

const initialState: CurrenciesState = {
  loaded: false,
  data: { all: null, available: null },
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'name',
  limit: -1,
  toggler: false,
};

export const currenciesSlice = createSlice({
  name: APP_PREFIX + '-currencies',
  initialState,
  reducers: {
    setAllCurrencies: (state, action: PayloadAction<Currency[] | null>) => {
      const { payload } = action;
      state.loaded = true;
      state.data.all = payload;
      return state;
    },
    setAvailableCurrencies: (
      state,
      action: PayloadAction<Currency[] | null>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data.available = payload;
      return state;
    },
  },
});

export const getAvailableCurrenciesAPI = async (
  params: ListQueryParams = {
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: -1,
  },
): Promise<Currency[] | ApiCallResult> => {
  try {
    const response = await axios.request(getOptions('/currencies', params));
    return response.data.data;
  } catch (error) {
    console.error(error);
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const createNewCurrencyAPI = async (
  data: CurrencyFormData,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(postOptions('/currencies', data));
    return response.data;
  } catch (error) {
    console.error(error);
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const getAllCurrencyAPI = async (
  params: ListQueryParams = {
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: -1,
  },
): Promise<Currency[] | ApiCallResult> => {
  try {
    const response = await axios.request(
      getOptions('/currencies/list', params),
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const updateCurrencyData = async (
  params: CurrencyFormData,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(putOptions(`/currencies`, params));
    return response.data;
  } catch (error) {
    console.error('Update currency failed:', error);
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const deleteCurrencyDataByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions(`/currencies/${id}`))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = (error as AxiosErrorLike).response as ApiCallResult;
      console.error(data);
    });
  return data;
};

export const getCurrencyAPIProviderListAPI =
  async (): Promise<ApiCallResult> => {
    try {
      const response = await axios.request(
        getOptions('/currency-exchange/providers'),
      );

      return response.data;
    } catch (error) {
      console.error(error);
      return (error as AxiosErrorLike)?.response?.data || false;
    }
  };

export const { setAllCurrencies, setAvailableCurrencies } =
  currenciesSlice.actions;
export default currenciesSlice.reducer;
