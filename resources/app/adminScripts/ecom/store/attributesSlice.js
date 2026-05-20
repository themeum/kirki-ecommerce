import { createSlice } from "@reduxjs/toolkit";
import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from "./utils";
import axios from "axios";
import { APP_PREFIX } from "conf";

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

export const attributesSlice = createSlice({
  name: APP_PREFIX + "-attribute",
  initialState,
  reducers: {
    ...commonActions,
    setAttributes: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateAttributeValue: (state, action) => {
      const { payload } = action;
      state.data.results = state.data.results.map((item) =>
        item.id === payload.id ? payload : item
      );

      return state;
    },
  },
});

export const getAttributesAPI =
  (
    params = {
      search: "",
      sort_by: "id",
      sort_order: "asc",
      page: 1,
      limit: -1,
    }
  ) =>
  (dispatch) => {
    axios
      .request(getOptions("/attributes", params))
      .then(function (response) {
        const { data } = response;
        dispatch(setAttributes(data.data.results));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getAttributeByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(getOptions("/attributes/" + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

export const addAttributeAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions("/attributes", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const getAttributeValueAPI = async (id, params = {}) => {
  let data = false;
  await axios
    .request(getOptions(`/attributes/${id}/values`, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const addAttributeValueAPI = async (params) => {
  const { attribute_id } = params;
  let data = false;
  await axios
    .request(postOptions("/attributes/" + attribute_id + "/values", params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
    });

  return data;
};

export const updateAttributeAPI = async (id, params) => {
  let data = false;
  await axios
    .request(putOptions("/attributes/" + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

export const updateAttributeValueAPI = async (params) => {
  const { attribute_id, value_id, value, color } = params;
  const data = {
    value,
    ...(color !== undefined && { color }),
  };
  try {
    const response = await axios.request(
      putOptions(`/attributes/${attribute_id}/values/${value_id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deleteAttributeByIdAPI = async (id) => {
  try {
    const response = await axios.request(deleteOptions(`/attributes/${id}`));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deleteAttributeValueByIdAPI = async (params) => {
  const { attribute_id, value_id } = params;
  try {
    const response = await axios.request(
      deleteOptions(`/attributes/${attribute_id}/values/${value_id}`)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const bulkDeleteAttributeValueByIdAPI = async ({
  action = "delete",
  attribute_id,
  ids = [],
}) => {
  const params = {
    action: action,
    ids: ids,
  };
  try {
    const response = await axios.request(
      postOptions(`/attributes/${attribute_id}/values/bulk`, params)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const { setKeyValue, setAttributes } = attributesSlice.actions;

export default attributesSlice.reducer;
