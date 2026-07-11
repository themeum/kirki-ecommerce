import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

import type { ShowToastPayload, Toast } from '@/types';

type ToastState = {
  toasts: Toast[];
};

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare({
        title,
        variant = 'default',
        duration = 2000,
        undoAction,
        onSuccess,
      }: ShowToastPayload) {
        return {
          payload: {
            id: nanoid(),
            title,
            variant,
            duration,
            undoAction,
            onSuccess,
          },
        };
      },
    },

    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },

    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { showToast, removeToast, clearToasts } = toastSlice.actions;

export default toastSlice.reducer;
