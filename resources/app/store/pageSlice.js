import { createSlice } from "@reduxjs/toolkit";
import { APP_PREFIX } from "@/conf";
import axios from "axios";

import { getOptions } from "./utils";

const initialState = {
  id: null,
  title: "",
  slug: "sample-page",
  status: "",
  created_at: "",
  updated_at: "",
};

export const pageSlice = createSlice({
  name: APP_PREFIX + "-pages",
  initialState,
  reducers: {
    setPages: (state, action) => {
      const { payload } = action;
      state.data = payload;
      return state;
    },
  },
});

export const getPagesAPI =
  (params = {}) =>
  (dispatch) => {
    axios
      .request(getOptions("/pages", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setPages(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const { setPages } = pageSlice.actions;
export default pageSlice.reducer;
