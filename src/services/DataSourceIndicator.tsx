import React, { useEffect, useState } from 'react';
import { dataService, type ProviderInfo } from '../services/dataService';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const tierConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  live: {
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/25',
    icon: <Wifi className="w-3 h-3" />,
  },
  degraded: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/25',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  mock: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/25',
    icon: <WifiOff className="w-3 h-3" />,
  },
};

export const DataSourceIndicator: React.FC = () => {
  const [provider, setProvider] = useState<ProviderInfo>(dataService.currentProvider);

  useEffect(() => {
    return dataService.onProviderChange(setProvider);
  }, []);

  const cfg = tierConfig[provider.tier] || tierConfig.mock;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      <span>{provider.name}</span>
      <span className="opacity-60">•</span>
      <span className="opacity-80">{provider.tier === 'live' ? 'Live' : provider.tier === 'degraded' ? 'Demo' : 'Offline'}</span>
      <Activity className="w-3 h-3 opacity-50" />
    </div>
  );
};
