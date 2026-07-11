import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  Attribute,
  AttributeFormData,
  AttributeValueFormData,
  AxiosErrorLike,
  BulkActionParams,
  ListQueryParams,
  ListState,
  PaginatedData,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from './utils';

type AttributesState = ListState<Attribute[]>;

const initialState: AttributesState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'id',
  limit: -1,
  toggler: false,
};

export const attributesSlice = createSlice({
  name: APP_PREFIX + '-attribute',
  initialState,
  reducers: {
    ...commonActions,
    setAttributes: (state, action: PayloadAction<Attribute[] | null>) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateAttributeValue: (state, action: PayloadAction<Attribute>) => {
      const { payload } = action;
      (state.data as unknown as PaginatedData<Attribute>).results = (
        state.data as unknown as PaginatedData<Attribute>
      ).results.map((item) => (item.id === payload.id ? payload : item));

      return state;
    },
  },
});

export const getAttributesAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'id',
      sort_order: 'asc',
      page: 1,
      limit: -1,
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/attributes', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setAttributes(data.data.results));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getAttributeByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(getOptions('/attributes/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const addAttributeAPI = async (
  params: AttributeFormData,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/attributes', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const getAttributeValueAPI = async (
  id: number,
  params: ListQueryParams = {},
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(getOptions(`/attributes/${id}/values`, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const addAttributeValueAPI = async (
  params: AttributeValueFormData,
): Promise<ApiCallResult> => {
  const { attribute_id } = params;
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/attributes/' + attribute_id + '/values', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const updateAttributeAPI = async (
  id: number,
  params: AttributeFormData,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(putOptions('/attributes/' + id, params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      console.log(error);
      data = (error as AxiosErrorLike).response!.data;
    });

  return data;
};

export const updateAttributeValueAPI = async (
  params: AttributeValueFormData,
): Promise<ApiCallResult> => {
  const { attribute_id, value_id, value, color } = params;
  const data = {
    value,
    ...(color !== undefined && { color }),
  };
  try {
    const response = await axios.request(
      putOptions(`/attributes/${attribute_id}/values/${value_id}`, data),
    );

    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const deleteAttributeByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  try {
    const response = await axios.request(deleteOptions(`/attributes/${id}`));
    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const deleteAttributeValueByIdAPI = async (
  params: AttributeValueFormData,
): Promise<ApiCallResult> => {
  const { attribute_id, value_id } = params;
  try {
    const response = await axios.request(
      deleteOptions(`/attributes/${attribute_id}/values/${value_id}`),
    );
    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const bulkDeleteAttributeValueByIdAPI = async ({
  action = 'delete',
  attribute_id,
  ids = [],
}: BulkActionParams & { attribute_id: number }): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  try {
    const response = await axios.request(
      postOptions(`/attributes/${attribute_id}/values/bulk`, params),
    );
    return response.data;
  } catch (error) {
    return (error as AxiosErrorLike)?.response?.data || false;
  }
};

export const { setKeyValue, setAttributes } = attributesSlice.actions;

export default attributesSlice.reducer;
