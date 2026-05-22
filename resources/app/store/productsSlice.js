import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { APP_PREFIX } from "@/conf";
import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from "./utils";

const initialState = {
  loaded: false,
  data: null,
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "id",
  limit: "10",
  toggler: false,
  filter: {},
};

export const productsSlice = createSlice({
  name: APP_PREFIX + "-products",
  initialState,
  reducers: {
    ...commonActions,
    setProducts: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
  },
});

export const getProductsAPI =
  (params = { search: "", sort_by: "title", sort_order: "asc", page: 1 }) =>
  (dispatch) => {
    axios
      .request(getOptions("/products", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setProducts(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteProductsAPI = async ({ action = "delete", ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions("/products/bulk", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteProductByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions("/products/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

// Action creators are generated for each case reducer function
export const { setKeyValue, setProducts, updateProduct } =
  productsSlice.actions;

export default productsSlice.reducer;
