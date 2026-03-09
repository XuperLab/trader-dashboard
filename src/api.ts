// api.ts
export interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
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

export interface HistoryData {
  timestamp: string;
  value: number;
  pnl: number;
}

// TODO: Replace with real API keys and endpoints
// const BASE_URL = "/api";

export const fetchMostActive = async (): Promise<Stock[]> => {
  // Mocking /api/market/most-active?limit=10
  return [
    { ticker: "AAPL", name: "Apple Inc.", price: 185.92, change: 1.25, volume: "52M", turnover: "$9.6B" },
    { ticker: "TSLA", name: "Tesla, Inc.", price: 175.05, change: -2.4, volume: "110M", turnover: "$19.2B" },
    { ticker: "NVDA", name: "NVIDIA Corp.", price: 875.28, change: 3.15, volume: "45M", turnover: "$39.4B" },
    { ticker: "AMD", name: "Advanced Micro Devices", price: 160.20, change: -1.8, volume: "65M", turnover: "$10.4B" },
    { ticker: "MSFT", name: "Microsoft Corp.", price: 415.50, change: 0.85, volume: "22M", turnover: "$9.1B" },
    { ticker: "META", name: "Meta Platforms", price: 495.10, change: 1.1, volume: "18M", turnover: "$8.9B" },
    { ticker: "GOOGL", name: "Alphabet Inc.", price: 155.40, change: -0.5, volume: "25M", turnover: "$3.8B" },
    { ticker: "AMZN", name: "Amazon.com Inc.", price: 178.20, change: 0.6, volume: "32M", turnover: "$5.7B" },
    { ticker: "NFLX", name: "Netflix, Inc.", price: 610.50, change: 2.3, volume: "5M", turnover: "$3.1B" },
    { ticker: "PLTR", name: "Palantir Technologies", price: 25.15, change: 5.2, volume: "85M", turnover: "$2.1B" },
  ];
};

export const fetchCurrentPortfolio = async () => {
  // Mocking /api/portfolio/current
  const holdings: Holding[] = [
    { ticker: "AAPL", qty: 50, avgCost: 150.0, currentPrice: 185.92, marketValue: 9296.0, pnl: 1796.0, pnlPercent: 23.95 },
    { ticker: "NVDA", qty: 10, avgCost: 450.0, currentPrice: 875.28, marketValue: 8752.8, pnl: 4252.8, pnlPercent: 94.51 },
    { ticker: "TSLA", qty: 20, avgCost: 200.0, currentPrice: 175.05, marketValue: 3501.0, pnl: -499.0, pnlPercent: -12.48 },
  ];

  return {
    totalValue: 21549.8,
    totalPnl: 5549.8,
    totalPnlPercent: 34.69,
    cashBalance: 5240.5,
    holdings
  };
};

export const fetchHistory = async (range: string): Promise<HistoryData[]> => {
  // Mocking /api/portfolio/history?range={range}
  const points = range === '1d' ? 24 : range === '1w' ? 7 : 30;
  const data: HistoryData[] = [];
  let baseValue = 18000;
  
  for (let i = 0; i < points; i++) {
    const value = baseValue + Math.random() * 1000 - 200;
    data.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000 * (range === '1d' ? 1 : 24)).toISOString(),
      value: value,
      pnl: value - 16000
    });
    baseValue = value;
  }
  return data;
};
