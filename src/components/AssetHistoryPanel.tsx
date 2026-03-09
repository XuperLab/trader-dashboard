import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import type { HistoryData } from '../api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { History, TrendingUp, TrendingDown, Layers } from 'lucide-react';

const AssetHistoryPanel: React.FC = () => {
  const [data, setData] = useState<HistoryData[]>([]);
  const [range, setRange] = useState<string>('1m');

  const ranges = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' },
  ];

  useEffect(() => {
    fetchHistory(range).then((history) => {
      setData(history);
    });
  }, [range]);

  const latestPnl = data.length > 0 ? data[data.length - 1].pnl : 0;
  const initialValue = data.length > 0 ? data[0].value : 0;
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const totalChange = latestValue - initialValue;
  const totalPercent = initialValue > 0 ? (totalChange / initialValue) * 100 : 0;

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-500/10 rounded-xl">
              <History className="w-6 h-6 text-blue-400" />
           </div>
           <div>
              <h2 className="text-2xl font-bold tracking-tight">Portfolio History</h2>
              <div className="flex items-center gap-3 mt-1">
                 <p className={`text-sm font-mono flex items-center gap-1 ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)} ({totalPercent.toFixed(2)}%)
                 </p>
                 <span className="text-slate-600 text-xs uppercase font-bold tracking-widest">• Total Return</span>
              </div>
           </div>
        </div>
        
        <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 shadow-inner">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition duration-300 ${
                range === r.value 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="bg-slate-950/40 rounded-2xl p-6 border border-slate-800/50">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                Portfolio Value
             </h3>
             <span className="text-xl font-mono font-bold text-blue-400">${latestValue.toLocaleString()}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                   dataKey="timestamp" 
                   tick={{ fill: '#64748b', fontSize: 10 }}
                   tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                   axisLine={false}
                   tickLine={false}
                   minTickGap={30}
                />
                <YAxis 
                   domain={['auto', 'auto']}
                   tick={{ fill: '#64748b', fontSize: 10 }}
                   axisLine={false}
                   tickLine={false}
                   tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950/40 rounded-2xl p-6 border border-slate-800/50">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-green-500" />
                 Cumulative P&L
              </h3>
              <span className={`text-xl font-mono font-bold ${latestPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                 {latestPnl > 0 ? '+' : ''}${latestPnl.toLocaleString()}
              </span>
           </div>
           <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                   dataKey="timestamp" 
                   tick={{ fill: '#64748b', fontSize: 10 }}
                   tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                   axisLine={false}
                   tickLine={false}
                   minTickGap={30}
                />
                <YAxis 
                   tick={{ fill: '#64748b', fontSize: 10 }}
                   axisLine={false}
                   tickLine={false}
                   tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line 
                   type="stepAfter" 
                   dataKey="pnl" 
                   stroke={latestPnl >= 0 ? "#10b981" : "#ef4444"} 
                   strokeWidth={3} 
                   dot={false}
                   activeDot={{ r: 6, fill: '#f1f5f9', stroke: '#10b981' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetHistoryPanel;
