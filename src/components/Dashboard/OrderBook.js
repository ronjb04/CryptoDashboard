import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { connectLevel2BatchWebSocket } from '../../api/coinbaseApi';

export const OrderBookComponent = () => {
  const dispatch = useDispatch();
  const selectedCurrency = useSelector((state) => state.selectedCurrency);
  const level2BatchData = useSelector((state) => state.level2Batch.data);

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [spread, setSpread] = useState(null);
  const [aggregationLevel, setAggregationLevel] = useState(0);
  const [depth, setDepth] = useState(15);

  useEffect(() => {
    if (level2BatchData) {
      let updatedBids = [...bids];
      let updatedAsks = [...asks];

      level2BatchData?.changes?.forEach(([side, price, size]) => {
        price = parseFloat(price);
        size = parseFloat(size);

        const aggregatedPrice = aggregationLevel > 0 ? Math.round(price / aggregationLevel) * aggregationLevel : price;

        if (side === 'buy') {
          const bidIndex = updatedBids.findIndex(order => order.price === aggregatedPrice);
          if (size === 0 && bidIndex > -1) {
            updatedBids.splice(bidIndex, 1);
          } else if (size > 0) {
            if (bidIndex > -1) {
              updatedBids[bidIndex].size += size;
            } else {
              updatedBids.push({ price: aggregatedPrice, size });
            }
          }
        } else if (side === 'sell') {
          const askIndex = updatedAsks.findIndex(order => order.price === aggregatedPrice);
          if (size === 0 && askIndex > -1) {
            updatedAsks.splice(askIndex, 1);
          } else if (size > 0) {
            if (askIndex > -1) {
              updatedAsks[askIndex].size += size;
            } else {
              updatedAsks.push({ price: aggregatedPrice, size });
            }
          }
        }
      });

      updatedBids = updatedBids.sort((a, b) => b.price - a.price).slice(0, depth);
      updatedAsks = updatedAsks.sort((a, b) => a.price - b.price).slice(0, depth);

      setBids(updatedBids);
      setAsks(updatedAsks);
    }
  }, [level2BatchData, aggregationLevel, depth]);

  const handleAggregationChange = (event) => {
    setAggregationLevel(parseFloat(event.target.value));
  };

  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10)); 
  };

  const maxMarketSize = Math.max(
    ...bids.map(order => order.size),
    ...asks.map(order => order.size)
  );

  useEffect(() => {
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
      const midPrice = (bestBid + bestAsk) / 2;
      const calculatedSpread = ((bestAsk - bestBid) / midPrice) * 100;
      setSpread(calculatedSpread.toFixed(4));
    }
  }, [bids, asks]);

  useEffect(() => {
    if (!selectedCurrency) return;

    const unsubscribe = dispatch(connectLevel2BatchWebSocket([selectedCurrency]));
    return () => {
      unsubscribe();
    };
  }, [selectedCurrency, dispatch]);

  useEffect(() => {
    setBids([]);
    setAsks([]);
    setSpread(null);
  }, [selectedCurrency]);

  return (
    <div className='min-w-full col-span-6 sm:col-span-2 px-2 sm:px-0'>
      <h3 className='text-base sm:text-xl font-bold text-center py-2'>Order Book: {selectedCurrency}</h3>
      <div className="flex w-full justify-between mb-4">
        <dl className='w-1/2'>
          <dt className='mb-1 text-sm sm:text-base'>Spread:</dt>
          <dd className='inline-block leading-tight px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-base text-gray-200 border border-slate-600 rounded-lg bg-slate-800 dark:bg-slate-700 dark:border-slate-700 dark:text-white'>{spread !== null ? `${spread}%` : 'Calculating...'}</dd>
        </dl>
        <div className='flex w-1/2 justify-end'>
          <div className='mr-5'>
            <h3 className='mb-1 text-sm sm:text-base'>Depth</h3>
            <form>
              <select 
                className="block w-full px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-base text-gray-200 border border-gray-600 rounded-lg bg-gray-700 focus:ring-gray-500 focus:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500 focus-visible:outline-none"
                value={depth}
                onChange={handleDepthChange} 
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </form>
          </div>
          <div>
            <h3 className='mb-1 text-sm sm:text-base'>Aggregation</h3>
            <form>
              <select 
                className="block w-full px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-base text-gray-200 border border-gray-600 rounded-lg bg-gray-700 focus:ring-gray-500 focus:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500 focus-visible:outline-none"
                value={aggregationLevel}
                onChange={handleAggregationChange}
              >
                <option value={0}>None</option>
                <option value={0.01}>0.01</option>
                <option value={0.05}>0.05</option>
                <option value={0.10}>0.10</option>
              </select>
            </form>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className='max-h-[calc(100vh-260px)] overflow-auto custom-scrollbar pb-4 sm:pb-0'>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className='w-0/2'></th>
                <th className='w-1/2 text-left text-sm sm:text-base'>Market Size</th>
                <th className='w-1/2 text-left text-sm sm:text-base'>Price</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => {
                const width = (bid.size / maxMarketSize) * 100;
                return (
                  <tr key={index} className="relative">
                    <td className="block bg-green-600 absolute right-0 top-0 h-full opacity-90" style={{ width: `${width}%` }}></td>
                    <td className="relative z-10 w-1/2 text-sm sm:text-base">{bid.size.toFixed(8)}</td>
                    <td className="relative z-10 w-1/2 text-sm sm:text-base">{bid.price.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className='max-h-[calc(100vh-260px)] overflow-auto custom-scrollbar pb-4 sm:pb-0'>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className='w-0/2'></th>
                <th className='w-1/2 text-left text-sm sm:text-base'>Price</th>
                <th className='w-1/2 text-left text-sm sm:text-base'>Market Size</th>
              </tr>
            </thead>
            <tbody>
              {asks.map((ask, index) => {
                const width = (ask.size / maxMarketSize) * 100;
                return (
                  <tr key={index} className="relative">
                    <td className="block bg-red-600 absolute left-0 top-0 h-full opacity-90" style={{ width: `${width}%` }}></td>
                    <td className="relative z-10 w-1/2 text-sm sm:text-base">{ask.price.toFixed(2)}</td>
                    <td className="relative z-10 w-1/2 text-sm sm:text-base">{ask.size.toFixed(8)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
