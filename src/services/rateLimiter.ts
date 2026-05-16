// Token-bucket rate limiter
// Tracks API calls per provider and signals when throttled

interface LimiterConfig {
  maxTokens: number;    // Max burst capacity
  refillRate: number;   // Tokens per second
  refillInterval: number; // How often to refill (ms)
}

export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private refillInterval: number;
  private lastRefill: number;
  private totalConsumed: number = 0;

  constructor(config: LimiterConfig) {
    this.maxTokens = config.maxTokens;
    this.tokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.refillInterval = config.refillInterval;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed < this.refillInterval) return;

    const cycles = Math.floor(elapsed / this.refillInterval);
    this.tokens = Math.min(this.maxTokens, this.tokens + cycles * this.refillRate);
    this.lastRefill += cycles * this.refillInterval;
  }

  /** Try to consume 1 token. Returns true if allowed, false if rate-limited. */
  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.totalConsumed += 1;
      return true;
    }
    return false;
  }

  /** Wait until a token is available (up to timeout ms). Returns true if acquired. */
  async waitForToken(timeout: number = 10_000): Promise<boolean> {
    if (this.tryConsume()) return true;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, this.refillInterval));
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        this.totalConsumed += 1;
        return true;
      }
    }
    return false;
  }

  get utilization(): number {
    return this.totalConsumed;
  }

  get remaining(): number {
    return this.tokens;
  }

  get isThrottled(): boolean {
    this.refill();
    return this.tokens < 1;
  }
}
