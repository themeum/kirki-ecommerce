import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  ApiResponse,
  AxiosErrorLike,
  BulkActionParams,
  Collection,
  CollectionFormData,
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

type CollectionsState = Omit<ListState<PaginatedData<Collection>>, 'limit'>;

const initialState: CollectionsState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'title',
  toggler: false,
};

export const collectionsSlice = createSlice({
  name: APP_PREFIX + '-collection',
  initialState,
  reducers: {
    ...commonActions,
    setCollections: (
      state,
      action: PayloadAction<PaginatedData<Collection>>,
    ) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateCollection: (state, action: PayloadAction<Collection>) => {
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

export const getCollectionsAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/collections', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setCollections(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const getCollectionByIdAPI = async (
  id: number,
): Promise<ApiCallResult<Collection>> => {
  let data: ApiCallResult<Collection> = false;
  await axios
    .request(getOptions('/collections/' + id))
    .then(function (response) {
      data = response.data as ApiResponse<Collection>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!;
      console.error(data);
    });
  return data;
};

export const deleteCollectionsAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/collections/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!;
      console.error(error);
    });

  return data;
};

export const deleteCollectionByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/collections/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!;
      console.error(data);
    });
  return data;
};

export const addCollectionAPI = async (
  params: CollectionFormData,
): Promise<ApiCallResult<Collection>> => {
  let data: ApiCallResult<Collection> = false;
  await axios
    .request(postOptions('/collections', params))
    .then(function (response) {
      data = response.data as ApiResponse<Collection>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response!.data!;
    });

  return data;
};

export const updateCollectionAPI = async (
  id: number,
  params: CollectionFormData,
): Promise<ApiCallResult<Collection>> => {
  let data: ApiCallResult<Collection> = false;
  if (typeof params.banner === 'object') {
    params.banner = (params.banner as { id: number }).id;
  }

  await axios
    .request(
      putOptions('/collections/' + id, params as Record<string, unknown>),
    )
    .then(function (response) {
      data = response.data as ApiResponse<Collection>;
    })
    .catch(function (error) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response!.data!;
    });

  return data;
};

export const { setKeyValue, setCollections, updateCollection } =
  collectionsSlice.actions;

export default collectionsSlice.reducer;
