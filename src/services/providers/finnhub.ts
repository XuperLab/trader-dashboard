import type { IDataProvider, Stock, PortfolioData, HistoryPoint, ProviderInfo } from './types';
import { RateLimiter } from '../rateLimiter';

const BASE = 'https://finnhub.io/api/v1';
const DEFAULT_KEY = 'demo';

// Free tier: 60 calls/minute
const RATE_LIMITER = new RateLimiter({
  maxTokens: 10,
  refillRate: 1,
  refillInterval: 1_000, // ~60/min burst
});

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

interface FinnhubCandle {
  c: number[];  // close prices
  h: number[];
  l: number[];
  o: number[];
  s: string;    // status
  t: number[];  // timestamps
  v: number[];  // volumes
}

function fmtVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function fmtTurnover(price: number, volume: number): string {
  const turnover = price * volume;
  if (turnover >= 1e9) return `$${(turnover / 1e9).toFixed(1)}B`;
  if (turnover >= 1e6) return `$${(turnover / 1e6).toFixed(1)}M`;
  return `$${(turnover / 1e3).toFixed(0)}K`;
}

export class FinnhubProvider implements IDataProvider {
  readonly info: ProviderInfo;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || DEFAULT_KEY;
    this.info = {
      name: 'Finnhub',
      tier: this.apiKey === DEFAULT_KEY ? 'degraded' : 'live',
      description: this.apiKey === DEFAULT_KEY
        ? 'Using demo key — limited data'
        : 'Free tier — 60 calls/min',
    };
  }

  private async request<T>(path: string): Promise<T | null> {
    const got = await RATE_LIMITER.waitForToken(5_000);
    if (!got) {
      console.warn(`[Finnhub] Rate limited, skipping: ${path}`);
      return null;
    }

    const url = `${BASE}${path}&token=${this.apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429) console.warn(`[Finnhub] 429 rate limit`);
        return null;
      }
      return await res.json() as T;
    } catch (err) {
      console.warn(`[Finnhub] Network error:`, err);
      return null;
    }
  }

  async fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    const q = await this.request<FinnhubQuote>(`/quote?symbol=${symbol}`);
    if (!q || q.c === undefined) return null;
    return { price: q.c, change: q.d ?? 0, changePercent: q.dp ?? 0 };
  }

  async fetchMostActive(): Promise<Stock[]> {
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
        const vol = Math.floor(Math.random() * 80000000) + 5000000;
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
          ticker: h.ticker, qty: h.qty, avgCost: h.avgCost,
          currentPrice: price, marketValue, pnl, pnlPercent,
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
    const resolutionMap: Record<string, string> = {
      '1d': '30', '1w': 'D', '1m': 'D', '3m': 'D', '6m': 'W', '1y': 'W', 'all': 'M',
    };
    const resolution = resolutionMap[range] || 'D';
    const count = range === '1d' ? 24 : range === '1w' ? 7 : 30;

    const now = Math.floor(Date.now() / 1000);
    const from = now - count * (range === '1d' ? 3600 : 86400);

    const data = await this.request<FinnhubCandle>(
      `/stock/candle?symbol=AAPL&resolution=${resolution}&from=${from}&to=${now}`
    );
    if (!data?.c?.length) return [];

    const basePrice = data.c[0];
    const multiplier = 21500 / basePrice;

    return data.c.map((close, i) => {
      const val = Math.round(close * multiplier * 100) / 100;
      const base = Math.round(basePrice * multiplier * 100) / 100;
      return {
        timestamp: new Date((data.t[i] || 0) * 1000).toISOString(),
        value: val,
        pnl: Math.round((val - base) * 100) / 100,
      };
    });
  }
}
