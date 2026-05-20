import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { APP_PREFIX } from "conf";
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
  sort_by: "name",
  limit: "10",
  toggler: false,
};

export const categoriesSlice = createSlice({
  name: APP_PREFIX + "-category",
  initialState,
  reducers: {
    ...commonActions,
    setCategories: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCategory: (state, action) => {
      const { payload } = action;
      state.data.results = state.data.results.map((item) =>
        item.id === payload.id ? payload : item
      );

      return state;
    },
  },
});

export const getCategoriesAPI =
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
      .request(getOptions("/categories", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCategories(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteCategoriesAPI = async ({ action = "delete", ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions("/categories/bulk", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteCategoryByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions("/categories/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const addCategoryAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions("/categories", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const updateCategoryAPI = async (id, params) => {
  // if params.image type of object
  if (typeof params.image === "object") {
    params.image = params.image.id;
  }

  let data = false;
  await axios
    .request(putOptions("/categories/" + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

// Action creators are generated for each case reducer function
export const { setKeyValue, setCategories, updateCategory } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
