# CryptoVault — Live Crypto Market Dashboard

A modern, responsive cryptocurrency website with a professional trading dashboard interface. Built with pure HTML, CSS, and JavaScript — no build tools required.

![CryptoVault](https://img.shields.io/badge/Version-1.0-6366f1?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## Features

| Feature | Description |
|---|---|
| **Real-Time Prices** | Live cryptocurrency data updated every 60 seconds via CoinGecko API (free, no API key needed) |
| **Market Dashboard** | Top 4 coins displayed as feature cards with sparkline charts |
| **Coin Listings** | Paginated table of 250+ coins with rank, price, 24h change, market cap, volume, and 7-day sparklines |
| **Search** | Instant client-side search — press `/` to focus |
| **Filters & Sorting** | Filter by gainers/losers; sort by market cap, price, or 24h change |
| **Coin Details Modal** | Click any coin to see a 7-day interactive price chart (Chart.js), key stats, and description |
| **Trending Coins** | Top 8 most searched coins in the last 24h |
| **Global Stats** | Market cap, 24h volume, BTC dominance, active coins |
| **Scrolling Ticker** | Live price ticker at the top |
| **Dark / Light Theme** | Toggle with preference saved to localStorage |
| **Fully Responsive** | Mobile, tablet, and desktop layouts |
| **Keyboard Shortcuts** | `/` = Search, `Esc` = Close modal |
| **Skeleton Loading** | Shimmer placeholders while data loads |
| **Toast Notifications** | Non-intrusive error messages |

---

## Tech Stack

- **HTML5** — semantic markup, `<dialog>` element for the modal
- **CSS3** — custom properties, CSS Grid, Flexbox, animations, `backdrop-filter` glassmorphism
- **JavaScript (ES6+)** — modular IIFE architecture, `async/await`, Intersection Observer
- **Chart.js 4.x** — interactive charts and sparklines
- **CoinGecko API** — free tier, no API key required

---

## Project Structure

```
Freelance/
├── index.html              # Main HTML page
├── css/
│   ├── style.css           # Design tokens, base styles, layout
│   ├── components.css      # Component styles (cards, table, modal, etc.)
│   └── responsive.css      # Responsive breakpoints
├── js/
│   ├── config.js           # App configuration
│   ├── api.js              # API layer with caching
│   ├── ui.js               # UI utilities & formatters
│   ├── charts.js           # Chart.js rendering
│   └── app.js              # Main application logic
└── README.md               # This file
```

---

## Setup Instructions

### Option 1: Open Directly (Simplest)
1. Double-click `index.html` to open in your browser.
2. That's it — the site loads live data from CoinGecko.

### Option 2: Local Development Server (Recommended)
Using VS Code Live Server or any HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy
Upload all files to any web hosting (shared hosting, Netlify, Vercel, GitHub Pages, etc.). No server-side processing needed.

---

## API & Security

### CoinGecko Free API
- **No API key required** — uses the public free tier
- Base URL: `https://api.coingecko.com/api/v3`
- Rate limit: ~10–30 requests per minute
- All requests made over HTTPS

### Security Measures
- **No API keys stored** in the browser or source code
- **HTML sanitization** for coin descriptions from the API
- **No tracking, cookies, or external analytics**
- All data fetched via secure HTTPS endpoints
- No user data is collected or stored (except theme preference in localStorage)

---

## Summary of Changes & Improvements

### Architecture
- **Modular JavaScript** — separated into 5 files: `config.js`, `api.js`, `ui.js`, `charts.js`, `app.js`
- **Request caching** — in-memory cache prevents redundant API calls
- **Error handling** — graceful fallbacks for API failures with retry logic
- **Rate-limit awareness** — 60-second auto-refresh interval respects CoinGecko free tier limits

### Design & UX
- **Premium dark theme** with glassmorphism effects and gradient accents
- **Light theme** toggle with localStorage persistence
- **Skeleton loading** states with shimmer animation
- **Smooth micro-animations** — card hover effects, page transitions, fade-in-up hero
- **Typography** — Inter for UI, JetBrains Mono for numeric data
- **Color system** — HSL-tuned palette with semantic green/red for price changes

### Performance
- **Lazy loading** images with `loading="lazy"`
- **Preconnect** to Google Fonts and API domains
- **Efficient DOM updates** — batch rendering, `requestAnimationFrame` for sparklines
- **Debounced search** — 300ms delay prevents excessive re-renders
- **CSS containment** — no layout thrashing

### Responsiveness
- **4 breakpoints** — Desktop (>1024px), Tablet (768–1024px), Mobile (480–768px), Small (≤480px)
- **Mobile navigation** — slide-out menu with overlay
- **Adaptive grid** — 4→2→1 column layouts
- **Touch-friendly** — large tap targets, no hover dependencies

---

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15.4+
- Edge 90+

---

## License

MIT — free to use, modify, and distribute.

---

## Credits

- Market data: [CoinGecko](https://www.coingecko.com/)
- Charts: [Chart.js](https://www.chartjs.org/)
- Fonts: [Google Fonts](https://fonts.google.com/) (Inter, JetBrains Mono)
