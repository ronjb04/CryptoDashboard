import { createSlice } from '@reduxjs/toolkit';
import { connectWebSocket, subscribeToChannels, unsubscribeFromChannels } from '../../api/coinbaseApi';
import { setTickerData } from './tickerSlice';

const websocketSlice = createSlice({
  name: 'websocket',
  initialState: {
    socket: null,
  },
  reducers: {
    connect: (state, action) => {
      const socket = connectWebSocket((message) => {
        if (message.type === 'ticker') {
          action.payload.dispatch(setTickerData(message));
        } else if (message.type === 'l2update') {
          action.payload.onLevel2Message(message);
        }
      }, action.payload.onError);

      state.socket = socket;
    },
    disconnect: (state) => {
      if (state.socket) {
        unsubscribeFromChannels(state.socket, [], ['ticker', 'level2_batch']);
        state.socket = null;
      }
    },
    subscribe: (state, action) => {
      if (state.socket) {
        subscribeToChannels(state.socket, action.payload.productIds, action.payload.channels);
      }
    },
    unsubscribe: (state, action) => {
      if (state.socket) {
        unsubscribeFromChannels(state.socket, action.payload.productIds, action.payload.channels);
      }
    },
  },
});

export const { connect, disconnect, subscribe, unsubscribe } = websocketSlice.actions;

export default websocketSlice.reducer;
