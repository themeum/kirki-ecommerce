import { createSlice } from "@reduxjs/toolkit";
import { APP_PREFIX } from "conf";
import axios from "axios";
import { getOptions, postOptions, putOptions, deleteOptions } from "./utils";

const initialState = {
  loaded: false,
  data: { all: null, available: null },
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "name",
  limit: -1,
  toggler: false,
};

export const currenciesSlice = createSlice({
  name: APP_PREFIX + "-currencies",
  initialState,
  reducers: {
    setAllCurrencies: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data.all = payload;
      return state;
    },
    setAvailableCurrencies: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data.available = payload;
      return state;
    },
  },
});

export const getAvailableCurrenciesAPI = async (
  params = {
    search: "",
    sort_by: "name",
    sort_order: "asc",
    page: 1,
    limit: -1,
  }
) => {
  try {
    const response = await axios.request(getOptions("/currencies", params));
    return response.data.data;
  } catch (error) {
    console.error(error);
    return error?.response?.data || false;
  }
};

export const createNewCurrencyAPI = async (data) => {
  try {
    const response = await axios.request(postOptions("/currencies", data));
    return response.data;
  } catch (error) {
    console.error(error);
    return error?.response?.data || false;
  }
};

export const getAllCurrencyAPI = async (
  params = {
    search: "",
    sort_by: "name",
    sort_order: "asc",
    page: 1,
    limit: -1,
  }
) => {
  try {
    const response = await axios.request(
      getOptions("/currencies/list", params)
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
    return error?.response?.data || false;
  }
};

export const updateCurrencyData = async (params) => {
  try {
    const response = await axios.request(putOptions(`/currencies`, params));
    return response.data;
  } catch (error) {
    console.error("Update currency failed:", error);
    return error?.response?.data || false;
  }
};

export const deleteCurrencyDataByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions(`/currencies/${id}`))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const getCurrencyAPIProviderListAPI = async () => {
  try {
    const response = await axios.request(
      getOptions("/currency-exchange/providers")
    );

    return response.data;
  } catch (error) {
    console.error(error);
    return error?.response?.data || false;
  }
};

export const { setAllCurrencies, setAvailableCurrencies } =
  currenciesSlice.actions;
export default currenciesSlice.reducer;
