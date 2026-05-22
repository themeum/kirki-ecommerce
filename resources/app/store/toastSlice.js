import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({
        title,
        variant = "default",
        duration = 2000,
        undoAction,
        onSuccess,
      }) {
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

    removeToast(state, action) {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload
      );
    },

    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { showToast, removeToast, clearToasts } = toastSlice.actions;

export default toastSlice.reducer;
