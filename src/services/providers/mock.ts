import type { IDataProvider, Stock, PortfolioData, HistoryPoint, ProviderInfo } from './types';

/** Stable mock data — always available, no rate limits, no network dependency */
export class MockProvider implements IDataProvider {
  readonly info: ProviderInfo = {
    name: 'Mock Data',
    tier: 'mock',
    description: 'Static demo data — no network required',
  };

  async fetchMostActive(): Promise<Stock[]> {
    return [
      { ticker: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 1.25, changePercent: 0.68, volume: '52M', turnover: '$9.6B' },
      { ticker: 'TSLA', name: 'Tesla, Inc.', price: 175.05, change: -2.40, changePercent: -1.35, volume: '110M', turnover: '$19.2B' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 3.15, changePercent: 0.36, volume: '45M', turnover: '$39.4B' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', price: 160.20, change: -1.80, changePercent: -1.11, volume: '65M', turnover: '$10.4B' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', price: 415.50, change: 0.85, changePercent: 0.20, volume: '22M', turnover: '$9.1B' },
      { ticker: 'META', name: 'Meta Platforms', price: 495.10, change: 1.10, changePercent: 0.22, volume: '18M', turnover: '$8.9B' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 155.40, change: -0.50, changePercent: -0.32, volume: '25M', turnover: '$3.8B' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 178.20, change: 0.60, changePercent: 0.34, volume: '32M', turnover: '$5.7B' },
      { ticker: 'NFLX', name: 'Netflix, Inc.', price: 610.50, change: 2.30, changePercent: 0.38, volume: '5M', turnover: '$3.1B' },
      { ticker: 'PLTR', name: 'Palantir Technologies', price: 25.15, change: 5.20, changePercent: 26.06, volume: '85M', turnover: '$2.1B' },
    ];
  }

  async fetchPortfolio(): Promise<PortfolioData> {
    return {
      totalValue: 21549.80,
      totalPnl: 5549.80,
      totalPnlPercent: 34.69,
      cashBalance: 5240.50,
      holdings: [
        { ticker: 'AAPL', qty: 50, avgCost: 150.00, currentPrice: 185.92, marketValue: 9296.00, pnl: 1796.00, pnlPercent: 23.95 },
        { ticker: 'NVDA', qty: 10, avgCost: 450.00, currentPrice: 875.28, marketValue: 8752.80, pnl: 4252.80, pnlPercent: 94.51 },
        { ticker: 'TSLA', qty: 20, avgCost: 200.00, currentPrice: 175.05, marketValue: 3501.00, pnl: -499.00, pnlPercent: -12.48 },
      ],
    };
  }

  async fetchHistory(range: string): Promise<HistoryPoint[]> {
    const points = range === '1d' ? 24 : range === '1w' ? 7 : 30;
    const data: HistoryPoint[] = [];
    let baseValue = 18000;

    for (let i = 0; i < points; i++) {
      const value = baseValue + Math.random() * 1000 - 200;
      data.push({
        timestamp: new Date(Date.now() - (points - i) * 3600000 * (range === '1d' ? 1 : 24)).toISOString(),
        value: Math.round(value * 100) / 100,
        pnl: Math.round((value - 16000) * 100) / 100,
      });
      baseValue = value;
    }
    return data;
  }

  async fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    const stocks = await this.fetchMostActive();
    const found = stocks.find(s => s.ticker === symbol);
    if (found) return { price: found.price, change: found.change, changePercent: found.changePercent };
    return null;
  }
}
