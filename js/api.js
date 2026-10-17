/* ==========================================
   CryptoVault — API Layer
   ==========================================
   All network requests are centralized here.
   Uses CoinGecko free API (no key required).
   Implements request caching and error handling.
   ========================================== */

const CryptoAPI = (() => {
  // Simple in-memory cache
  const _cache = new Map();

  /**
   * Fetch with caching and error handling.
   * @param {string} url
   * @param {number} [cacheDuration] - ms to cache (0 = no cache)
   * @returns {Promise<any>}
   */
  async function _fetch(url, cacheDuration = CONFIG.CACHE_DURATION) {
    // Check cache
    if (cacheDuration > 0 && _cache.has(url)) {
      const { data, timestamp } = _cache.get(url);
      if (Date.now() - timestamp < cacheDuration) {
        return data;
      }
      _cache.delete(url);
    }

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited — please wait a moment and try again.');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Store in cache
    if (cacheDuration > 0) {
      _cache.set(url, { data, timestamp: Date.now() });
    }

    return data;
  }

  /**
   * Get global market statistics.
   */
  async function getGlobalData() {
    const url = `${CONFIG.API_BASE}/global`;
    return _fetch(url);
  }

  /**
   * Get paginated coin list with market data.
   * @param {number} page - Page number (1-indexed)
   * @param {number} perPage - Coins per page
   * @param {string} order - Sort order
   */
  async function getCoins(page = 1, perPage = CONFIG.COINS_PER_PAGE, order = 'market_cap_desc') {
    const url = `${CONFIG.API_BASE}/coins/markets?vs_currency=${CONFIG.CURRENCY}` +
      `&order=${order}&per_page=${perPage}&page=${page}` +
      `&sparkline=true&price_change_percentage=1h%2C24h%2C7d`;
    return _fetch(url);
  }

  /**
   * Get detailed data for a single coin.
   * @param {string} coinId - CoinGecko coin id
   */
  async function getCoinDetail(coinId) {
    const url = `${CONFIG.API_BASE}/coins/${coinId}` +
      `?localization=false&tickers=false&community_data=false&developer_data=false`;
    return _fetch(url, 60_000); // Cache 1 min
  }

  /**
   * Get price history for a coin.
   * @param {string} coinId
   * @param {number} days - Number of days (1, 7, 30, 90, 365, max)
   */
  async function getCoinChart(coinId, days = CONFIG.CHART_DAYS) {
    const url = `${CONFIG.API_BASE}/coins/${coinId}/market_chart` +
      `?vs_currency=${CONFIG.CURRENCY}&days=${days}`;
    return _fetch(url, 120_000); // Cache 2 min
  }

  /**
   * Get trending coins (top 7 searched in last 24h).
   */
  async function getTrending() {
    const url = `${CONFIG.API_BASE}/search/trending`;
    return _fetch(url, 120_000);
  }

  /**
   * Search coins by query string.
   * @param {string} query
   */
  async function searchCoins(query) {
    const url = `${CONFIG.API_BASE}/search?query=${encodeURIComponent(query)}`;
    return _fetch(url, 30_000);
  }

  /**
   * Clear entire cache.
   */
  function clearCache() {
    _cache.clear();
  }

  return Object.freeze({
    getGlobalData,
    getCoins,
    getCoinDetail,
    getCoinChart,
    getTrending,
    searchCoins,
    clearCache,
  });
})();
