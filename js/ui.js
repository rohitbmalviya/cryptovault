/* ==========================================
   CryptoVault — UI Helpers
   ========================================== */

const UI = (() => {

  /* ---- Number Formatting ---- */

  /**
   * Format a number as compact currency (e.g., $1.2T, $456.7B).
   */
  function formatCompact(num) {
    if (num == null || isNaN(num)) return '—';
    const absNum = Math.abs(num);
    if (absNum >= 1e12)      return CONFIG.CURRENCY_SYMBOL + (num / 1e12).toFixed(2) + 'T';
    if (absNum >= 1e9)       return CONFIG.CURRENCY_SYMBOL + (num / 1e9).toFixed(2) + 'B';
    if (absNum >= 1e6)       return CONFIG.CURRENCY_SYMBOL + (num / 1e6).toFixed(2) + 'M';
    if (absNum >= 1e3)       return CONFIG.CURRENCY_SYMBOL + (num / 1e3).toFixed(1) + 'K';
    return CONFIG.CURRENCY_SYMBOL + num.toFixed(2);
  }

  /**
   * Format price with proper decimal places.
   */
  function formatPrice(price) {
    if (price == null || isNaN(price)) return '—';
    if (price >= 1) {
      return CONFIG.CURRENCY_SYMBOL + price.toLocaleString(CONFIG.LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    // For small prices, show more decimals
    if (price >= 0.01) {
      return CONFIG.CURRENCY_SYMBOL + price.toFixed(4);
    }
    return CONFIG.CURRENCY_SYMBOL + price.toFixed(8);
  }

  /**
   * Format percentage change.
   */
  function formatPercent(val) {
    if (val == null || isNaN(val)) return '—';
    const sign = val >= 0 ? '+' : '';
    return sign + val.toFixed(2) + '%';
  }

  /**
   * Get CSS class for positive/negative values.
   */
  function changeClass(val) {
    if (val == null || isNaN(val)) return '';
    return val >= 0 ? 'text-green' : 'text-red';
  }
  function changeBgClass(val) {
    if (val == null || isNaN(val)) return '';
    return val >= 0 ? 'bg-green text-green' : 'bg-red text-red';
  }


  /* ---- DOM Helpers ---- */

  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Set innerHTML safely (no user-generated content is injected as raw HTML
   * since all data comes from CoinGecko API responses and we sanitize descriptions).
   */
  function setHTML(el, html) {
    if (typeof el === 'string') el = $(el);
    if (el) el.innerHTML = html;
  }

  function setText(el, text) {
    if (typeof el === 'string') el = $(el);
    if (el) el.textContent = text;
  }

  /**
   * Sanitize HTML from API descriptions.
   */
  function sanitizeHTML(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    // Remove scripts and iframes
    div.querySelectorAll('script, iframe, object, embed, form').forEach(el => el.remove());
    // Allow only basic tags
    return div.innerHTML;
  }


  /* ---- Toast Notifications ---- */

  function showToast(message, duration = 3000) {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }


  /* ---- Debounce ---- */

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }


  return Object.freeze({
    formatCompact,
    formatPrice,
    formatPercent,
    changeClass,
    changeBgClass,
    $,
    $$,
    setHTML,
    setText,
    sanitizeHTML,
    showToast,
    debounce,
  });
})();
