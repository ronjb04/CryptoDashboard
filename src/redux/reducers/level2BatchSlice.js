import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  error: null,
};

const level2BatchSlice = createSlice({
  name: 'level2Batch',
  initialState,
  reducers: {
    setLevel2BatchData: (state, action) => {
      state.data = action.payload;
    },
    setLevel2BatchError: (state, action) => {
      state.error = action.payload;
    },
    resetLevel2Batch: (state) => {
      state.data = [];
      state.error = null;
    },
  },
});

export const { setLevel2BatchData, setLevel2BatchError, resetLevel2Batch } = level2BatchSlice.actions;
export default level2BatchSlice.reducer;
