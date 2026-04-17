import React, { useEffect, useState } from 'react';
import { fetchMostActive } from '../api';
import type { Stock } from '../api';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import MockGraph from './MockGraph';

const MostActiveStocksPanel: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMostActive();
      setStocks(data);
    } catch (error) {
      console.error("Failed to load active stocks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, []);

  const generateMockData = (basePrice: number) => {
    const data = [];
    let currentPrice = basePrice;
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * basePrice * 0.1;
      currentPrice += change;
      data.push({ x: i, y: Math.max(currentPrice, basePrice * 0.7) });
    }
    return data;
  };

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Top 10 Most Active Stocks
        </h2>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>Auto-refreshing (45s)</span>
          <button 
            onClick={loadData}
            className="p-1 hover:bg-slate-800 rounded transition"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && stocks.length === 0 ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="pb-3 px-2">Ticker</th>
                <th className="pb-3 px-2">Company Name</th>
                <th className="pb-3 px-2">Price</th>
                <th className="pb-3 px-2">Change (%)</th>
                <th className="pb-3 px-2">Volume</th>
                <th className="pb-3 px-2">Turnover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stocks.map((stock) => (
                <tr 
                  key={stock.ticker} 
                  className="hover:bg-slate-800/50 cursor-pointer transition text-sm group"
                  onClick={() => setSelectedStock(stock)}
                >
                  <td className="py-4 px-2 font-bold text-blue-400">{stock.ticker}</td>
                  <td className="py-4 px-2 font-medium">{stock.name}</td>
                  <td className="py-4 px-2 font-mono">${stock.price.toFixed(2)}</td>
                  <td className={`py-4 px-2 font-mono flex items-center gap-1 ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </td>
                  <td className="py-4 px-2 text-slate-400">{stock.volume}</td>
                  <td className="py-4 px-2 text-slate-400">{stock.turnover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-bold">{selectedStock.ticker}</h3>
                <p className="text-slate-400">{selectedStock.name}</p>
              </div>
              <button 
                onClick={() => setSelectedStock(null)}
                className="p-2 hover:bg-slate-800 rounded-full transition"
              >
                ✕
              </button>
            </div>
            
            <div className="h-64 mb-6">
              <MockGraph 
                data={generateMockData(selectedStock.price)}
                color="#3b82f6"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-xl font-mono">${selectedStock.price.toFixed(2)}</p>
               </div>
               <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Change</p>
                  <p className={`text-xl font-mono ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                  </p>
               </div>
               <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Vol</p>
                  <p className="text-xl font-mono">{selectedStock.volume}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MostActiveStocksPanel;