import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  AxiosErrorLike,
  ListQueryParams,
  SetSettingsPayload,
  SettingsSectionData,
  SettingsSectionKey,
  SettingsState,
  ShippingBox,
  ShippingProfile,
  TaxProfile,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  patchOptions,
  postOptions,
  putOptions,
} from './utils';

const initialState: SettingsState = {
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
  name: APP_PREFIX + '-settings',
  initialState,
  reducers: {
    ...commonActions,
    setSettings: (state, action: PayloadAction<SetSettingsPayload>) => {
      const { payload } = action;
      const { key, value } = payload;
      state[key].loaded = true;
      state[key].data = value;
      return state;
    },

    setActiveZoneId: (state, action: PayloadAction<number | null>) => {
      state.shipping.activeZoneId = action.payload;
    },

    setSelectedCountryList: (state, action: PayloadAction<unknown>) => {
      state.shipping.selectedCountryList = action.payload;
    },

    updateShippingProfile: (
      state,
      action: PayloadAction<ShippingProfile[]>,
    ) => {
      state.shipping.shippingProfile.loaded = true;
      state.shipping.shippingProfile.data = action.payload;
    },

    updateShippingBox: (state, action: PayloadAction<ShippingBox[]>) => {
      state.shipping.shippingBox.loaded = true;
      state.shipping.shippingBox.data = action.payload;
    },

    updateTaxProfile: (state, action: PayloadAction<TaxProfile[]>) => {
      state.tax.taxProfile.loaded = true;
      state.tax.taxProfile.data = action.payload;
    },

    updateSettings: (state, action: PayloadAction<SetSettingsPayload>) => {
      const { key, value } = action.payload;
      state[key].data = value;
    },
  },
});

export const getSettingsAPI =
  (key: SettingsSectionKey | string, params: ListQueryParams = {}) =>
  async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const res = await axios.request(getOptions('/settings/' + key, params));
      const data = res.data.data as SettingsSectionData;
      dispatch(
        setSettings({ key: key as SettingsSectionKey, value: data }),
      );
      return data;
    } catch (error: unknown) {
      console.error(error);
      const err = error as AxiosErrorLike;
      return err?.response?.data || false;
    }
  };

export const updateSettingsAPI = async (
  key: string,
  settingsData: SettingsSectionData,
) => {
  try {
    const response = await axios.request(
      putOptions(`/settings`, {
        key: key,
        data: settingsData,
      }),
    );
    return response.data;
  } catch (error: unknown) {
    console.error('Update settings failed:', error);
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getAvailablePaymentGatewayAPI = async () => {
  try {
    const response = await axios.request(
      getOptions('/payment-gateways/installable'),
    );
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getAddedPaymentGatewayAPI = async () => {
  try {
    const response = await axios.request(getOptions('/payment-gateways'));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const installPaymentGatewayAPI = async (id: unknown) => {
  try {
    const response = await axios.request(
      postOptions('/payment-gateways/install', id),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const updatePaymentGatewayAPI = async (
  id: number | string,
  data: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      putOptions(`/payment-gateways/${id}`, data),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const deletePaymentGatewayAPI = async (_id: number | string) => {
  // try {
  //   const response = await axios.request(
  //     deleteOptions(`/payment-gateways/${id}`)
  //   );
  //   return response.data;
  // } catch (error) {
  //   return error?.response?.data || false;
  // }
};

export const getPaymentGatewayById = async (id: number | string) => {
  try {
    const response = await axios.request(getOptions(`/payment-gateways/${id}`));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const setEnabledPaymentGateway = async (
  id: number | string,
  params: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      patchOptions(`/payment-gateways/${id}`, params),
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getPaymentMethodListAPI = async () => {
  try {
    const response = await axios.request(getOptions('/payment-methods'));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const createPaymentMethodAPI = async (data: Record<string, unknown>) => {
  try {
    const response = await axios.request(postOptions('/payment-methods', data));

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const updatePaymentMethodAPI = async (
  id: number | string,
  data: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      putOptions(`/payment-methods/${id}`, data),
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const deletePaymentMethodAPI = async (id: number | string) => {
  try {
    const response = await axios.request(
      deleteOptions(`/payment-methods/${id}`),
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const createShippingProfile = async (data: Record<string, unknown>) => {
  try {
    const response = await axios.request(
      postOptions('/shipping-profiles', data),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getShippingProfileList =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: -1,
    },
  ) =>
  async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const response = await axios.request(
        getOptions('/shipping-profiles', params),
      );
      dispatch(
        updateShippingProfile(
          response?.data?.data?.results as ShippingProfile[],
        ),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      return err?.response?.data || false;
    }
  };

export const deleteShippingProfileById = async (id: number | string) => {
  let data: unknown = false;
  await axios
    .request(deleteOptions(`/shipping-profiles/${id}`))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error: unknown) {
      const err = error as AxiosErrorLike;
      data = err.response;
      console.error(data);
    });
  return data;
};

export const updateShippingProfileById = async (
  id: number | string,
  data: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      putOptions(`/shipping-profiles/${id}`, data),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const createShippingBoxAPI = async (data: Record<string, unknown>) => {
  try {
    const response = await axios.request(postOptions('/shipping-boxes', data));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getShippingBoxListAPI = (
  params: ListQueryParams = {
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: -1,
  },
) => {
  return async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const response = await axios.request(
        getOptions('/shipping-boxes', params),
      );
      dispatch(
        updateShippingBox(response?.data?.data?.results as ShippingBox[]),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      return err?.response?.data || false;
    }
  };
};

export const getShippingBoxByIdAPI = async (id: number | string) => {
  try {
    const response = await axios.request(getOptions('/shipping-boxes/' + id));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const deleteShippingBoxByIdAPI = async (id: number | string) => {
  try {
    const response = await axios.request(
      deleteOptions(`/shipping-boxes/${id}`),
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const updateShippingBoxAPI = async (
  id: number | string,
  data: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      putOptions(`/shipping-boxes/${id}`, data),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const createTaxProfile = async (data: Record<string, unknown>) => {
  try {
    const response = await axios.request(postOptions('/tax-profiles', data));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getTaxProfileListAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: -1,
    },
  ) =>
  async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const response = await axios.request(getOptions('/tax-profiles', params));
      dispatch(
        updateTaxProfile(response?.data?.data?.results as TaxProfile[]),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      return err?.response?.data || false;
    }
  };

export const deleteTaxProfileById = async (id: number | string) => {
  try {
    const response = await axios.request(deleteOptions(`/tax-profiles/${id}`));
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    const data = err?.response?.data;
    console.error(data || error);
    return data;
  }
};

export const updateTaxProfileAPI = async (
  id: number | string,
  data: Record<string, unknown>,
) => {
  try {
    const response = await axios.request(
      putOptions(`/tax-profiles/${id}`, data),
    );

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosErrorLike;
    return err?.response?.data || false;
  }
};

export const getDefaultSettingsAPI =
  () => async (dispatch: Dispatch<UnknownAction>) => {
    try {
      const res = await axios.request(getOptions('/app-config'));
      const data = res.data.data as SettingsSectionData;
      dispatch(setSettings({ key: 'default', value: data }));
      return data;
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      return err?.response?.data || false;
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
