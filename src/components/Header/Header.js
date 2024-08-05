import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrenciesList, connectTickerWebSocket } from '../../api/coinbaseApi';
import { setSelectedCurrency } from '../../redux/reducers/selectedCurrencySlice';

import { stringToCurrency } from '../../utils/formatter';

import logo from '../../logo.svg';

const HeaderComponent = () => {
  const dispatch = useDispatch();
  const selectedCurrency = useSelector((state) => state.selectedCurrency);
  const tickerData = useSelector((state) => state.ticker.data);

  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webSocketConnected = useRef(false);

  const isFetched = useRef(false);

  useEffect(() => {
    const loadCurrencies = async () => {
      if (isFetched.current) return; 
      isFetched.current = true;

      try {
        const currencyData = await fetchCurrenciesList();
        setCurrencies(currencyData);
        setLoading(false);
      } catch (error) {
        setError('Failed to load currencies');
        setLoading(false);
      }
    };

    loadCurrencies();
  }, []);

  useEffect(() => {
    if (!selectedCurrency || webSocketConnected.current) return; 

    webSocketConnected.current = true; 

    const unsubscribe = dispatch(connectTickerWebSocket([selectedCurrency]));

    return () => {
      unsubscribe();
      webSocketConnected.current = false;
    };
  }, [selectedCurrency, dispatch]);

  const handleCurrencyChange = (event) => {
    dispatch(setSelectedCurrency(event.target.value));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Calculate the spread
  const spread = tickerData.best_bid && tickerData.best_ask 
    ? (parseFloat(tickerData.best_ask) - parseFloat(tickerData.best_bid)).toFixed(2) 
    : "0.00";

  return (
    <div className='flex flex-row items-center text-slate-300 p-6 border-b-2 border-slate-500'>
      <img src={logo} className="h-12" alt="logo" />
      <form className="mx-2">
        <select 
          id="large" 
          className="block w-full px-4 py-3 text-base text-gray-200 border border-gray-600 rounded-lg bg-gray-700 focus:ring-gray-500 focus:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500 focus-visible:outline-none"
          value={selectedCurrency}
          onChange={handleCurrencyChange}
        >
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.display_name}
            </option>
          ))}
        </select>
      </form>
      <div className='mx-2 flex flex-row items-top'>
        <dl className='mx-2 min-w-32'>
          <dt>Best Bid:</dt>
          <dd className='text-2xl font-black text-green-600'>{tickerData.best_bid ? stringToCurrency(parseFloat(tickerData.best_bid).toFixed(2)) : "0,000.00"}</dd>
          <dd className='text-sm'>Qty: {tickerData.best_bid_size ? parseFloat(tickerData.best_bid_size).toFixed(8) : "0.00000000"}</dd>
        </dl>
        <dl className='mx-2 min-w-32'>
          <dt>Best Ask:</dt>
          <dd className='text-2xl font-black text-red-600'>{tickerData.best_ask ? stringToCurrency(parseFloat(tickerData.best_ask).toFixed(2)) : "0,000.00"}</dd>
          <dd className='text-sm'>Qty: {tickerData.best_ask_size ? parseFloat(tickerData.best_ask_size).toFixed(8) : "0.00000000"}</dd>
        </dl>
        <dl className='mx-2 min-w-16'>
          <dt>Spread:</dt>
          <dd className='text-2xl'>{spread ? stringToCurrency(spread) : "0.00"}</dd>
        </dl>
        <dl className='mx-2 min-w-32'>
          <dt>24H Volume:</dt>
          <dd className='text-2xl'>{tickerData.volume_24h ? stringToCurrency(parseFloat(tickerData.volume_24h)) : "0,000.00"}</dd>
        </dl>
      </div>
    </div>
  );
};

export default HeaderComponent;
