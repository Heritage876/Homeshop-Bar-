/**
 * Chart Manager for Home Shop Sales Dashboard
 * Handles Chart.js instances for Sales, Profit, and Category analytics.
 */

window.ShopCharts = (function () {
  let salesTrendChart = null;
  let categoryChart = null;

  function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      cardBg: isDark ? '#1e293b' : '#ffffff'
    };
  }

  function initSalesTrendChart(canvasId, trendData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!window.Chart) {
      console.warn('Chart.js library not loaded yet.');
      return;
    }

    if (salesTrendChart) {
      salesTrendChart.destroy();
    }

    const theme = getThemeColors();

    salesTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Sales Revenue (₵)',
            data: trendData.revenue,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Net Profit (₵)',
            data: trendData.profit,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: theme.textColor,
              font: { family: 'Inter', size: 12, weight: '600' },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: theme.cardBg,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (value) => '₵' + value.toLocaleString()
            }
          }
        }
      }
    });
  }

  function initCategoryChart(canvasId, categoryData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!window.Chart) return;

    if (categoryChart) {
      categoryChart.destroy();
    }

    const theme = getThemeColors();

    const colors = [
      '#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4',
      '#ec4899', '#3b82f6', '#84cc16', '#f97316'
    ];

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.labels,
        datasets: [
          {
            data: categoryData.values,
            backgroundColor: colors.slice(0, categoryData.labels.length),
            borderWidth: 2,
            borderColor: theme.cardBg
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: 'Inter', size: 11 },
              usePointStyle: true,
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const val = context.parsed || 0;
                return `${label}: ₵${val.toFixed(2)}`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  function updateCharts(trendData, categoryData) {
    if (trendData) initSalesTrendChart('salesTrendChart', trendData);
    if (categoryData) initCategoryChart('categoryChart', categoryData);
  }

  return {
    initSalesTrendChart,
    initCategoryChart,
    updateCharts
  };
})();
