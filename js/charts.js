/* ==========================================
   CryptoVault — Chart Helpers
   ==========================================
   Uses Chart.js for sparklines and detail charts.
   ========================================== */

const Charts = (() => {

  /** Active chart instance (for the modal detail chart). */
  let _activeChart = null;

  /**
   * Draw a tiny sparkline onto a canvas element.
   * @param {HTMLCanvasElement} canvas
   * @param {number[]} data - Array of price points
   * @param {boolean} isPositive - Whether overall change is positive
   */
  function drawSparkline(canvas, data, isPositive = true) {
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    // Handle retina
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const color = isPositive ? CONFIG.CHART_COLORS.green : CONFIG.CHART_COLORS.red;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Fill gradient under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '20');
    gradient.addColorStop(1, color + '00');

    ctx.lineTo(width - padding, height);
    ctx.lineTo(padding, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * Draw the detail chart in the coin modal.
   * @param {string} canvasId - Canvas element id
   * @param {Array} priceData - Array of [timestamp, price]
   * @param {string} coinName
   */
  function drawDetailChart(canvasId, priceData, coinName = 'Price') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !priceData) return;

    // Destroy previous chart
    if (_activeChart) {
      _activeChart.destroy();
      _activeChart = null;
    }

    const labels = priceData.map(p => {
      const d = new Date(p[0]);
      return d.toLocaleDateString(CONFIG.LOCALE, { month: 'short', day: 'numeric' });
    });
    const prices = priceData.map(p => p[1]);

    const isPositive = prices.length > 1 && prices[prices.length - 1] >= prices[0];
    const lineColor = isPositive ? CONFIG.CHART_COLORS.green : CONFIG.CHART_COLORS.red;

    _activeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: coinName + ' Price (USD)',
          data: prices,
          borderColor: lineColor,
          backgroundColor: lineColor + '15',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (ctx) => UI.formatPrice(ctx.parsed.y),
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'Inter' },
              maxTicksLimit: 7,
              maxRotation: 0,
            },
            border: { display: false },
          },
          y: {
            display: true,
            position: 'right',
            grid: {
              color: CONFIG.CHART_COLORS.grid,
              drawBorder: false,
            },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (val) => UI.formatCompact(val),
              maxTicksLimit: 5,
            },
            border: { display: false },
          },
        },
      },
    });
  }

  /**
   * Destroy the active chart (cleanup).
   */
  function destroyDetailChart() {
    if (_activeChart) {
      _activeChart.destroy();
      _activeChart = null;
    }
  }

  return Object.freeze({
    drawSparkline,
    drawDetailChart,
    destroyDetailChart,
  });
})();
