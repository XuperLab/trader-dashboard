import React, { useEffect, useState } from 'react';
import { fetchCurrentPortfolio } from '../api';
import type { Holding } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CurrentAssetsPanel: React.FC = () => {
  const [data, setData] = useState<{
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    cashBalance: number;
    holdings: Holding[];
  } | null>(null);

  useEffect(() => {
    fetchCurrentPortfolio().then(setData);
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading portfolio...</div>;

  const chartData = data.holdings.map(h => ({ name: h.ticker, value: h.marketValue }));

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-green-400" />
          My Current Assets
        </h2>
        <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          LIVE
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 shadow-sm transition hover:border-slate-700">
          <p className="text-sm text-slate-400 font-medium mb-1">Total Portfolio Value</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-mono font-bold">${data.totalValue.toLocaleString()}</p>
             <span className={`text-sm font-mono flex items-center gap-0.5 ${data.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.totalPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {data.totalPnl > 0 ? '+' : ''}{data.totalPnlPercent.toFixed(2)}%
             </span>
          </div>
        </div>
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 shadow-sm transition hover:border-slate-700">
          <p className="text-sm text-slate-400 font-medium mb-1">Cash Balance</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-mono font-bold">${data.cashBalance.toLocaleString()}</p>
             <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">Settled</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-center mb-8">
         <div className="w-full xl:w-1/3 h-48 flex-shrink-0">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={chartData}
                 innerRadius={50}
                 outerRadius={70}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {chartData.map((_, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                 itemStyle={{ color: '#f1f5f9' }}
               />
             </PieChart>
           </ResponsiveContainer>
         </div>
         <div className="flex-grow grid grid-cols-2 gap-y-3 gap-x-6 w-full">
            {data.holdings.map((h, i) => (
               <div key={h.ticker} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                     <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400 transition">{h.ticker}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{(h.marketValue / data.totalValue * 100).toFixed(1)}%</span>
               </div>
            ))}
         </div>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
         {data.holdings.map((h) => (
            <div key={h.ticker} className="bg-slate-800/20 hover:bg-slate-800/40 transition rounded-lg p-4 flex items-center justify-between border border-transparent hover:border-slate-800">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <p className="font-bold text-blue-400">{h.ticker}</p>
                     <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">x{h.qty}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Cost: ${h.avgCost.toFixed(2)}</p>
               </div>
               <div className="text-right">
                  <p className="text-sm font-mono font-bold">${h.marketValue.toLocaleString()}</p>
                  <p className={`text-xs font-mono flex items-center justify-end gap-1 ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.pnl > 0 ? '+' : ''}{h.pnl.toFixed(2)} ({h.pnlPercent.toFixed(1)}%)
                  </p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default CurrentAssetsPanel;
