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
  limit: -1,
  toggler: false,
};

export const schemaSlice = createSlice({
  name: APP_PREFIX + "-schema",
  initialState,
  reducers: {
    ...commonActions,
    setSchema: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
  },
});

export const getSchemaProfileListAPI =
  (
    params = {
      search: "",
      sort_by: "name",
      sort_order: "asc",
      page: 1,
      limit: "10",
    }
  ) =>
  async (dispatch) => {
    try {
      const response = await axios.request(
        getOptions("/product-schemas", params)
      );
      dispatch(setSchema(response.data.data.results));
    } catch (error) {
      console.error(error);
      return error?.response?.data || false;
    }
  };

export const createSchemaProfileAPI = async (data) => {
  try {
    const response = await axios.request(postOptions(`/product-schemas`, data));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const updateSchemaProfileAPI = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/product-schemas/${id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deleteSchemaByIdAPI = async (id) => {
  try {
    const response = await axios.request(
      deleteOptions(`/product-schemas/${id}`)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};
export const { setKeyValue, setSchema, updateSchema } = schemaSlice.actions;

export default schemaSlice.reducer;
