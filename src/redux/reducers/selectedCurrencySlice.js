import { createSlice } from '@reduxjs/toolkit';

const initialState = 'BTC-USD';

const selectedCurrencySlice = createSlice({
  name: 'selectedCurrency',
  initialState,
  reducers: {
    setSelectedCurrency: (state, action) => action.payload,
  },
});

export const { setSelectedCurrency } = selectedCurrencySlice.actions;

export default selectedCurrencySlice.reducer;
