import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import axios from 'axios';

import { APP_PREFIX } from '@/conf';
import type { ListQueryParams, PageItem, PaginatedData } from '@/types';

import { getOptions } from './utils';

type PagesState = PageItem & {
  data?: PageItem[] | PaginatedData<PageItem> | null;
};

const initialState: PagesState = {
  id: null,
  title: '',
  slug: 'sample-page',
  status: '',
  created_at: '',
  updated_at: '',
};

export const pageSlice = createSlice({
  name: APP_PREFIX + '-pages',
  initialState,
  reducers: {
    setPages: (
      state,
      action: PayloadAction<PageItem[] | PaginatedData<PageItem> | null>,
    ) => {
      const { payload } = action;
      state.data = payload;
      return state;
    },
  },
});

export const getPagesAPI =
  (params: ListQueryParams = {}) =>
  (dispatch: Dispatch<UnknownAction>) => {
    axios
      .request(getOptions('/pages', params))
      .then(function (response) {
        const { data } = response;
        dispatch(setPages(data.data));
      })
      .catch(function (error) {
        console.error(error);
      });
  };

export const { setPages } = pageSlice.actions;
export default pageSlice.reducer;
