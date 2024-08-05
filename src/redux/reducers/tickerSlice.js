import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: {},
  error: null,
  loading: false,
};

const tickerSlice = createSlice({
  name: 'ticker',
  initialState,
  reducers: {
    setTickerData: (state, action) => {
      state.data = {
        ...action.payload, // new ticker
      };
      state.loading = false; // Assume loading is complete once data is received
    },
    setTickerError: (state, action) => {
      state.error = action.payload;
      state.loading = false; // Stop loading on error
    },
    setTickerLoading: (state) => {
      state.loading = true;
      state.error = null; // Clear previous errors
    },
    resetTicker: (state) => {
      state.data = {};
      state.error = null;
      state.loading = false;
    },
  },
});

export const { setTickerData, setTickerError, setTickerLoading, resetTicker } = tickerSlice.actions;

export default tickerSlice.reducer;
