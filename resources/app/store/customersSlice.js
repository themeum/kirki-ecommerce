import { APP_PREFIX } from '@/conf';
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { commonActions, deleteOptions, getOptions, postOptions, putOptions } from './utils';

const initialState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  toggler: false,
};

export const customersSlice = createSlice({
  name: APP_PREFIX + '-customer',
  initialState,
  reducers: {
    ...commonActions,
    setCustomers: (state, action) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCustomer: (state, action) => {
      const { payload } = action;
      if (state.data) {
        state.data.results = state.data.results.map((item) =>
          item.id === payload.id ? payload : item,
        );
      }
      return state;
    },
  },
});

export const getCustomersAPI =
  (
    params = {
      search: '',
      sort_by: 'id',
      sort_order: 'asc',
      page: 1,
    },
  ) =>
  (dispatch) => {
    axios
      .request(getOptions('/customers', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCustomers(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getCustomerByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(getOptions('/customers/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

export const addCustomerAPI = async (params) => {
  let data = false;
  await axios
    .request(postOptions('/customers', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response.data;
      console.log(data);
    });

  return data;
};

export const updateCustomerAPI = async (id, params) => {
  let data = false;
  if (typeof params.photo === 'object') {
    params.photo = params?.photo?.id || 0;
  }

  await axios
    .request(putOptions('/customers/' + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = error.response.data;
    });

  return data;
};

export const deleteCustomersAPI = async ({ action = 'delete', ids = [] }) => {
  const params = {
    action: action,
    ids: ids,
  };
  let data = false;
  await axios
    .request(postOptions('/customers/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(error);
    });

  return data;
};

export const deleteCustomerByIdAPI = async (id) => {
  let data = false;
  await axios
    .request(deleteOptions('/customers/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = error.response;
      console.error(data);
    });
  return data;
};

// Action creators are generated for each case reducer function
export const { setKeyValue, setCustomers, updateCustomer } = customersSlice.actions;

export default customersSlice.reducer;
