import { createSlice } from "@reduxjs/toolkit";
import { APP_PREFIX } from "conf";
import axios from "axios";

import {
  commonActions,
  getOptions,
  putOptions,
  deleteOptions,
  postOptions,
  patchOptions,
} from "./utils";

const initialState = {
  general: { loaded: false, data: null },
  product: { loaded: false, data: null },
  orders: { loaded: false, data: null },
  checkout: { loaded: false, data: null },
  shipping: {
    loaded: false,
    data: null,
    activeZoneId: null,
    selectedCountryList: null,
    shippingProfile: { loaded: false, data: null, toggler: false },
    shippingBox: { loaded: false, data: null, toggler: false },
  },
  tax: {
    loaded: false,
    data: null,
    taxProfile: { loaded: false, data: null, toggler: false },
  },
  payment: { loaded: false, data: null },
  email: { loaded: false, data: null },
  currency: { loaded: false, data: null },
  default: { loaded: false, data: null },
};

export const settingsSlice = createSlice({
  name: APP_PREFIX + "-settings",
  initialState,
  reducers: {
    ...commonActions,
    setSettings: (state, action) => {
      const { payload } = action;
      const { key, value } = payload;
      state[key].loaded = true;
      state[key].data = value;
      return state;
    },

    setActiveZoneId: (state, action) => {
      state.shipping.activeZoneId = action.payload;
    },

    setSelectedCountryList: (state, action) => {
      state.shipping.selectedCountryList = action.payload;
    },

    updateShippingProfile: (state, action) => {
      state.shipping.shippingProfile.loaded = true;
      state.shipping.shippingProfile.data = action.payload;
    },

    updateShippingBox: (state, action) => {
      state.shipping.shippingBox.loaded = true;
      state.shipping.shippingBox.data = action.payload;
    },

    updateTaxProfile: (state, action) => {
      state.tax.taxProfile.loaded = true;
      state.tax.taxProfile.data = action.payload;
    },

    updateSettings: (state, action) => {
      const { key, value } = action.payload;
      state[key].data = value;
    },
  },
});

export const getSettingsAPI =
  (key, params = {}) =>
  async (dispatch) => {
    try {
      const res = await axios.request(getOptions("/settings/" + key, params));
      const data = res.data.data;
      dispatch(setSettings({ key, value: data }));
      return data;
    } catch (error) {
      console.error(error);
      return error?.response?.data || false;
    }
  };

export const updateSettingsAPI = async (key, settingsData) => {
  const slug = `kirki_ecommerce_${key}`;

  try {
    const response = await axios.request(
      putOptions(`/settings`, {
        key: key,
        data: settingsData,
      })
    );
    return response.data;
  } catch (error) {
    console.error("Update settings failed:", error);
    return error?.response?.data || false;
  }
};

export const getAvailablePaymentGatewayAPI = async () => {
  try {
    const response = await axios.request(
      getOptions("/payment-gateways/installable")
    );
    return response.data;
  } catch (error) {
    console.error(error);
    return error?.response?.data || false;
  }
};

export const getAddedPaymentGatewayAPI = async () => {
  try {
    const response = await axios.request(getOptions("/payment-gateways"));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const installPaymentGatewayAPI = async (id) => {
  try {
    const response = await axios.request(
      postOptions("/payment-gateways/install", id)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const updatePaymentGatewayAPI = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/payment-gateways/${id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deletePaymentGatewayAPI = async (id) => {
  // try {
  //   const response = await axios.request(
  //     deleteOptions(`/payment-gateways/${id}`)
  //   );
  //   return response.data;
  // } catch (error) {
  //   return error?.response?.data || false;
  // }
};

export const getPaymentGatewayById = async (id) => {
  try {
    const response = await axios.request(getOptions(`/payment-gateways/${id}`));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const setEnabledPaymentGateway = async (id, params) => {
  try {
    const response = await axios.request(
      patchOptions(`/payment-gateways/${id}`, params)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const getPaymentMethodListAPI = async () => {
  try {
    const response = await axios.request(getOptions("/payment-methods"));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const createPaymentMethodAPI = async (data) => {
  try {
    const response = await axios.request(postOptions("/payment-methods", data));

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const updatePaymentMethodAPI = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/payment-methods/${id}`, data)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deletePaymentMethodAPI = async (id) => {
  try {
    const response = await axios.request(
      deleteOptions(`/payment-methods/${id}`)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const createShippingProfile = async (data) => {
  try {
    const response = await axios.request(
      postOptions("/shipping-profiles", data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const getShippingProfileList =
  (
    params = {
      search: "",
      sort_by: "name",
      sort_order: "asc",
      page: 1,
      limit: -1,
    }
  ) =>
  async (dispatch) => {
    try {
      const response = await axios.request(
        getOptions("/shipping-profiles", params)
      );
      dispatch(updateShippingProfile(response?.data?.data?.results));
      return response.data;
    } catch (error) {
      return error?.response?.data || false;
    }
  };

export const deleteShippingProfileById = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions(`/shipping-profiles/${id}`))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const updateShippingProfileById = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/shipping-profiles/${id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const createShippingBoxAPI = async (data) => {
  try {
    const response = await axios.request(postOptions("/shipping-boxes", data));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const getShippingBoxListAPI = (
  params = {
    search: "",
    sort_by: "name",
    sort_order: "asc",
    page: 1,
    limit: -1,
  }
) => {
  return async (dispatch) => {
    try {
      const response = await axios.request(
        getOptions("/shipping-boxes", params)
      );
      dispatch(updateShippingBox(response?.data?.data?.results));
      return response.data;
    } catch (error) {
      return error?.response?.data || false;
    }
  };
};

export const getShippingBoxByIdAPI = async (id) => {
  try {
    const response = await axios.request(getOptions("/shipping-boxes/" + id));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const deleteShippingBoxByIdAPI = async (id) => {
  try {
    const response = await axios.request(
      deleteOptions(`/shipping-boxes/${id}`)
    );
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const updateShippingBoxAPI = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/shipping-boxes/${id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const createTaxProfile = async (data) => {
  try {
    const response = await axios.request(postOptions("/tax-profiles", data));
    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const getTaxProfileListAPI =
  (
    params = {
      search: "",
      sort_by: "name",
      sort_order: "asc",
      page: 1,
      limit: -1,
    }
  ) =>
  async (dispatch) => {
    try {
      const response = await axios.request(getOptions("/tax-profiles", params));
      dispatch(updateTaxProfile(response?.data?.data?.results));
      return response.data;
    } catch (error) {
      return error?.response?.data || false;
    }
  };

export const deleteTaxProfileById = async (id) => {
  try {
    const response = await axios.request(deleteOptions(`/tax-profiles/${id}`));
    return response.data;
  } catch (error) {
    const data = error?.response?.data;
    console.error(data || error);
    return data;
  }
};

export const updateTaxProfileAPI = async (id, data) => {
  try {
    const response = await axios.request(
      putOptions(`/tax-profiles/${id}`, data)
    );

    return response.data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const getDefaultSettingsAPI = () => async (dispatch) => {
  try {
    const res = await axios.request(getOptions("/app-config"));
    const data = res.data.data;
    dispatch(setSettings({ key: "default", value: data }));
    return data;
  } catch (error) {
    return error?.response?.data || false;
  }
};

export const {
  setKeyValue,
  setSettings,
  updateSettings,
  setActiveZoneId,
  setSelectedCountryList,
  updateShippingProfile,
  updateShippingBox,
  updateTaxProfile,
} = settingsSlice.actions;

export default settingsSlice.reducer;
