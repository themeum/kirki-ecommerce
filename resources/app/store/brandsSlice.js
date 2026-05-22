import { createSlice } from "@reduxjs/toolkit";
import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from "./utils";
import axios from "axios";
import { APP_PREFIX } from "@/conf";

const initialState = {
  loaded: false,
  data: null,
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "name",
  limit: "10",
  toggler: false,
};

export const brandsSlice = createSlice({
  name: APP_PREFIX + "-brand",
  initialState,
  reducers: {
    ...commonActions,
    setBrands: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateBrand: (state, action) => {
      const { payload } = action;
      state.data.results = state.data.results.map((item) =>
        item.id === payload.id ? payload : item
      );

      return state;
    },
  },
});

export const getBrandsAPI =
  (
    params = {
      search: "",
      sort_by: "name",
      sort_order: "asc",
      page: 1,
      limit: "10",
    }
  ) =>
  (dispatch) => {
    axios
      .request(getOptions("/brands", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setBrands(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteBrandsAPI = async ({ action = "delete", ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions("/brands/bulk", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteBrandByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions("/brands/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const addBrandAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions("/brands", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const updateBrandAPI = async (id, params) => {
  let data = false;
  if (typeof params.logo === "object") {
    params.logo = params.logo.id;
  }

  await axios
    .request(putOptions("/brands/" + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

export const { setKeyValue, setBrands, updateBrand } = brandsSlice.actions;

export default brandsSlice.reducer;
