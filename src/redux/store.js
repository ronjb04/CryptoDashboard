import { configureStore } from '@reduxjs/toolkit';
import selectedCurrencyReducer from './reducers/selectedCurrencySlice';
import tickerReducer from './reducers/tickerSlice';
import level2BatchReducer from './reducers/level2BatchSlice'; 

const store = configureStore({
  reducer: {
    selectedCurrency: selectedCurrencyReducer,
    ticker: tickerReducer,
    level2Batch: level2BatchReducer, 
  },
});

export default store;
