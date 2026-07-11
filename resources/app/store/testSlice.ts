import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type UnknownAction,
} from '@reduxjs/toolkit';

import { APP_PREFIX } from '@/conf';

type TestState = {
  value: number;
};

const initialState: TestState = {
  value: 0,
};

export const testSlice = createSlice({
  name: APP_PREFIX + '-test',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const incrementAsync =
  (amount: number) => (dispatch: Dispatch<UnknownAction>) => {
    setTimeout(() => {
      dispatch(incrementByAmount(amount));
    }, 1000);
  };

export const { increment, decrement, incrementByAmount } = testSlice.actions;

export default testSlice.reducer;
