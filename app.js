/**
 * Home Shop Sales & Profit Dashboard - Main Logic Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Data Models & Storage Keys ---
  const STORAGE_KEYS = {
    PRODUCTS: 'home_shop_products_v1',
    SALES: 'home_shop_sales_v1',
    THEME: 'home_shop_theme_v1'
  };

  // --- Initial Seed Data (Beer & Beverage Store Products) ---
  const DEFAULT_PRODUCTS = [
    { id: 'BEER-101', name: 'Hoppy Craft IPA (6-Pack 330ml)', category: 'Craft Beers', costPrice: 9.50, sellPrice: 15.99, stock: 24, minStock: 5 },
    { id: 'BEER-102', name: 'Belgian Amber Ale (750ml Bottle)', category: 'Craft Beers', costPrice: 5.20, sellPrice: 9.99, stock: 15, minStock: 4 },
    { id: 'BEER-103', name: 'Imperial Dark Stout (4-Pack)', category: 'Craft Beers', costPrice: 8.50, sellPrice: 14.50, stock: 12, minStock: 3 },
    { id: 'BEER-104', name: 'Crisp Pilsner Lager (6-Pack Can)', category: 'Lager & Pilsner', costPrice: 6.00, sellPrice: 11.49, stock: 30, minStock: 8 },
    { id: 'BEER-105', name: 'Artisanal Apple Cider (500ml)', category: 'Ciders', costPrice: 2.50, sellPrice: 4.99, stock: 18, minStock: 5 },
    { id: 'BEER-106', name: 'Wheat Hefeweizen (500ml Bottle)', category: 'Wheat Beers', costPrice: 2.20, sellPrice: 4.50, stock: 20, minStock: 6 },
    { id: 'WINE-201', name: 'Vintage Cabernet Sauvignon (750ml)', category: 'Wines', costPrice: 12.00, sellPrice: 22.99, stock: 8, minStock: 3 },
    { id: 'BEER-107', name: 'Organic Pale Ale (330ml Can)', category: 'Craft Beers', costPrice: 1.90, sellPrice: 3.80, stock: 4, minStock: 5 }, // Low stock sample
    { id: 'SNK-301', name: 'Smoked Almonds & Beer Nuts (250g)', category: 'Bar Snacks', costPrice: 2.10, sellPrice: 4.20, stock: 25, minStock: 6 },
    { id: 'BEER-108', name: 'Non-Alcoholic Golden Ale (6-Pack)', category: 'Non-Alcoholic', costPrice: 5.50, sellPrice: 9.99, stock: 3, minStock: 5 } // Low stock sample
  ];

  // Seed Sales History (Past 7 days simulation)
  function getSeedSales() {
    const today = new Date();
    const sales = [];
    const paymentMethods = ['Cash', 'Card', 'Mobile Transfer'];

    for (let i = 6; i >= 0; i--) {
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - i);
      const dateStr = saleDate.toISOString().split('T')[0];

      // 2 to 4 sales per day
      const count = 2 + (i % 3);
      for (let j = 0; j < count; j++) {
        const id = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        const p1 = DEFAULT_PRODUCTS[j % DEFAULT_PRODUCTS.length];
        const p2 = DEFAULT_PRODUCTS[(j + 3) % DEFAULT_PRODUCTS.length];

        const qty1 = 1 + (j % 2);
        const qty2 = 1;

        const items = [
          { productId: p1.id, name: p1.name, qty: qty1, costPrice: p1.costPrice, sellPrice: p1.sellPrice },
          { productId: p2.id, name: p2.name, qty: qty2, costPrice: p2.costPrice, sellPrice: p2.sellPrice }
        ];

        const totalAmount = items.reduce((acc, it) => acc + (it.sellPrice * it.qty), 0);
        const totalCost = items.reduce((acc, it) => acc + (it.costPrice * it.qty), 0);
        const profit = totalAmount - totalCost;

        sales.push({
          id,
          date: `${dateStr} ${10 + j}:15`,
          items,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          paymentMethod: paymentMethods[(j + i) % paymentMethods.length],
          discount: 0
        });
      }
    }
    return sales;
  }

  // --- Application State ---
  const API_BASE = window.location.hostname && window.location.hostname !== 'file' ? window.location.origin : 'http://127.0.0.1:3000';
  let products = [];
  let sales = [];
  let posCart = [];
  let selectedPaymentMethod = 'Cash';
  let activeTab = 'overview';
  let lastUpdatedAt = parseInt(localStorage.getItem('home_shop_state_updated_at') || '0', 10);

  function applyState(nextState) {
    if (!nextState) return;

    if (Array.isArray(nextState.products)) {
      products = nextState.products;
    } else {
      products = DEFAULT_PRODUCTS;
    }

    if (Array.isArray(nextState.sales)) {
      sales = nextState.sales;
    } else {
      sales = getSeedSales();
    }

    const theme = nextState.theme || localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  function loadInitialState() {
    try {
      const localProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
      const localSales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES));
      if (Array.isArray(localProducts) && Array.isArray(localSales)) {
        products = localProducts;
        sales = localSales;
      } else {
        products = DEFAULT_PRODUCTS;
        sales = getSeedSales();
      }
    } catch (error) {
      products = DEFAULT_PRODUCTS;
      sales = getSeedSales();
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(STORAGE_KEYS.THEME, savedTheme);
  }

  loadInitialState();

  async function syncStateToServer() {
    const payload = {
      products,
      sales,
      theme: document.body.getAttribute('data-theme') || 'dark',
      updatedAt: Date.now()
    };

    try {
      const response = await fetch(`${API_BASE}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.updatedAt) {
          lastUpdatedAt = data.updatedAt;
          localStorage.setItem('home_shop_state_updated_at', String(lastUpdatedAt));
        }
      }
    } catch (error) {
      console.warn('Shared sync unavailable:', error);
    }
  }

  async function loadStateFromServer() {
    try {
      const response = await fetch(`${API_BASE}/api/data`);
      if (!response.ok) return;

      const remoteData = await response.json();
      if (!remoteData) return;

      const remoteUpdatedAt = remoteData.updatedAt || 0;
      if (remoteUpdatedAt > lastUpdatedAt) {
        applyState(remoteData);
        lastUpdatedAt = remoteUpdatedAt;
        localStorage.setItem('home_shop_state_updated_at', String(lastUpdatedAt));
      }
    } catch (error) {
      console.warn('Could not load shared state:', error);
    }
  }

  // Save to LocalStorage and sync to the shared server
  function saveData() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(STORAGE_KEYS.THEME, document.body.getAttribute('data-theme') || 'dark');
    lastUpdatedAt = Date.now();
    localStorage.setItem('home_shop_state_updated_at', String(lastUpdatedAt));
    syncStateToServer();
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // Format Currency Helper
  function formatMoney(amount) {
    return '₵' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- Tab Navigation ---
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');

  function switchTab(tabId) {
    activeTab = tabId;
    navItems.forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabViews.forEach(view => {
      if (view.id === `${tabId}View`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Refresh view specific data
    renderAllViews();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  document.getElementById('quickSaleBtn')?.addEventListener('click', () => switchTab('pos'));

  // --- Theme Toggle ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.body.setAttribute('data-theme', savedTheme);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    updateDashboardCharts();
    saveData();
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  mobileMenuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  loadStateFromServer();
  setInterval(() => {
    loadStateFromServer();
  }, 5000);

  // --- Calculate Overall Stats ---
  function calculateMetrics() {
    const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const totalCost = totalRevenue - totalProfit;
    const marginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const itemsSold = sales.reduce((acc, s) => {
      return acc + s.items.reduce((iAcc, item) => iAcc + item.qty, 0);
    }, 0);

    const stockAssetValueCost = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
    const stockAssetValueRetail = products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0);

    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    return {
      totalRevenue,
      totalProfit,
      totalCost,
      marginPercent,
      itemsSold,
      stockAssetValueCost,
      stockAssetValueRetail,
      lowStockCount: lowStockProducts.length,
      totalProductsCount: products.length
    };
  }

  // --- Render Overview Dashboard ---
  function renderOverview() {
    const metrics = calculateMetrics();

    document.getElementById('metricRevenue').textContent = formatMoney(metrics.totalRevenue);
    document.getElementById('metricProfit').textContent = formatMoney(metrics.totalProfit);
    document.getElementById('metricMargin').textContent = `${metrics.marginPercent}%`;
    document.getElementById('metricStockValue').textContent = formatMoney(metrics.stockAssetValueRetail);
    document.getElementById('metricStockSub').textContent = `Cost: ${formatMoney(metrics.stockAssetValueCost)}`;
    document.getElementById('metricLowStockCount').textContent = metrics.lowStockCount;

    // Update Low Stock Alert Badge in Sidebar
    const navBadge = document.getElementById('sidebarAlertBadge');
    if (navBadge) {
      if (metrics.lowStockCount > 0) {
        navBadge.textContent = metrics.lowStockCount;
        navBadge.style.display = 'inline-block';
      } else {
        navBadge.style.display = 'none';
      }
    }

    // Render Recent Sales Table snippet
    const recentTableBody = document.querySelector('#recentSalesTable tbody');
    if (recentTableBody) {
      recentTableBody.innerHTML = '';
      const recent = [...sales].reverse().slice(0, 5);

      if (recent.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No sales recorded yet.</td></tr>`;
      } else {
        recent.forEach(sale => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="mono-text"><strong>#${sale.id}</strong></td>
            <td>${sale.date}</td>
            <td><span class="status-badge badge-info">${sale.paymentMethod}</span></td>
            <td class="mono-text" style="color: var(--accent-revenue); font-weight:700;">${formatMoney(sale.totalAmount)}</td>
            <td class="mono-text" style="color: var(--accent-profit); font-weight:700;">+${formatMoney(sale.profit)}</td>
          `;
          recentTableBody.appendChild(row);
        });
      }
    }

    updateDashboardCharts();
  }

  // Update Charts via Chart.js
  function updateDashboardCharts() {
    if (!window.ShopCharts) return;

    // Build Sales & Profit daily trend map
    const dateMap = {};
    // Last 7 days keys
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { revenue: 0, profit: 0, label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
    }

    sales.forEach(s => {
      const dayKey = s.date.split(' ')[0];
      if (dateMap[dayKey]) {
        dateMap[dayKey].revenue += s.totalAmount;
        dateMap[dayKey].profit += s.profit;
      }
    });

    const trendLabels = Object.values(dateMap).map(v => v.label);
    const trendRevenue = Object.values(dateMap).map(v => parseFloat(v.revenue.toFixed(2)));
    const trendProfit = Object.values(dateMap).map(v => parseFloat(v.profit.toFixed(2)));

    // Category Sales breakdown
    const catMap = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const category = prod ? prod.category : 'General';
        catMap[category] = (catMap[category] || 0) + (item.sellPrice * item.qty);
      });
    });

    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap).map(v => parseFloat(v.toFixed(2)));

    window.ShopCharts.updateCharts(
      { labels: trendLabels, revenue: trendRevenue, profit: trendProfit },
      { labels: catLabels.length ? catLabels : ['No Sales Yet'], values: catValues.length ? catValues : [1] }
    );
  }

  // --- Render Inventory Management View ---
  const inventorySearch = document.getElementById('inventorySearch');
  const inventoryCatFilter = document.getElementById('inventoryCatFilter');
  const inventoryStatusFilter = document.getElementById('inventoryStatusFilter');

  function renderInventory() {
    const tableBody = document.querySelector('#inventoryTable tbody');
    if (!tableBody) return;

    // Populate categories filter dropdown if empty
    const categories = Array.from(new Set(products.map(p => p.category)));
    if (inventoryCatFilter && inventoryCatFilter.options.length <= 1) {
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        inventoryCatFilter.appendChild(opt);
      });
    }

    const query = (inventorySearch?.value || '').toLowerCase();
    const selectedCat = inventoryCatFilter?.value || 'ALL';
    const selectedStatus = inventoryStatusFilter?.value || 'ALL';

    const filtered = products.filter(p => {
      const matchQuery = p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
      const matchCat = selectedCat === 'ALL' || p.category === selectedCat;

      let matchStatus = true;
      if (selectedStatus === 'LOW') matchStatus = p.stock <= p.minStock && p.stock > 0;
      if (selectedStatus === 'OUT') matchStatus = p.stock === 0;
      if (selectedStatus === 'NORMAL') matchStatus = p.stock > p.minStock;

      return matchQuery && matchCat && matchStatus;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 2rem;">No matching products found.</td></tr>`;
      return;
    }

    filtered.forEach(p => {
      const unitProfit = p.sellPrice - p.costPrice;
      const profitMargin = p.sellPrice > 0 ? ((unitProfit / p.sellPrice) * 100).toFixed(1) : 0;

      let stockBadge = '<span class="status-badge badge-success">In Stock</span>';
      if (p.stock === 0) {
        stockBadge = '<span class="status-badge badge-danger">Out of Stock</span>';
      } else if (p.stock <= p.minStock) {
        stockBadge = `<span class="status-badge badge-warning">Low Stock (${p.stock})</span>`;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="mono-text"><strong>${p.id}</strong></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="status-badge badge-info">${p.category}</span></td>
        <td class="mono-text">${formatMoney(p.costPrice)}</td>
        <td class="mono-text" style="font-weight:700; color:var(--text-primary);">${formatMoney(p.sellPrice)}</td>
        <td class="mono-text" style="color:var(--accent-profit);">+${formatMoney(unitProfit)} (${profitMargin}%)</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong class="mono-text">${p.stock}</strong>
            ${stockBadge}
          </div>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm edit-product-btn" data-id="${p.id}" title="Edit Product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-success btn-sm restock-product-btn" data-id="${p.id}" title="Add Stock">
              + Stock
            </button>
            <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p.id}" title="Delete Product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Attach Event Listeners to table action buttons
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(btn.dataset.id));
    });
    document.querySelectorAll('.restock-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openRestockModal(btn.dataset.id));
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  inventorySearch?.addEventListener('input', renderInventory);
  inventoryCatFilter?.addEventListener('change', renderInventory);
  inventoryStatusFilter?.addEventListener('change', renderInventory);

  // --- Product Modal Add / Edit ---
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');

  function openProductModal(productId = null) {
    productForm.reset();
    if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p) {
        document.getElementById('modalProductTitle').textContent = 'Edit Product';
        document.getElementById('prodIdInput').value = p.id;
        document.getElementById('prodNameInput').value = p.name;
        document.getElementById('prodCatInput').value = p.category;
        document.getElementById('prodCostInput').value = p.costPrice;
        document.getElementById('prodSellInput').value = p.sellPrice;
        document.getElementById('prodStockInput').value = p.stock;
        document.getElementById('prodMinStockInput').value = p.minStock;
      }
    } else {
      document.getElementById('modalProductTitle').textContent = 'Add New Product';
      document.getElementById('prodIdInput').value = 'PRD-' + Math.floor(100 + Math.random() * 900);
    }
    productModal.classList.add('active');
  }

  document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('closeProductModalBtn')?.addEventListener('click', () => productModal.classList.remove('active'));

  productForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prodIdInput').value.trim();
    const name = document.getElementById('prodNameInput').value.trim();
    const category = document.getElementById('prodCatInput').value.trim();
    const costPrice = parseFloat(document.getElementById('prodCostInput').value);
    const sellPrice = parseFloat(document.getElementById('prodSellInput').value);
    const stock = parseInt(document.getElementById('prodStockInput').value, 10);
    const minStock = parseInt(document.getElementById('prodMinStockInput').value, 10);

    if (sellPrice < costPrice) {
      showToast('Warning: Selling price is less than Cost price!', 'error');
    }

    const existingIndex = products.findIndex(p => p.id === id);
    const productData = { id, name, category, costPrice, sellPrice, stock, minStock };

    if (existingIndex >= 0) {
      products[existingIndex] = productData;
      showToast(`Updated product "${name}"`);
    } else {
      products.push(productData);
      showToast(`Added product "${name}"`);
    }

    saveData();
    productModal.classList.remove('active');
    renderAllViews();
  });

  // --- Restock Modal ---
  const restockModal = document.getElementById('restockModal');
  const restockForm = document.getElementById('restockForm');
  let currentRestockId = null;

  function openRestockModal(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    currentRestockId = productId;
    document.getElementById('restockProdName').textContent = p.name;
    document.getElementById('restockCurrentStock').textContent = p.stock;
    document.getElementById('restockAddQty').value = 10;
    restockModal.classList.add('active');
  }

  document.getElementById('closeRestockModalBtn')?.addEventListener('click', () => restockModal.classList.remove('active'));

  restockForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const addQty = parseInt(document.getElementById('restockAddQty').value, 10);
    const p = products.find(prod => prod.id === currentRestockId);
    if (p && addQty > 0) {
      p.stock += addQty;
      saveData();
      showToast(`Added +${addQty} stock to "${p.name}". New total: ${p.stock}`);
      restockModal.classList.remove('active');
      renderAllViews();
    }
  });

  // Delete Product
  function deleteProduct(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    if (confirm(`Are you sure you want to delete product "${p.name}"?`)) {
      products = products.filter(prod => prod.id !== productId);
      saveData();
      showToast(`Product "${p.name}" removed`, 'error');
      renderAllViews();
    }
  }

  // --- Point of Sale (POS) & Cart Management ---
  const posSearch = document.getElementById('posSearch');
  const posCatFilter = document.getElementById('posCatFilter');

  function renderPOSCatalog() {
    const catalogGrid = document.getElementById('posCatalogGrid');
    if (!catalogGrid) return;

    // Category Selector
    const categories = Array.from(new Set(products.map(p => p.category)));
    if (posCatFilter && posCatFilter.options.length <= 1) {
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        posCatFilter.appendChild(opt);
      });
    }

    const query = (posSearch?.value || '').toLowerCase();
    const selectedCat = posCatFilter?.value || 'ALL';

    const filtered = products.filter(p => {
      const matchQuery = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
      const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
      return matchQuery && matchCat;
    });

    catalogGrid.innerHTML = '';

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:3rem;">No products match your search.</div>`;
      return;
    }

    filtered.forEach(p => {
      const isOutOfStock = p.stock <= 0;
      const card = document.createElement('div');
      card.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
      card.innerHTML = `
        <div>
          <div class="cat-tag">${p.category}</div>
          <div class="prod-name">${p.name}</div>
        </div>
        <div class="prod-footer">
          <span class="prod-price">${formatMoney(p.sellPrice)}</span>
          <span class="stock-pill">${isOutOfStock ? 'Out of stock' : p.stock + ' left'}</span>
        </div>
      `;

      if (!isOutOfStock) {
        card.addEventListener('click', () => addToCart(p.id));
      }

      catalogGrid.appendChild(card);
    });
  }

  posSearch?.addEventListener('input', renderPOSCatalog);
  posCatFilter?.addEventListener('change', renderPOSCatalog);

  // Cart Functions
  function addToCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    const existingCartItem = posCart.find(item => item.productId === productId);
    if (existingCartItem) {
      if (existingCartItem.qty < prod.stock) {
        existingCartItem.qty++;
      } else {
        showToast(`Cannot add more than current available stock (${prod.stock})`, 'error');
      }
    } else {
      posCart.push({
        productId: prod.id,
        name: prod.name,
        sellPrice: prod.sellPrice,
        costPrice: prod.costPrice,
        qty: 1
      });
    }

    renderCart();
  }

  function updateCartQty(productId, delta) {
    const itemIndex = posCart.findIndex(item => item.productId === productId);
    if (itemIndex < 0) return;

    const item = posCart[itemIndex];
    const prod = products.find(p => p.id === productId);

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      posCart.splice(itemIndex, 1);
    } else if (prod && newQty <= prod.stock) {
      item.qty = newQty;
    } else {
      showToast(`Stock limit reached (${prod.stock})`, 'error');
    }

    renderCart();
  }

  function renderCart() {
    const cartList = document.getElementById('cartItemsList');
    if (!cartList) return;

    cartList.innerHTML = '';

    if (posCart.length === 0) {
      cartList.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); margin:auto 0; padding:2rem 0;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:0.5rem; opacity:0.5;">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>Cart is empty</p>
          <span style="font-size:0.75rem;">Click items on the left to add</span>
        </div>
      `;
    } else {
      posCart.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        itemRow.innerHTML = `
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">${formatMoney(item.sellPrice)} × ${item.qty} = ${formatMoney(item.sellPrice * item.qty)}</div>
          </div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn minus-btn" data-id="${item.productId}">-</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn plus-btn" data-id="${item.productId}">+</button>
          </div>
        `;
        cartList.appendChild(itemRow);
      });

      // Cart quantity event handlers
      cartList.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', () => updateCartQty(btn.dataset.id, -1));
      });
      cartList.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', () => updateCartQty(btn.dataset.id, 1));
      });
    }

    // Totals Calculation
    const subtotal = posCart.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
    const totalCost = posCart.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);
    const estProfit = subtotal - totalCost;

    document.getElementById('cartSubtotal').textContent = formatMoney(subtotal);
    document.getElementById('cartEstProfit').textContent = `+${formatMoney(estProfit)}`;
    document.getElementById('cartTotal').textContent = formatMoney(subtotal);

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.disabled = posCart.length === 0;
      checkoutBtn.style.opacity = posCart.length === 0 ? '0.5' : '1';
    }
  }

  // Payment Selector
  const payButtons = document.querySelectorAll('.pay-btn');
  payButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      payButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPaymentMethod = btn.dataset.method;
    });
  });

  // Clear Cart
  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    posCart = [];
    renderCart();
  });

  // Checkout Action (Complete Sale)
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (posCart.length === 0) return;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0] + ' ' + today.toTimeString().split(' ')[0].substring(0, 5);
    const invoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);

    const totalAmount = posCart.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
    const totalCost = posCart.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);
    const profit = totalAmount - totalCost;

    // Deduct stock from products
    posCart.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
      }
    });

    const newSale = {
      id: invoiceId,
      date: dateStr,
      items: [...posCart],
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      paymentMethod: selectedPaymentMethod,
      discount: 0
    };

    sales.push(newSale);
    saveData();

    showToast(`Sale recorded successfully! Invoice #${invoiceId}`);

    // Show printable receipt preview modal
    openReceiptModal(newSale);

    // Clear cart & update UI
    posCart = [];
    renderCart();
    renderAllViews();
  });

  // --- Receipt Modal & Printing ---
  const receiptModal = document.getElementById('receiptModal');

  function openReceiptModal(sale) {
    if (!receiptModal) return;

    document.getElementById('receiptInvoiceId').textContent = sale.id;
    document.getElementById('receiptDate').textContent = sale.date;
    document.getElementById('receiptPaymentMethod').textContent = sale.paymentMethod;

    const itemsContainer = document.getElementById('receiptItemsBody');
    itemsContainer.innerHTML = '';

    sale.items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name} × ${item.qty}</td>
        <td style="text-align:right;">${formatMoney(item.sellPrice * item.qty)}</td>
      `;
      itemsContainer.appendChild(row);
    });

    document.getElementById('receiptTotalAmount').textContent = formatMoney(sale.totalAmount);
    document.getElementById('receiptProfitMargin').textContent = formatMoney(sale.profit);

    receiptModal.classList.add('active');
  }

  document.getElementById('closeReceiptModalBtn')?.addEventListener('click', () => receiptModal.classList.remove('active'));
  document.getElementById('printReceiptBtn')?.addEventListener('click', () => {
    window.print();
  });

  // --- Sales History View ---
  const salesSearch = document.getElementById('salesSearch');
  const salesDateFilter = document.getElementById('salesDateFilter');
  const salesPaymentFilter = document.getElementById('salesPaymentFilter');

  function renderSalesHistory() {
    const tableBody = document.querySelector('#salesHistoryTable tbody');
    if (!tableBody) return;

    const query = (salesSearch?.value || '').toLowerCase();
    const dateRange = salesDateFilter?.value || 'ALL';
    const payFilter = salesPaymentFilter?.value || 'ALL';

    const now = new Date();

    const filtered = sales.filter(s => {
      const matchQuery = s.id.toLowerCase().includes(query) ||
        s.items.some(i => i.name.toLowerCase().includes(query)) ||
        s.paymentMethod.toLowerCase().includes(query);

      const matchPay = payFilter === 'ALL' || s.paymentMethod === payFilter;

      let matchDate = true;
      const saleDate = new Date(s.date.split(' ')[0]);
      const diffDays = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));

      if (dateRange === 'TODAY') matchDate = diffDays === 0;
      if (dateRange === 'WEEK') matchDate = diffDays <= 7;
      if (dateRange === 'MONTH') matchDate = diffDays <= 30;

      return matchQuery && matchPay && matchDate;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding:2rem;">No transaction history found.</td></tr>`;
      return;
    }

    [...filtered].reverse().forEach(s => {
      const itemsSummary = s.items.map(i => `${i.name} (${i.qty})`).join(', ');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="mono-text"><strong>#${s.id}</strong></td>
        <td>${s.date}</td>
        <td style="max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
        <td><span class="status-badge badge-info">${s.paymentMethod}</span></td>
        <td class="mono-text" style="font-weight:700; color:var(--accent-revenue);">${formatMoney(s.totalAmount)}</td>
        <td class="mono-text" style="font-weight:700; color:var(--accent-profit);">+${formatMoney(s.profit)}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm view-receipt-btn" data-id="${s.id}" title="View Receipt">
              Receipt
            </button>
            <button class="btn btn-danger btn-sm void-sale-btn" data-id="${s.id}" title="Void Sale & Restore Stock">
              Void
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    document.querySelectorAll('.view-receipt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = sales.find(sale => sale.id === btn.dataset.id);
        if (s) openReceiptModal(s);
      });
    });

    document.querySelectorAll('.void-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => voidSale(btn.dataset.id));
    });
  }

  salesSearch?.addEventListener('input', renderSalesHistory);
  salesDateFilter?.addEventListener('change', renderSalesHistory);
  salesPaymentFilter?.addEventListener('change', renderSalesHistory);

  // Void Sale Action (Restores Inventory Stock)
  function voidSale(saleId) {
    const s = sales.find(sale => sale.id === saleId);
    if (!s) return;

    if (confirm(`Are you sure you want to void sale #${saleId}? This will restore product inventory levels.`)) {
      // Restore inventory
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock += item.qty;
        }
      });

      sales = sales.filter(sale => sale.id !== saleId);
      saveData();
      showToast(`Sale #${saleId} voided and inventory restored`, 'error');
      renderAllViews();
    }
  }

  // --- Reports & Backup ---
  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ products, sales }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `home_shop_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data exported to JSON file');
  });

  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Invoice ID,Date,Items,Payment Method,Total Revenue,Profit\n";
    sales.forEach(s => {
      const itemsList = s.items.map(i => `${i.name} (x${i.qty})`).join('; ');
      csvContent += `"${s.id}","${s.date}","${itemsList}","${s.paymentMethod}",${s.totalAmount},${s.profit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Sales report exported to CSV');
  });

  document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (confirm('Reset to initial demo data? All custom products and transactions will be reloaded with sample data.')) {
      products = DEFAULT_PRODUCTS;
      sales = getSeedSales();
      saveData();
      showToast('Sample demo data reloaded');
      renderAllViews();
    }
  });

  // --- Render All App Views ---
  function renderAllViews() {
    renderOverview();
    renderInventory();
    renderPOSCatalog();
    renderCart();
    renderSalesHistory();

    // Set today's date badge in header
    const dateBadge = document.getElementById('currentDateBadge');
    if (dateBadge) {
      dateBadge.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // Initial Run
  renderAllViews();
});
