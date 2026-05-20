import React from "react";

import { createSlice } from "@reduxjs/toolkit";
import { APP_PREFIX } from "conf";

const initialState = {
  value: 0,
};
export const testSlice = createSlice({
  name: APP_PREFIX + "-test",
  initialState,
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const incrementAsync = (amount) => (dispatch) => {
  setTimeout(() => {
    dispatch(incrementByAmount(amount));
  }, 1000);
};

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount } = testSlice.actions;

export default testSlice.reducer;
