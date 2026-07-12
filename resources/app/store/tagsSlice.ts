import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch, PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type {
  ApiCallResult,
  ApiResponse,
  AxiosErrorLike,
  BulkActionParams,
  ListQueryParams,
  ListState,
  PaginatedData,
  Tag,
  TagFormData,
} from '@/types';

import {
  commonActions,
  deleteOptions,
  getOptions,
  postOptions,
  putOptions,
} from '@/store/utils';

type TagsState = ListState<PaginatedData<Tag>>;

const initialState: TagsState = {
  loaded: false,
  data: null,
  search: '',
  page: 1,
  sort_order: 'asc',
  sort_by: 'name',
  limit: '10',
  toggler: false,
};

export const tagsSlice = createSlice({
  name: APP_PREFIX + '-tag',
  initialState,
  reducers: {
    ...commonActions,
    setTags: (state, action: PayloadAction<PaginatedData<Tag>>) => {
      const { payload } = action;
      state.loaded = true;
      state.data = payload;
      return state;
    },
    updateTag: (state, action: PayloadAction<Tag>) => {
      const { payload } = action;
      state.data!.results = state.data!.results.map((item) =>
        item.id === payload.id ? payload : item,
      );

      return state;
    },
  },
});

export const getTagsAPI =
  (
    params: ListQueryParams = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: '10',
    },
  ) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/tags', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setTags(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const deleteTagsAPI = async ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}): Promise<ApiCallResult> => {
  const params = {
    action: action,
    ids: ids,
  };
  let data: ApiCallResult = false;
  await axios
    .request(postOptions('/tags/bulk', params))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.error(error);
    });

  return data;
};

export const deleteTagByIdAPI = async (
  id: number,
): Promise<ApiCallResult> => {
  let data: ApiCallResult = false;
  await axios
    .request(deleteOptions('/tags/' + id))
    .then(function (response) {
      data = response.data;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
      console.error(data);
    });
  return data;
};

export const addTagAPI = async (
  params: TagFormData,
): Promise<ApiCallResult<Tag>> => {
  let data: ApiCallResult<Tag> = false;
  await axios
    .request(postOptions('/tags', params))
    .then(function (response) {
      data = response.data as ApiResponse<Tag>;
    })
    .catch(function (error) {
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const updateTagAPI = async (
  id: number,
  params: TagFormData,
): Promise<ApiCallResult<Tag>> => {
  let data: ApiCallResult<Tag> = false;
  await axios
    .request(putOptions('/tags/' + id, params))
    .then(function (response) {
      data = response.data as ApiResponse<Tag>;
    })
    .catch(function (error) {
      console.log(error);
      const err = error as AxiosErrorLike;
      data = err.response?.data ?? false;
    });

  return data;
};

export const { setKeyValue, setTags, updateTag } = tagsSlice.actions;

export default tagsSlice.reducer;
