import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UnsavedState = {
  hasUnsavedData: boolean;
};

const initialState: UnsavedState = {
  hasUnsavedData: false,
};

const unsavedSlice = createSlice({
  name: 'unsaved',
  initialState,
  reducers: {
    setDirty: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedData = action.payload;
    },
  },
});

export const { setDirty } = unsavedSlice.actions;
export default unsavedSlice.reducer;
