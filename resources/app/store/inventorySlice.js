import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { APP_PREFIX } from "@/conf";
import { commonActions, getOptions } from "./utils";

const initialState = {
  loaded: false,
  data: null,
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "id",
  limit: "10",
  toggler: false,
  hasChanges: false,
};

export const inventorySlice = createSlice({
  name: APP_PREFIX + "-inventory",
  initialState,
  reducers: {
    ...commonActions,
    setInventory: (state, action) => {
      const { results, ...meta } = action.payload;
      state.loaded = true;
      state.data = {
        results: results.reduce((entities, item) => {
          entities[item.id] = item;
          return entities;
        }, {}),
        ...meta,
      };
    },

    updateInventory: (state, action) => {
      const { id, changes } = action.payload;
      const item = state.data?.results?.[id];
      if (!item) return;
      state.data.results[id] = { ...item, ...changes };
    },
  },
});

export const getInventoryAPI =
  (
    params = {
      search: "",
      sort_by: "id",
      sort_order: "asc",
      page: 1,
    },
  ) =>
  (dispatch) => {
    axios
      .request(getOptions("/variants", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setInventory(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

// Action creators are generated for each case reducer function
export const { setInventory, updateInventory, setKeyValue } =
  inventorySlice.actions;

export default inventorySlice.reducer;
