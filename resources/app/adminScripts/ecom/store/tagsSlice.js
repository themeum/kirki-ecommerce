import { createSlice } from "@reduxjs/toolkit";
import { APP_PREFIX } from "conf";
import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from "./utils";
import axios from "axios";

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

export const tagsSlice = createSlice({
  name: APP_PREFIX + "-tag",
  initialState,
  reducers: {
    ...commonActions,
    setTags: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateTag: (state, action) => {
      const { payload } = action;
      state.data.results = state.data.results.map((item) =>
        item.id === payload.id ? payload : item
      );

      return state;
    },
  },
});

export const getTagsAPI =
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
      .request(getOptions("/tags", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setTags(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteTagsAPI = async ({ action = "delete", ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions("/tags/bulk", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteTagByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions("/tags/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const addTagAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions("/tags", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const updateTagAPI = async (id, params) => {
  let data = false;
  await axios
    .request(putOptions("/tags/" + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

export const { setKeyValue, setTags, updateTag } = tagsSlice.actions;

export default tagsSlice.reducer;
