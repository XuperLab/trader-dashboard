import type { IDataProvider, Stock, PortfolioData, HistoryPoint, ProviderInfo } from './providers/types';
import { TwelveDataProvider } from './providers/twelveData';
import { FinnhubProvider } from './providers/finnhub';
import { MockProvider } from './providers/mock';

export type { Stock, Holding, PortfolioData, HistoryPoint, ProviderInfo } from './providers/types';

type ProviderConstructor = new (...args: any[]) => IDataProvider;

interface ProviderEntry {
  instance: IDataProvider;
  healthy: boolean;
  lastError?: string;
}

/**
 * DataService orchestrates multiple data providers with automatic fallback.
 * 
 * Chain: Twelve Data → Finnhub → Mock (always available)
 * If a provider fails (rate limit, network error, bad response), it's
 * temporarily marked unhealthy and the next provider in the chain is tried.
 * Healthy providers are retried after a cooldown period.
 */
class DataService {
  private providers: ProviderEntry[] = [];
  private activeIndex: number = 0;
  private listeners: Array<(info: ProviderInfo) => void> = [];
  private healthCheckTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.initProviders();
  }

  private initProviders(): void {
    const apiKey = this.getApiKey();

    const constructors: Array<{ ctor: ProviderConstructor; args?: string[] }> = [
      { ctor: TwelveDataProvider },
      { ctor: FinnhubProvider },
      { ctor: MockProvider },
    ];

    this.providers = constructors.map(({ ctor, args }) => ({
      instance: new ctor(...(args || [])),
      healthy: true,
    }));

    // If user has a Twelve Data API key, inject it
    if (apiKey.twelveData) {
      this.providers[0] = {
        instance: new TwelveDataProvider(apiKey.twelveData),
        healthy: true,
      };
    }
    if (apiKey.finnhub) {
      this.providers[1] = {
        instance: new FinnhubProvider(apiKey.finnhub),
        healthy: true,
      };
    }
  }

  private getApiKey(): { twelveData?: string; finnhub?: string } {
    // Read from env vars set in Vite (VITE_ prefix required)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return {
        twelveData: import.meta.env.VITE_TWELVEDATA_KEY || undefined,
        finnhub: import.meta.env.VITE_FINNHUB_KEY || undefined,
      };
    }
    return {};
  }

  /** Get the active (current) provider */
  private get active(): IDataProvider {
    return this.providers[this.activeIndex].instance;
  }

  /** Notify listeners of provider changes */
  private notify(): void {
    const info = this.active.info;
    this.listeners.forEach(fn => fn(info));
  }

  /** Mark a provider as unhealthy and schedule a retry */
  private markUnhealthy(index: number, reason: string): void {
    if (!this.providers[index]) return;
    this.providers[index].healthy = false;
    this.providers[index].lastError = reason;

    // Retry health check after 60 seconds
    if (this.healthCheckTimers.has(index)) {
      clearTimeout(this.healthCheckTimers.get(index)!);
    }
    this.healthCheckTimers.set(index, setTimeout(() => {
      this.providers[index].healthy = true;
      this.providers[index].lastError = undefined;
      // If we're currently on a fallback, try to upgrade back
      if (this.activeIndex > index) {
        this.activeIndex = index;
        console.log(`[DataService] Upgraded to: ${this.active.info.name}`);
        this.notify();
      }
    }, 60_000));
  }

  /**
   * Execute a data method with automatic fallback across providers.
   * Each failed provider is marked unhealthy and we try the next one.
   */
  private async execute<T>(
    fn: (provider: IDataProvider) => Promise<T>,
    methodName: string
  ): Promise<{ data: T; provider: ProviderInfo }> {
    // Try providers from current index forward (cyclic)
    const startIndex = this.activeIndex;
    for (let offset = 0; offset < this.providers.length; offset++) {
      const idx = (startIndex + offset) % this.providers.length;
      const entry = this.providers[idx];
      if (!entry.healthy) continue;

      try {
        const data = await fn(entry.instance);
        if (data === null || (Array.isArray(data) && data.length === 0)) {
          throw new Error(`Empty response from ${entry.instance.info.name}`);
        }

        // On success: if we're not on the primary, upgrade
        if (idx !== this.activeIndex) {
          this.activeIndex = idx;
          this.notify();
        }
        return { data, provider: entry.instance.info };
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[DataService] ${entry.instance.info.name} failed for ${methodName}: ${msg}`);
        this.markUnhealthy(idx, msg);
      }
    }

    // All providers failed — last resort: call Mock directly
    const mock = this.providers[this.providers.length - 1].instance;
    const data = await fn(mock);
    this.activeIndex = this.providers.length - 1;
    this.notify();
    return { data, provider: mock.info };
  }

  // ─── Public API ───

  async fetchMostActive(): Promise<{ stocks: Stock[]; source: ProviderInfo }> {
    const { data, provider } = await this.execute(
      p => p.fetchMostActive(),
      'fetchMostActive'
    );
    return { stocks: data, source: provider };
  }

  async fetchPortfolio(): Promise<{ portfolio: PortfolioData; source: ProviderInfo }> {
    const { data, provider } = await this.execute(
      p => p.fetchPortfolio(),
      'fetchPortfolio'
    );
    return { portfolio: data, source: provider };
  }

  async fetchHistory(range: string): Promise<{ history: HistoryPoint[]; source: ProviderInfo }> {
    const { data, provider } = await this.execute(
      p => p.fetchHistory(range),
      'fetchHistory'
    );
    return { history: data, source: provider };
  }

  /** Subscribe to provider changes. Returns unsubscribe function. */
  onProviderChange(fn: (info: ProviderInfo) => void): () => void {
    this.listeners.push(fn);
    // Immediately notify with current provider
    fn(this.active.info);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  get currentProvider(): ProviderInfo {
    return this.active.info;
  }

  get providerChain(): ProviderInfo[] {
    return this.providers.map(p => ({
      ...p.instance.info,
      name: p.healthy ? p.instance.info.name : `${p.instance.info.name} ⚠️ (degraded)`,
    }));
  }
}

/** Singleton instance */
export const dataService = new DataService();
