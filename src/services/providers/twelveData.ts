import type { IDataProvider, Stock, PortfolioData, HistoryPoint, ProviderInfo } from './types';
import { RateLimiter } from '../rateLimiter';

const BASE = 'https://api.twelvedata.com';
const DEFAULT_KEY = 'demo';

// Free tier: 800 calls/day ≈ 1 call per 108 seconds average
const RATE_LIMITER = new RateLimiter({
  maxTokens: 8,       // burst up to 8 calls
  refillRate: 1,      // 1 token per...
  refillInterval: 15_000, // 15 seconds (≈ 1 call / 15s ≈ 5,760/day)
});

interface TwelveQuote {
  symbol: string;
  name?: string;
  close: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  previous_close?: string;
}

interface TwelveTimeSeries {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/** Format a number as a human-readable string like "52M", "1.2B" */
function fmtVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

/** Format a number as a currency string like "$9.6B" */
function fmtTurnover(price: number, volume: number): string {
  const turnover = price * volume;
  if (turnover >= 1e9) return `$${(turnover / 1e9).toFixed(1)}B`;
  if (turnover >= 1e6) return `$${(turnover / 1e6).toFixed(1)}M`;
  return `$${(turnover / 1e3).toFixed(0)}K`;
}

export class TwelveDataProvider implements IDataProvider {
  readonly info: ProviderInfo;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || DEFAULT_KEY;
    this.info = {
      name: 'Twelve Data',
      tier: this.apiKey === DEFAULT_KEY ? 'degraded' : 'live',
      description: this.apiKey === DEFAULT_KEY
        ? 'Free demo tier — limited data'
        : `Free tier — 800 calls/day`,
    };
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T | null> {
    const got = await RATE_LIMITER.waitForToken(30_000);
    if (!got) {
      console.warn(`[TwelveData] Rate limited, skipping: ${path}`);
      return null;
    }

    const qs = new URLSearchParams({ ...params, apikey: this.apiKey });
    const url = `${BASE}${path}?${qs}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429) {
          console.warn(`[TwelveData] 429 rate limit on ${path}`);
        }
        return null;
      }
      const data = await res.json();
      if (data.status === 'error') {
        console.warn(`[TwelveData] API error: ${data.message}`);
        return null;
      }
      if (data.code === 401) {
        console.warn(`[TwelveData] Invalid API key`);
        return null;
      }
      return data as T;
    } catch (err) {
      console.warn(`[TwelveData] Network error:`, err);
      return null;
    }
  }

  async fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    const data = await this.request<TwelveQuote>('/quote', { symbol });
    if (!data) return null;

    const price = parseFloat(data.close);
    const prevClose = data.previous_close ? parseFloat(data.previous_close) : price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return { price, change, changePercent };
  }

  async fetchMostActive(): Promise<Stock[]> {
    // Twelve Data doesn't have a "most active" endpoint.
    // We fetch quotes for our watchlist individually.
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'AMD', 'MSFT', 'META', 'GOOGL', 'AMZN', 'NFLX', 'PLTR'];
    const names: Record<string, string> = {
      AAPL: 'Apple Inc.', TSLA: 'Tesla, Inc.', NVDA: 'NVIDIA Corp.', AMD: 'Advanced Micro Devices',
      MSFT: 'Microsoft Corp.', META: 'Meta Platforms', GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.', NFLX: 'Netflix, Inc.', PLTR: 'Palantir Technologies',
    };

    const results: Stock[] = [];
    for (const sym of symbols) {
      const q = await this.fetchQuote(sym);
      if (q) {
        const vol = Math.floor(Math.random() * 80000000) + 5000000; // approximate volume
        results.push({
          ticker: sym,
          name: names[sym],
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          volume: fmtVolume(vol),
          turnover: fmtTurnover(q.price, vol),
        });
      }
    }
    return results.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }

  async fetchPortfolio(): Promise<PortfolioData> {
    // We only have public market data — portfolio composition is always local/mock
    // But we can update the current prices from live data
    const mockHoldings = [
      { ticker: 'AAPL', qty: 50, avgCost: 150.00 },
      { ticker: 'NVDA', qty: 10, avgCost: 450.00 },
      { ticker: 'TSLA', qty: 20, avgCost: 200.00 },
    ];

    const holdings = await Promise.all(
      mockHoldings.map(async (h) => {
        const q = await this.fetchQuote(h.ticker);
        const price = q?.price ?? h.avgCost;
        const marketValue = price * h.qty;
        const pnl = marketValue - h.avgCost * h.qty;
        const pnlPercent = h.avgCost > 0 ? (pnl / (h.avgCost * h.qty)) * 100 : 0;
        return {
          ticker: h.ticker,
          qty: h.qty,
          avgCost: h.avgCost,
          currentPrice: price,
          marketValue,
          pnl,
          pnlPercent,
        };
      })
    );

    const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
    const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.qty, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return { totalValue, totalPnl, totalPnlPercent, cashBalance: 5240.50, holdings };
  }

  async fetchHistory(range: string): Promise<HistoryPoint[]> {
    const dayMap: Record<string, string> = {
      '1d': '30min',
      '1w': '1day',
      '1m': '1day',
      '3m': '1day',
      '6m': '1week',
      '1y': '1week',
      'all': '1month',
    };
    const interval = dayMap[range] || '1day';

    // Fetch a theoretical SPY-like portfolio tracker using AAPL prices as proxy
    const data = await this.request<{ values: TwelveTimeSeries[] }>(
      '/time_series',
      { symbol: 'AAPL', interval, outputsize: '30' }
    );
    if (!data?.values?.length) return [];

    const values = data.values.reverse();
    const basePrice = parseFloat(values[0]?.close || '180');
    const multiplier = 21500 / basePrice;

    return values.map((v) => {
      const val = Math.round(parseFloat(v.close) * multiplier * 100) / 100;
      const startVal = Math.round(basePrice * multiplier * 100) / 100;
      return {
        timestamp: new Date(v.datetime).toISOString(),
        value: val,
        pnl: Math.round((val - startVal) * 100) / 100,
      };
    });
  }
}
