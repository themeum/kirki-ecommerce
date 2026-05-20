import { createSlice } from "@reduxjs/toolkit";

const unsavedSlice = createSlice({
  name: "unsaved",
  initialState: {
    hasUnsavedData: false,
  },
  reducers: {
    setDirty: (state, action) => {
      state.hasUnsavedData = action.payload;
    },
  },
});

export const { setDirty } = unsavedSlice.actions;
export default unsavedSlice.reducer;
