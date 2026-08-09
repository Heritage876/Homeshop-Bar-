/**
 * Chart Manager for Home Shop Sales Dashboard
 * Handles inline canvas charts for Sales Trend and Category analytics.
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

  function getCanvasContext(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function drawSalesTrendChart(canvas, trendData) {
    const info = getCanvasContext(canvas);
    if (!info) return;

    const { ctx, width, height } = info;
    const theme = getThemeColors();
    const padding = { top: 18, right: 18, bottom: 38, left: 48 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const values = [...trendData.revenue, ...trendData.profit];
    const maxValue = Math.max(...values, 1);
    const minValue = 0;

    const getPoint = (index, dataset) => {
      const x = padding.left + (index / Math.max(trendData.labels.length - 1, 1)) * plotWidth;
      const value = dataset[index];
      const y = padding.top + plotHeight - ((value - minValue) / (maxValue - minValue || 1)) * plotHeight;
      return { x, y };
    };

    const datasets = [
      { values: trendData.revenue, color: '#10b981' },
      { values: trendData.profit, color: '#8b5cf6' }
    ];

    datasets.forEach((dataset, dsIndex) => {
      ctx.beginPath();
      dataset.values.forEach((value, index) => {
        const point = getPoint(index, dataset.values);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      dataset.values.forEach((value, index) => {
        const point = getPoint(index, dataset.values);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dataset.color;
        ctx.fill();
      });
    });

    ctx.fillStyle = theme.textColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    trendData.labels.forEach((label, index) => {
      const x = padding.left + (index / Math.max(trendData.labels.length - 1, 1)) * plotWidth;
      ctx.fillText(label, x, height - 12);
    });

    ctx.textAlign = 'left';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText('Revenue', 10, 16);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(10, 24, 12, 3);
    ctx.fillStyle = theme.textColor;
    ctx.fillText('Profit', 10, 40);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(10, 48, 12, 3);
  }

  function drawCategoryChart(canvas, categoryData) {
    const info = getCanvasContext(canvas);
    if (!info) return;

    const { ctx, width, height } = info;
    const theme = getThemeColors();
    const colors = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#84cc16', '#f97316'];
    const total = categoryData.values.reduce((sum, value) => sum + value, 0) || 1;
    const centerX = width / 2;
    const centerY = height / 2 - 8;
    const radius = Math.min(width, height - 60) / 2.4;
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    categoryData.values.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();

    ctx.fillStyle = theme.textColor;
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sales Mix', centerX, centerY);

    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const legendX = 18;
    const legendY = height - 16;
    categoryData.labels.forEach((label, index) => {
      const y = legendY + index * 18;
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, y - 8, 10, 10);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`${label}`, legendX + 16, y);
    });
  }

  function initSalesTrendChart(canvasId, trendData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    drawSalesTrendChart(canvas, trendData);
    salesTrendChart = true;
  }

  function initCategoryChart(canvasId, categoryData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    drawCategoryChart(canvas, categoryData);
    categoryChart = true;
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
