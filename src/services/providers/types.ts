// Service layer types and provider interface
// All providers implement this interface

export interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  turnover: string;
}

export interface Holding {
  ticker: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioData {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  cashBalance: number;
  holdings: Holding[];
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
  pnl: number;
}

export interface ProviderInfo {
  name: string;
  tier: 'live' | 'degraded' | 'mock';
  description: string;
}

export interface IDataProvider {
  readonly info: ProviderInfo;
  fetchMostActive(): Promise<Stock[]>;
  fetchPortfolio(): Promise<PortfolioData>;
  fetchHistory(range: string): Promise<HistoryPoint[]>;
  fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null>;
}
