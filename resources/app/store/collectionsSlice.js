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
  sort_by: "title",
  toggler: false,
};

export const collectionsSlice = createSlice({
  name: APP_PREFIX + "-collection",
  initialState,
  reducers: {
    ...commonActions,
    setCollections: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCollection: (state, action) => {
      const { payload } = action;
      if (state.data) {
        state.data.results = state.data.results.map((item) =>
          item.id === payload.id ? payload : item
        );
      }
      return state;
    },
  },
});

export const getCollectionsAPI =
  (params = { search: "", sort_by: "name", sort_order: "asc", page: 1 }) =>
  (dispatch) => {
    axios
      .request(getOptions("/collections", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCollections(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getCollectionByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(getOptions("/collections/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};
export const deleteCollectionsAPI = async ({ action = "delete", ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions("/collections/bulk", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteCollectionByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions("/collections/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const addCollectionAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions("/collections", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const updateCollectionAPI = async (id, params) => {
  let data = false;
  if (typeof params.banner === "object") {
    params.banner = params.banner.id;
  }

  await axios
    .request(putOptions("/collections/" + id, params))
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
export const { setKeyValue, setCollections, updateCollection } =
  collectionsSlice.actions;

export default collectionsSlice.reducer;
