// api.ts — Public API for the trader dashboard
// Forwards all calls through the DataService with automatic fallback.
// Drop-in compatible with the previous mock-only API.

import { dataService } from './services/dataService';
import type { HistoryPoint } from './services/providers/types';
export type { Stock, Holding, PortfolioData, HistoryPoint, ProviderInfo } from './services/providers/types';

// Backward-compatible type alias
export type HistoryData = HistoryPoint;

// ─── Re-export for backward compatibility ───

export const fetchMostActive = async () => {
  const { stocks } = await dataService.fetchMostActive();
  return stocks;
};

export const fetchCurrentPortfolio = async () => {
  const { portfolio } = await dataService.fetchPortfolio();
  return portfolio;
};

export const fetchHistory = async (range: string) => {
  const { history } = await dataService.fetchHistory(range);
  return history;
};

// ─── New: get the current data source info ───

export { dataService } from './services/dataService';
