/* ==========================================
   CryptoVault — Configuration
   ========================================== */

/**
 * App-wide configuration.
 * CoinGecko free API — no API key needed.
 * Rate limit: ~10-30 req/min on the free tier.
 */
const CONFIG = Object.freeze({
  // CoinGecko free API base
  API_BASE: 'https://api.coingecko.com/api/v3',

  // Default currency
  CURRENCY: 'usd',
  CURRENCY_SYMBOL: '$',

  // Pagination
  COINS_PER_PAGE: 20,

  // Auto-refresh interval (ms) — 60 seconds to stay within rate limits
  REFRESH_INTERVAL: 60_000,

  // Cache duration (ms) — 30 seconds
  CACHE_DURATION: 30_000,

  // Debounce delay for search (ms)
  SEARCH_DEBOUNCE: 300,

  // Chart defaults
  CHART_DAYS: 7,
  CHART_COLORS: {
    green: '#22c55e',
    red:   '#ef4444',
    accent: '#6366f1',
    grid:  'rgba(148,163,184,0.08)',
  },

  // Number formatting locale
  LOCALE: 'en-US',
});
