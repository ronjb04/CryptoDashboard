import 'chartjs-adapter-date-fns';
import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useSelector, useDispatch } from 'react-redux';
import { getHistoricalData } from '../../api/coinbaseApi';
import { useScreenDetector } from '../../hooks/useScreenDetector';

const chartInitialState = {
  labels: [],
  datasets: [
    { label: 'Best Bid', data: [], borderColor: 'rgb(22, 163, 74)', fill: true, tension: 0.1 },
    { label: 'Best Ask', data: [], borderColor: 'rgb(220, 38, 38)', fill: true, tension: 0.1 },
  ],
}

export const ChartComponent = () => {
  const dispatch = useDispatch();
  const { isMobile, isTablet, isDesktop } = useScreenDetector();
  const selectedCurrency = useSelector((state) => state.selectedCurrency);
  const previousCurrencyRef = useRef();
  const tickerData = useSelector((state) => state.ticker.data);

  const [viewMode, setViewMode] = useState('Real-Time');
  const [historicalData, setHistoricalData] = useState(chartInitialState);
  const [chartData, setChartData] = useState(chartInitialState);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const isFetched = useRef(false);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      isFetched.current = true;
      previousCurrencyRef.current = selectedCurrency;
      try {
        const historyData = await getHistoricalData(selectedCurrency);
        const labels = historyData.map(data => new Date(data?.timestamp * 1000).toLocaleTimeString());
        const bestBids = historyData.map(data => data?.low); 
        const bestAsks = historyData.map(data => data?.high);

        if(viewMode === "Historical"){
          chartInstanceRef.current.data.labels = labels;
          chartInstanceRef.current.data.datasets = [
            { label: 'Best Bid', data: bestBids, borderColor: 'rgb(22, 163, 74)', fill: true, tension: 0.1 },
            { label: 'Best Ask', data: bestAsks, borderColor: 'rgb(220, 38, 38)', fill: true, tension: 0.1 },
          ]
          chartInstanceRef.current.update();
        }

        setHistoricalData({
          labels: labels,
          datasets: [
            { label: 'Best Bid', data: bestBids, borderColor: 'rgb(22, 163, 74)', fill: true, tension: 0.1 },
            { label: 'Best Ask', data: bestAsks, borderColor: 'rgb(220, 38, 38)', fill: true, tension: 0.1 },
          ],
        });
      } catch (error) {
        console.error('Failed to load historicalData');
      }
    };
    if(previousCurrencyRef.current !== selectedCurrency) isFetched.current = false
    if (isFetched.current) return;
    fetchHistoricalData();
  }, [selectedCurrency]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: viewMode === 'Historical' ? historicalData : chartData,
        options: {
          responsive: true,
          scales: {
            x: {
              beginAtZero: false,
              ticks: {
                color: 'rgb(203, 213, 225)',
                display: !isMobile,
                autoSkipPadding: 30,
                padding: 30
              },
            },
            y: {
              beginAtZero: false,
              ticks: {
                color: 'rgb(203, 213, 225)', 
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                boxWidth: 10,
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
                color: 'rgb(203, 213, 225)', 
              }
            },
          },
          
        },
      });
    }
  }, [chartData]);

  useEffect(() => {
    chartInstanceRef.current.config.options.scales.x.ticks.display = !isMobile;
    chartInstanceRef.current.update(); 
  }, [isMobile, isTablet, isDesktop]);

  useEffect(() => {
    if (!tickerData || !chartInstanceRef.current) return;

    const time = new Date(tickerData.time).toLocaleTimeString();
    const bestBid = parseFloat(tickerData.best_bid);
    const bestAsk = parseFloat(tickerData.best_ask);

    let lastLabel = chartInstanceRef.current.data.labels[chartInstanceRef.current.data.labels.length - 1];
    if(viewMode !== 'Real-Time' ){
      lastLabel = chartData.labels[chartData.labels.length - 1];
    }
    if (lastLabel !== time) {
      if(viewMode === 'Real-Time' ){
        chartInstanceRef.current.data.labels.push(time);
        chartInstanceRef.current.data.datasets[0].data.push(bestBid);
        chartInstanceRef.current.data.datasets[1].data.push(bestAsk);
        chartInstanceRef.current.update(); 
      }

      setChartData(prevData => ({
        labels: [...prevData.labels, time],
        datasets: [
          { ...prevData.datasets[0], data: [...prevData.datasets[0].data, bestBid] },
          { ...prevData.datasets[1], data: [...prevData.datasets[1].data, bestAsk] },
        ],
      }));
    }
  }, [tickerData]);

  useEffect(() => {
    if (!selectedCurrency) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.labels = [];
      chartInstanceRef.current.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      chartInstanceRef.current.update();
    }

    // Reset chartData state
    setChartData(chartInitialState);
  }, [selectedCurrency, dispatch]);

  // Handle view mode change
  const handleViewModeChange = (event) => {
    setViewMode(event.target.value);
    chartInstanceRef.current.data = event.target.value === 'Historical' ? historicalData : chartData;
    chartInstanceRef.current.update();
  };

  return (
    <div className='min-w-full col-span-6 sm:col-span-4'>
      <h3 className='text-base sm:text-xl font-bold text-left sm:text-center mt-5 -mb-4 pl-8 sm:mt-0 sm:px-0 sm:py-2'>Price Chart: {selectedCurrency}</h3>
      <div className="flex flex-col justify-start items-end">
        <div className='-mt-6 sm:mt-0 -mb-2 sm:-mb-6 relative z-10 mr-2'>
          <h3 className='mb-1 text-right text-sm sm:text-base'>View Mode</h3>
          <form>
            <select 
              className="block min-w-24 sm:min-w-32 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-base text-gray-200 border border-gray-600 rounded-lg bg-gray-700 focus:ring-gray-500 focus:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500 focus-visible:outline-none"
              value={viewMode}
              onChange={handleViewModeChange}
            >
              <option value="Real-Time">Real-Time</option>
              <option value="Historical">Historical</option>
            </select>
          </form>
        </div>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};
