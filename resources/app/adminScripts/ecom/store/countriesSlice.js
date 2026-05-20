import { createSlice } from "@reduxjs/toolkit";
import { commonActions, getOptions } from "./utils";
import axios from "axios";
import { APP_PREFIX } from "conf";

const initialState = {
  loaded: false,
  data: null,
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "name",
  limit: -1,
  toggler: false,
};

export const countriesSlice = createSlice({
  name: APP_PREFIX + "-country",
  initialState,
  reducers: {
    ...commonActions,
    setCountries: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
  },
});

export const getCountriesAPI =
  (
    params = {
      search: "",
      sort_by: "name",
      sort_order: "asc",
      page: 1,
      limit: -1,
    }
  ) =>
  (dispatch) => {
    axios
      .request(getOptions("/countries", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCountries(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const { setKeyValue, setCountries } = countriesSlice.actions;

export default countriesSlice.reducer;
