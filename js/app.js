/* ==========================================
   CryptoVault — Main Application
   ==========================================
   Orchestrates all modules: API, UI, Charts.
   ========================================== */

;(function App() {
  'use strict';

  /* ==========================================
     State
     ========================================== */
  const state = {
    coins: [],        // Current page coins
    allCoins: [],     // Full list for client-side search
    filtered: [],     // After search/filter
    page: 1,
    totalPages: 1,
    sortOrder: 'market_cap_desc',
    searchQuery: '',
    filter: 'all',    // 'all', 'gainers', 'losers'
    refreshTimer: null,
    isLoading: false,
  };


  /* ==========================================
     DOM References
     ========================================== */
  const DOM = {
    preloader:    UI.$('#preloader'),
    header:       UI.$('#header'),
    navMenu:      UI.$('#nav-menu'),
    navToggle:    UI.$('#nav-toggle'),
    navClose:     UI.$('#nav-close'),
    navLinks:     UI.$$('.nav__link'),
    themeToggle:  UI.$('#theme-toggle'),
    themeIcon:    UI.$('.theme-icon'),
    tickerTrack:  UI.$('#ticker-track'),
    // Hero stats
    globalMcap:       UI.$('#global-market-cap'),
    globalMcapChange: UI.$('#global-market-cap-change'),
    globalVolume:     UI.$('#global-volume'),
    btcDominance:     UI.$('#btc-dominance'),
    activeCoins:      UI.$('#active-coins'),
    // Dashboard
    dashCards:    UI.$('#dashboard-cards'),
    // Market
    searchInput:  UI.$('#search-input'),
    sortSelect:   UI.$('#sort-select'),
    filterBtns:   UI.$$('.filter-btn'),
    tableBody:    UI.$('#market-tbody'),
    tableLoading: UI.$('#table-loading'),
    tableEmpty:   UI.$('#table-empty'),
    prevPage:     UI.$('#prev-page'),
    nextPage:     UI.$('#next-page'),
    pageInfo:     UI.$('#page-info'),
    // Trending
    trendingGrid: UI.$('#trending-grid'),
    // Modal
    coinModal:   UI.$('#coin-modal'),
    modalClose:  UI.$('#modal-close'),
    modalHeader: UI.$('#modal-header'),
    modalBody:   UI.$('#modal-body'),
    modalStats:  UI.$('#modal-stats'),
    modalDesc:   UI.$('#modal-description'),
    // Misc
    backToTop:   UI.$('#back-to-top'),
  };


  /* ==========================================
     Initialization
     ========================================== */
  async function init() {
    setupTheme();
    setupNavigation();
    setupEventListeners();
    setupKeyboard();

    // Load data in parallel
    try {
      await Promise.all([
        loadGlobalData(),
        loadCoins(),
        loadTrending(),
      ]);
    } catch (err) {
      console.error('Init error:', err);
      UI.showToast('Failed to load data. Retrying...');
      // Retry once after 3 sec
      setTimeout(() => Promise.all([loadGlobalData(), loadCoins(), loadTrending()]), 3000);
    }

    // Hide preloader
    setTimeout(() => {
      DOM.preloader?.classList.add('hidden');
    }, 2000);

    // Start auto-refresh
    state.refreshTimer = setInterval(async () => {
      try {
        await Promise.all([loadGlobalData(), loadCoins()]);
      } catch (_) { /* silent retry next cycle */ }
    }, CONFIG.REFRESH_INTERVAL);
  }


  /* ==========================================
     Theme
     ========================================== */
  function setupTheme() {
    const saved = localStorage.getItem('cv-theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      DOM.themeIcon.textContent = '🌙';
    }

    DOM.themeToggle?.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cv-theme', next);
      DOM.themeIcon.textContent = next === 'light' ? '🌙' : '☀';
    });
  }


  /* ==========================================
     Navigation
     ========================================== */
  function setupNavigation() {
    // Mobile menu
    DOM.navToggle?.addEventListener('click', () => {
      DOM.navMenu?.classList.add('active');
    });
    DOM.navClose?.addEventListener('click', () => {
      DOM.navMenu?.classList.remove('active');
    });

    // Close on link click (mobile)
    DOM.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        DOM.navMenu?.classList.remove('active');
      });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          DOM.navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-section') === id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -60% 0px' });
    sections.forEach(s => observer.observe(s));

    // Header scroll effect
    window.addEventListener('scroll', () => {
      DOM.header?.classList.toggle('scrolled', window.scrollY > 50);
      DOM.backToTop?.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    // Back to top
    DOM.backToTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ==========================================
     Event Listeners
     ========================================== */
  function setupEventListeners() {
    // Search
    const debouncedSearch = UI.debounce((q) => {
      state.searchQuery = q.trim().toLowerCase();
      state.page = 1;
      applyFilters();
    }, CONFIG.SEARCH_DEBOUNCE);

    DOM.searchInput?.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    // Sort
    DOM.sortSelect?.addEventListener('change', (e) => {
      state.sortOrder = e.target.value;
      state.page = 1;
      loadCoins();
    });

    // Filter buttons
    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        state.page = 1;
        applyFilters();
      });
    });

    // Pagination
    DOM.prevPage?.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        loadCoins();
        scrollToSection('markets');
      }
    });
    DOM.nextPage?.addEventListener('click', () => {
      state.page++;
      loadCoins();
      scrollToSection('markets');
    });

    // Modal close
    DOM.modalClose?.addEventListener('click', closeModal);
    DOM.coinModal?.addEventListener('click', (e) => {
      if (e.target === DOM.coinModal) closeModal();
    });
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // "/" focuses search
      if (e.key === '/' && document.activeElement !== DOM.searchInput) {
        e.preventDefault();
        DOM.searchInput?.focus();
      }
      // Escape closes modal
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  /* ==========================================
     Data Loading
     ========================================== */

  /** Load global market stats */
  async function loadGlobalData() {
    try {
      const res = await CryptoAPI.getGlobalData();
      const g = res.data;

      UI.setText(DOM.globalMcap, UI.formatCompact(g.total_market_cap?.usd));
      UI.setText(DOM.globalVolume, UI.formatCompact(g.total_volume?.usd));
      UI.setText(DOM.btcDominance, g.market_cap_percentage?.btc?.toFixed(1) + '%');
      UI.setText(DOM.activeCoins, g.active_cryptocurrencies?.toLocaleString());

      const mcapChange = g.market_cap_change_percentage_24h_usd;
      if (DOM.globalMcapChange) {
        DOM.globalMcapChange.textContent = UI.formatPercent(mcapChange);
        DOM.globalMcapChange.className = 'stat-card__change ' + UI.changeBgClass(mcapChange);
      }

      // Populate ticker bar
      renderTicker(g);
    } catch (err) {
      console.error('Global data error:', err);
    }
  }

  /** Load coins for the current page */
  async function loadCoins() {
    state.isLoading = true;
    showTableLoading(true);

    try {
      const coins = await CryptoAPI.getCoins(state.page, CONFIG.COINS_PER_PAGE, state.sortOrder);
      state.coins = coins;
      state.allCoins = coins;
      applyFilters();

      // Update dashboard cards (top 4)
      if (state.page === 1 && state.filter === 'all' && !state.searchQuery) {
        renderDashboardCards(coins.slice(0, 4));
      }
    } catch (err) {
      console.error('Coins error:', err);
      UI.showToast('Error loading market data.');
    }

    state.isLoading = false;
    showTableLoading(false);
  }

  /** Load trending coins */
  async function loadTrending() {
    try {
      const res = await CryptoAPI.getTrending();
      renderTrending(res.coins || []);
    } catch (err) {
      console.error('Trending error:', err);
    }
  }


  /* ==========================================
     Filtering & Sorting (client-side)
     ========================================== */
  function applyFilters() {
    let coins = [...state.allCoins];

    // Search
    if (state.searchQuery) {
      coins = coins.filter(c =>
        c.name.toLowerCase().includes(state.searchQuery) ||
        c.symbol.toLowerCase().includes(state.searchQuery)
      );
    }

    // Filter
    if (state.filter === 'gainers') {
      coins = coins.filter(c => c.price_change_percentage_24h > 0);
    } else if (state.filter === 'losers') {
      coins = coins.filter(c => c.price_change_percentage_24h < 0);
    }

    state.filtered = coins;
    renderMarketTable(coins);
    updatePagination();

    // Show empty state if needed
    if (coins.length === 0 && !state.isLoading) {
      DOM.tableEmpty?.classList.remove('hidden');
    } else {
      DOM.tableEmpty?.classList.add('hidden');
    }
  }


  /* ==========================================
     Renderers
     ========================================== */

  /** Render the scrolling ticker bar */
  function renderTicker(globalData) {
    if (!DOM.tickerTrack) return;
    // We'll use top coins from the current page
    const topCoins = state.coins.slice(0, 10);
    if (topCoins.length === 0) return;

    const items = topCoins.map(c => `
      <div class="ticker-item">
        <img src="${c.image}" alt="${c.name}" width="16" height="16" loading="lazy">
        <span class="ticker-item__name">${c.symbol.toUpperCase()}</span>
        <span class="ticker-item__price">${UI.formatPrice(c.current_price)}</span>
        <span class="ticker-item__change ${UI.changeClass(c.price_change_percentage_24h)}">${UI.formatPercent(c.price_change_percentage_24h)}</span>
      </div>
    `).join('');

    // Duplicate for seamless scroll
    DOM.tickerTrack.innerHTML = items + items;
  }

  /** Render the 4 dashboard feature cards */
  function renderDashboardCards(coins) {
    if (!DOM.dashCards || coins.length === 0) return;

    DOM.dashCards.innerHTML = coins.map(c => {
      const change = c.price_change_percentage_24h;
      const sparkData = c.sparkline_in_7d?.price || [];
      const isPos = change >= 0;

      return `
        <div class="dash-card" data-coin-id="${c.id}" onclick="App.openCoinModal('${c.id}')">
          <div class="dash-card__top">
            <div class="dash-card__icon">
              <img src="${c.image}" alt="${c.name}" width="40" height="40" loading="lazy">
            </div>
            <div>
              <div class="dash-card__name">${c.name}</div>
              <div class="dash-card__symbol">${c.symbol}</div>
            </div>
          </div>
          <div class="dash-card__price">${UI.formatPrice(c.current_price)}</div>
          <div class="dash-card__meta">
            <span class="dash-card__change ${UI.changeBgClass(change)}">${UI.formatPercent(change)}</span>
            <canvas class="dash-card__sparkline" width="80" height="32" id="spark-dash-${c.id}"></canvas>
          </div>
        </div>
      `;
    }).join('');

    // Draw sparklines after DOM update
    requestAnimationFrame(() => {
      coins.forEach(c => {
        const canvas = document.getElementById(`spark-dash-${c.id}`);
        const data = c.sparkline_in_7d?.price || [];
        Charts.drawSparkline(canvas, data, c.price_change_percentage_24h >= 0);
      });
    });
  }

  /** Render the market table */
  function renderMarketTable(coins) {
    if (!DOM.tableBody) return;

    if (coins.length === 0) {
      DOM.tableBody.innerHTML = '';
      return;
    }

    DOM.tableBody.innerHTML = coins.map(c => {
      const change = c.price_change_percentage_24h;
      return `
        <tr data-coin-id="${c.id}" onclick="App.openCoinModal('${c.id}')">
          <td class="td-rank">${c.market_cap_rank || '—'}</td>
          <td>
            <div class="td-coin">
              <img class="td-coin__img" src="${c.image}" alt="${c.name}" width="28" height="28" loading="lazy">
              <span>
                <span class="td-coin__name">${c.name}</span>
                <span class="td-coin__symbol">${c.symbol}</span>
              </span>
            </div>
          </td>
          <td class="td-price">${UI.formatPrice(c.current_price)}</td>
          <td class="td-change ${UI.changeClass(change)}">${UI.formatPercent(change)}</td>
          <td class="td-cap">${UI.formatCompact(c.market_cap)}</td>
          <td class="td-volume">${UI.formatCompact(c.total_volume)}</td>
          <td class="td-sparkline">
            <canvas width="100" height="30" id="spark-${c.id}"></canvas>
          </td>
        </tr>
      `;
    }).join('');

    // Draw sparklines
    requestAnimationFrame(() => {
      coins.forEach(c => {
        const canvas = document.getElementById(`spark-${c.id}`);
        const data = c.sparkline_in_7d?.price || [];
        Charts.drawSparkline(canvas, data, c.price_change_percentage_24h >= 0);
      });
    });
  }

  /** Render trending coins */
  function renderTrending(trendingCoins) {
    if (!DOM.trendingGrid) return;

    const items = trendingCoins.slice(0, 8);
    DOM.trendingGrid.innerHTML = items.map((item, i) => {
      const c = item.item;
      return `
        <div class="trending-card" onclick="App.openCoinModal('${c.id}')">
          <div class="trending-card__rank">${i + 1}</div>
          <img class="trending-card__icon" src="${c.small}" alt="${c.name}" width="36" height="36" loading="lazy">
          <div class="trending-card__info">
            <div class="trending-card__name">${c.name}</div>
            <div class="trending-card__symbol">${c.symbol}</div>
          </div>
          <div class="trending-card__score">
            #${c.market_cap_rank || '—'}
          </div>
        </div>
      `;
    }).join('');
  }


  /* ==========================================
     Pagination
     ========================================== */
  function updatePagination() {
    UI.setText(DOM.pageInfo, `Page ${state.page}`);
    if (DOM.prevPage) DOM.prevPage.disabled = state.page <= 1;
    // Disable next if current page returned fewer than expected
    if (DOM.nextPage) DOM.nextPage.disabled = state.coins.length < CONFIG.COINS_PER_PAGE;
  }


  /* ==========================================
     Coin Detail Modal
     ========================================== */
  async function openCoinModal(coinId) {
    if (!DOM.coinModal) return;

    // Show modal immediately with loading state
    DOM.coinModal.showModal();

    UI.setHTML(DOM.modalHeader, `
      <div class="spinner" style="width:24px;height:24px;margin:0"></div>
      <div class="coin-modal__header-info">
        <h2>Loading...</h2>
        <span></span>
      </div>
    `);
    UI.setHTML(DOM.modalStats, '');
    UI.setHTML(DOM.modalDesc, '');
    Charts.destroyDetailChart();

    try {
      // Fetch detail and chart in parallel
      const [detail, chartData] = await Promise.all([
        CryptoAPI.getCoinDetail(coinId),
        CryptoAPI.getCoinChart(coinId, CONFIG.CHART_DAYS),
      ]);

      const market = detail.market_data;

      // Header
      UI.setHTML(DOM.modalHeader, `
        <img src="${detail.image?.large || detail.image?.small}" alt="${detail.name}" width="48" height="48">
        <div class="coin-modal__header-info">
          <h2>${detail.name} <span class="${UI.changeClass(market?.price_change_percentage_24h)}">${UI.formatPercent(market?.price_change_percentage_24h)}</span></h2>
          <span>${detail.symbol?.toUpperCase()} · Rank #${detail.market_cap_rank || '—'}</span>
        </div>
      `);

      // Chart
      Charts.drawDetailChart('coin-chart', chartData.prices, detail.name);

      // Stats
      UI.setHTML(DOM.modalStats, `
        <div class="modal-stat">
          <span class="modal-stat__label">Current Price</span>
          <span class="modal-stat__value">${UI.formatPrice(market?.current_price?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">Market Cap</span>
          <span class="modal-stat__value">${UI.formatCompact(market?.market_cap?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">24h Volume</span>
          <span class="modal-stat__value">${UI.formatCompact(market?.total_volume?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">24h High</span>
          <span class="modal-stat__value">${UI.formatPrice(market?.high_24h?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">24h Low</span>
          <span class="modal-stat__value">${UI.formatPrice(market?.low_24h?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">All-Time High</span>
          <span class="modal-stat__value">${UI.formatPrice(market?.ath?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">ATH Change</span>
          <span class="modal-stat__value ${UI.changeClass(market?.ath_change_percentage?.usd)}">${UI.formatPercent(market?.ath_change_percentage?.usd)}</span>
        </div>
        <div class="modal-stat">
          <span class="modal-stat__label">Circulating Supply</span>
          <span class="modal-stat__value">${market?.circulating_supply ? Math.round(market.circulating_supply).toLocaleString() : '—'}</span>
        </div>
      `);

      // Description
      const desc = detail.description?.en;
      if (desc) {
        // Truncate to first 2 sentences
        const short = desc.split('. ').slice(0, 3).join('. ') + '.';
        UI.setHTML(DOM.modalDesc, UI.sanitizeHTML(short));
      } else {
        UI.setHTML(DOM.modalDesc, '<p style="color:var(--clr-text-muted)">No description available.</p>');
      }

    } catch (err) {
      console.error('Modal data error:', err);
      UI.setHTML(DOM.modalStats, `<p style="color:var(--clr-red);padding:var(--space-4)">Failed to load coin data. Please try again.</p>`);
    }
  }

  function closeModal() {
    DOM.coinModal?.close();
    Charts.destroyDetailChart();
  }


  /* ==========================================
     Helpers
     ========================================== */
  function showTableLoading(show) {
    if (show) {
      DOM.tableLoading?.classList.remove('hidden');
      DOM.tableEmpty?.classList.add('hidden');
    } else {
      DOM.tableLoading?.classList.add('hidden');
    }
  }


  /* ==========================================
     Public API (for onclick handlers in HTML)
     ========================================== */
  window.App = {
    openCoinModal,
  };


  /* ==========================================
     Start
     ========================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
