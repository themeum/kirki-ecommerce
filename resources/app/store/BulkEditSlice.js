import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { APP_PREFIX } from "@/conf";
import { commonActions, getOptions, putOptions } from "./utils";

const initialState = {
  loaded: false,
  data: null,
  search: "",
  page: 1,
  sort_order: "asc",
  sort_by: "id",
  limit: "10",
  toggler: false,
};

export const bulkEditSlice = createSlice({
  name: APP_PREFIX + "-bulk",
  initialState,
  reducers: {
    ...commonActions,
    setBulkVariants: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = { variants: payload };
      return state;
    },

    updateBulkVariants: (state, action) => {
      const { data } = state;
      const { payload } = action;
      const { variants } = data;
      const { key, value, variant_index = [] } = payload;
      if (variant_index.length > 0) {
        variant_index.forEach((item) => {
          if (key === "base_price_per_unit") {
            variants[item].total_unit_amount = value?.total_unit_amount;
            variants[item].total_unit = value?.total_unit;
            variants[item].base_unit_amount = value?.base_unit_amount;
            variants[item].base_unit = value?.base_unit;
          } else if (key === "in_stock") {
            variants[item][key] =
              value.toLowerCase() === "false" ? false : true;
          } else variants[item][key] = value;
        });
      }
      return state;
    },
  },
});

export const getVariantsListByIdAPI =
  (
    ids,
    params = {
      search: "",
      sort_by: "id",
      sort_order: "asc",
      page: 1,
    },
  ) =>
  (dispatch) => {
    axios
      .request(getOptions("/variants/bulk/" + ids.join(","), params))
      .then(function (response) {
        const { data } = response;
        dispatch(setBulkVariants(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const updateBulkVariantAPI = async (params) => {
  let data = false;
  await axios
    .request(putOptions("/variants/bulk", params))
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
export const { setBulkVariants, updateBulkVariants, setKeyValue } =
  bulkEditSlice.actions;

export default bulkEditSlice.reducer;
