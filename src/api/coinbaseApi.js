import axios from 'axios';
import { setTickerData, setTickerError } from '../redux/reducers/tickerSlice';
import { setLevel2BatchData, setLevel2BatchError } from '../redux/reducers/level2BatchSlice';

const API_URL = 'https://api.exchange.coinbase.com';
const WEBSOCKET_URL = 'wss://ws-feed.exchange.coinbase.com';

// Fetch Currencies List
export const fetchCurrenciesList = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    const filteredCurrencies = response.data.filter((currency) =>
      ['BTC-USD', 'ETH-USD', 'LTC-USD', 'BCH-USD'].includes(currency.id)
    );
    return filteredCurrencies;
  } catch (error) {
    throw new Error('Failed to fetch currencies list');
  }
};

// Get Historical Data
export const getHistoricalData = async (productId, granularity = 60) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}/candles`, {
      params: {
        granularity: granularity,
      }
    });
    const data = response.data.map(candle => ({
      timestamp: candle[0],
      low: candle[1],
      high: candle[2]
    }));
    return data;
  } catch (error) {
    throw new Error('Failed to fetch historical data');
  }
};

// WebSocket for Ticker Channel
export const connectTickerWebSocket = (productIds,from) => (dispatch) => {
  const socket = new WebSocket(WEBSOCKET_URL);
  let isConnectionOpen = false;
  const messageQueue = [];

  const sendQueuedMessages = () => {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      socket.send(JSON.stringify(message));
    }
  };

  socket.onopen = () => {
    isConnectionOpen = true;
    console.log('Ticker WebSocket opened for = ' + productIds);
    const subscribeMessage = {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['ticker']
    };
    if (isConnectionOpen) {
      socket.send(JSON.stringify(subscribeMessage));
    } else {
      messageQueue.push(subscribeMessage);
    }
    sendQueuedMessages(); 
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'ticker') {
      dispatch(setTickerData(message));
    }
  };

  socket.onerror = (event) => {
    console.error('Ticker WebSocket error:', event);
    dispatch(setTickerError('WebSocket Error'));
  };

  return () => {
    if (isConnectionOpen) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['ticker']
      };
      socket.send(JSON.stringify(unsubscribeMessage));
      socket.close();
      console.clear();
      console.log("unsubscribe for = " + productIds);
    } else {
      messageQueue.push({
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['ticker']
      });
    }
  };
};

// WebSocket for Level2 Batch Channel with Batching
export const connectLevel2BatchWebSocket = (productIds) => (dispatch) => {
  const socket = new WebSocket(WEBSOCKET_URL);
  let isConnectionOpen = false;
  const messageQueue = [];
  let batchBuffer = [];

  const sendQueuedMessages = () => {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      socket.send(JSON.stringify(message));
    }
  };

  socket.onopen = () => {
    isConnectionOpen = true;
    const subscribeMessage = {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['level2_batch']
    };
    if (isConnectionOpen) {
      socket.send(JSON.stringify(subscribeMessage));
    } else {
      messageQueue.push(subscribeMessage);
    }
    sendQueuedMessages(); 
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'l2update') {
      batchBuffer.push(message);
    }
  };

  // Batch and dispatch data every second
  const batchInterval = setInterval(() => {
    if (batchBuffer.length > 0) {
      const batchedData = {
        type: 'l2update_batch',
        changes: batchBuffer.flatMap((msg) => msg.changes)
      };
      dispatch(setLevel2BatchData(batchedData));
      batchBuffer = []; 
    }
  }, 1000);

  socket.onerror = (event) => {
    console.error('Level2 Batch WebSocket error:', event);
    dispatch(setLevel2BatchError('WebSocket Error'));
  };

  return () => {
    clearInterval(batchInterval);
    if (isConnectionOpen) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['level2_batch']
      };
      socket.send(JSON.stringify(unsubscribeMessage));
      socket.close();
    } else {
      messageQueue.push({
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['level2_batch']
      });
    }
  };
};
