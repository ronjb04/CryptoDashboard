import React from 'react';
import { ChartComponent } from './components/Dashboard/Chart';
import HeaderComponent from './components/Header/Header';
import { OrderBookComponent } from './components/Dashboard/OrderBook';

function App(props) {
  return (
    <div className="bg-slate-800 dark:bg-slate-800 min-h-screen text-gray-300 px-4">
      <HeaderComponent />
      <div className="grid grid-cols-6 gap-4">
        <ChartComponent />
        <OrderBookComponent/>
      </div>
    </div>
  );
}

export default App;
