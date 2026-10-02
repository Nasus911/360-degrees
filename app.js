const defaultProducts = [
        { id: 1, name: "Iced Spanish Latte", category: "Coffee", price: 185, stock: 38, emoji: "🥤", description: "Local espresso, condensed milk, silky and balanced." },
        { id: 2, name: "Ube Cloud Latte", category: "Coffee", price: 215, stock: 8, emoji: "🧋", description: "Earthy ube and sea-salt cream." },
        { id: 3, name: "Sea Salt Cold Brew", category: "Cold", price: 215, stock: 24, emoji: "🧋", description: "18-hour brew with soft savory foam." },
        { id: 4, name: "Flat White", category: "Coffee", price: 190, stock: 31, emoji: "☕", description: "Double espresso with velvety steamed milk." },
        { id: 5, name: "Calamansi Espresso", category: "Cold", price: 175, stock: 19, emoji: "🍋", description: "Bright citrus sparkle and double espresso." },
        { id: 6, name: "Matcha Strawberry", category: "Matcha", price: 225, stock: 14, emoji: "🍵", description: "Ceremonial matcha layered with strawberry." },
        { id: 7, name: "Butter Croissant", category: "Food", price: 125, stock: 17, emoji: "🥐", description: "Flaky, baked fresh every morning." },
        { id: 8, name: "Banana Bread", category: "Food", price: 110, stock: 12, emoji: "🍰", description: "A soft slice with toasted walnuts." },
        { id: 9, name: "Oat Milk", category: "Inventory", price: 0, stock: 6, emoji: "🥛", description: "Barista oat milk cartons." },
        { id: 10, name: "Ube Syrup", category: "Inventory", price: 0, stock: 8, emoji: "🫙", description: "House ube syrup bottles." }
      ];
      const initialState = {
        role: document.body.dataset.role || "admin",
        page: "overview",
        products: defaultProducts,
        cart: [],
        orders: [
          { id: "SC-1844", customer: "Mika Reyes", items: "Sea Salt Cold Brew × 1", total: 215, status: "Preparing", channel: "Online" },
          { id: "SC-1845", customer: "Walk-in", items: "Iced Spanish Latte × 2", total: 370, status: "New", channel: "Counter" },
          { id: "SC-1846", customer: "Ana Cruz", items: "Matcha Strawberry × 1", total: 225, status: "Ready for pickup", channel: "Online" }
        ],
        orderHistory: [
          { id: "SC-1839", customer: "Mika Reyes", items: "Iced Spanish Latte × 1, Butter Croissant × 1", total: 310, status: "Completed", channel: "Online", completedAt: "Yesterday · 3:42 PM" }
        ],
        promos: [{ id: 1, name: "October afternoon", detail: "₱25 off Ube Cloud Latte after 4 PM", status: "Active" }],
        employees: [
          { name: "Luis Reyes", role: "Barista", shift: "Shift A", status: "On shift" },
          { name: "Mara Santos", role: "Operations admin", shift: "Manager", status: "Active" },
          { name: "Nina Flores", role: "Cashier", shift: "Shift B", status: "Off shift" }
        ],
        points: 780,
        wallet: 1240,
        sales: 84620,
        notice: "",
        modal: null,
        category: "All",
        search: ""
      };
      let state;
      try {
        const saved = JSON.parse(localStorage.getItem("sinta360-state") || "null");
        state = saved ? { ...initialState, ...saved, products: saved.products || defaultProducts, orderHistory: saved.orderHistory || initialState.orderHistory } : structuredClone(initialState);
      } catch (error) {
        console.warn("Saved demo data could not be loaded; starting with sample data.", error);
        state = structuredClone(initialState);
      }
      const rolePages = {
        admin: [["overview", "Overview", "⌂"], ["inventory", "Inventory", "▦"], ["products", "Products", "☕"], ["promotions", "Promotions", "✳"], ["employees", "Employees", "♙"], ["reports", "Reports", "▤"]],
        staff: [["pos", "Point of sale", "▣"], ["queue", "Order queue", "◷"], ["receipts", "Receipts", "▤"]],
        customer: [["home", "Home", "⌂"], ["menu", "Menu", "☕"], ["orders", "My orders", "◷"], ["history", "History", "↺"], ["wallet", "Wallet & rewards", "◉"]]
      };
      const currentRole = document.body.dataset.role || "admin";
      if (!rolePages[currentRole]) {
        throw new Error(`Unknown workspace role: ${currentRole}`);
      }
      state.role = currentRole;
      if (!rolePages[currentRole].some(([page]) => page === state.page)) {
        state.page = document.body.dataset.defaultPage || rolePages[currentRole][0][0];
      }
      const pageNames = Object.fromEntries(Object.values(rolePages).flatMap(items => items.map(([id, name]) => [id, name])));
      const money = amount => `₱${Number(amount || 0).toLocaleString("en-PH")}`;
      const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
      const productById = id => state.products.find(product => product.id === Number(id));
      function save() {
        try {
          localStorage.setItem("sinta360-state", JSON.stringify({ ...state, notice: "", modal: null }));
        } catch (error) {
          console.error("Could not save this demo change in browser storage.", error);
        }
      }
      function notify(message) {
        state.notice = message;
        render();
        window.setTimeout(() => { if (state.notice === message) { state.notice = ""; render(); } }, 3000);
      }
      function setPage(page) { state.page = page; state.search = ""; state.category = "All"; render(); }
      function goRole(role) {
        const destinations = { admin: "index.html", staff: "staff.html", customer: "customer.html" };
        const destination = destinations[role];
        if (!destination) {
          throw new Error(`Unknown workspace role: ${role}`);
        }
        window.location.href = destination;
      }
      function heading(kicker, title, subtitle, action = "") {
        return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;
      }
      function stat(label, value, note = "") {
        return `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}</div>${note ? `<div class="stat-note">${note}</div>` : ""}</div>`;
      }
      function productCard(product, mode = "browse") {
        const isInventory = product.category === "Inventory";
        const action = mode === "manage" ? `<button class="button secondary small" data-action="edit-product" data-id="${product.id}">Edit</button>` :
          isInventory ? `<span class="pill ${product.stock < 10 ? "warn" : ""}">${product.stock} in stock</span>` :
          `<button class="button small" data-action="add-cart" data-id="${product.id}">${mode === "customer" ? "Add to order" : "Add to order"}</button>`;
        return `<article class="product-card"><div class="product-card-top"><div class="product-art">${product.emoji}</div>${product.stock < 10 ? `<span class="pill warn">Low stock</span>` : `<span class="pill">Available</span>`}</div><div class="product-card-body"><div class="eyebrow">${safe(product.category)}</div><h3>${safe(product.name)}</h3><p>${safe(product.description || "Freshly prepared at 360 Degrees Specialty Cafe.")}</p><div class="product-card-foot"><span class="price">${isInventory ? `${product.stock} units` : money(product.price)}</span>${action}</div></div></article>`;
      }
      function productFilters(products, includeSearch = true) {
        const categories = ["All", ...new Set(products.map(product => product.category))];
        return `${includeSearch ? `<div class="toolbar-row"><input class="input" data-search placeholder="Search coffee, matcha, pastry, or SKU" value="${safe(state.search)}" /><select class="select" data-filter><option value="All">All categories</option>${categories.filter(value => value !== "All").map(value => `<option ${state.category === value ? "selected" : ""}>${safe(value)}</option>`).join("")}</select></div>` : `<div class="category-chips">${categories.map(value => `<button class="chip ${state.category === value ? "active" : ""}" data-category="${safe(value)}">${safe(value)}</button>`).join("")}</div>`}`;
      }
      function filteredProducts(allowInventory = false) {
        return state.products.filter(product => (allowInventory || product.category !== "Inventory") && (state.category === "All" || product.category === state.category) && `${product.name} ${product.category}`.toLowerCase().includes(state.search.toLowerCase()));
      }
      function dashboard() {
        const low = state.products.filter(product => product.category === "Inventory" && product.stock <= 10);
        const max = Math.max(...[42, 56, 39, 73, 66, 91, 80, 100, 75, 96, 83, 100]);
        const heights = [42,56,39,73,66,91,80,100,75,96,83,100];
        return `${heading("01 · Operations command", "Good morning, Mara.", "Here’s how the Lipa Branch is moving today.", `<button class="button secondary" data-page="reports">Download daily brief ↗</button>`)}
          <div class="grid stats">${stat("Today's sales", money(state.sales), "↑ 12.4% vs. last Thursday")}${stat("Orders", state.orders.length + 183, "↑ 8.1% today")}${stat("Average order", money(455), "↑ 3.7% this week")}${stat("Low-stock items", low.length, `${low.length ? "Review before the evening rush" : "Stock levels look good"}`)}</div>
          <div class="grid two-col">
            <div class="grid">
              <div class="card"><div class="card-head"><div><h2 class="card-title">Sales trend</h2><div class="card-note">Hourly gross sales · today</div></div><span class="pill">Live</span></div><div class="chart">${heights.map((height, index) => `<div class="bar-wrap"><div class="bar ${index === heights.length - 1 ? "accent" : ""}" style="height:${height / max * 100}%"></div><span>${7 + index}:00</span></div>`).join("")}</div></div>
              <div class="grid two-col">
                <div class="card"><div class="card-head"><h2 class="card-title">Top products</h2><button class="button secondary small" data-page="reports">View report</button></div>${state.products.filter(p => p.category !== "Inventory").slice(0, 3).map((p, i) => `<div class="activity-row"><span>${p.emoji} &nbsp;${safe(p.name)}</span><strong>${[158, 246, 339][i] || 0} sold</strong></div>`).join("")}</div>
                <div class="card"><div class="card-head"><h2 class="card-title">Recent activity</h2><span class="card-note">Today</span></div><div class="activity"><div class="activity-row"><span>#${state.orders[0]?.id || "SC-1842"} · Paid · GCash</span><span class="muted">2 min ago</span></div><div class="activity-row"><span>Inventory · Oat Milk below threshold</span><span class="muted">8 min ago</span></div><div class="activity-row"><span>Supplier delivery received</span><span class="muted">24 min ago</span></div></div></div>
              </div>
            </div>
            <div class="grid">
              <div class="forecast"><div class="eyebrow">Live demand forecast</div><h3>Prepare for a 22% lift after 4 PM.</h3><p>Afternoon demand is expected to rise. Iced Spanish Latte and Ube Cloud orders may peak between 4:30–6:00 PM.</p><div class="forecast-tags"><span>+18 Spanish Latte</span><span>+12 Ube Cloud</span></div></div>
              <div class="card"><div class="card-head"><h2 class="card-title">Stock watch</h2><span class="pill warn">${low.length} low</span></div>${low.length ? low.map(product => `<div class="activity-row"><span>${product.emoji} &nbsp;${safe(product.name)}</span><strong>${product.stock} units</strong></div>`).join("") : `<div class="empty">No items below their threshold.</div>`}<button class="button secondary full" data-page="inventory">Review inventory</button></div>
            </div>
          </div>`;
      }
      function inventoryPage() {
        const stock = state.products.filter(product => product.category === "Inventory");
        return `${heading("Lipa Branch · Admin workspace", "Inventory", "Monitor ingredients and supplies. Stock changes as orders are completed.", `<button class="button" data-action="add-stock">＋ Receive stock</button>`)}
          <div class="grid stats">${stat("Tracked items", stock.length, "Ingredients and supplies")}${stat("Low stock", stock.filter(item => item.stock <= 10).length, "Threshold alerts")}${stat("Suppliers", 8, "3 recent deliveries")}${stat("Last update", "Now", "Changes saved in this browser")}</div>
          <div class="card"><div class="card-head"><h2 class="card-title">Stock levels</h2><span class="card-note">Sample store inventory</span></div><div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>On hand</th><th>Status</th><th>Action</th></tr></thead><tbody>${stock.map(item => `<tr><td><div class="product-cell"><div class="product-art">${item.emoji}</div><div><div class="product-name">${safe(item.name)}</div><div class="product-meta">SKU-00${item.id}</div></div></div></td><td>Ingredients</td><td>${item.stock} units</td><td><span class="pill ${item.stock <= 10 ? "warn" : ""}">${item.stock <= 10 ? "Low stock" : "In stock"}</span></td><td><button class="button secondary small" data-action="restock" data-id="${item.id}">＋ Restock</button></td></tr>`).join("")}</tbody></table></div></div>`;
      }
      function productsPage() {
        const products = state.products.filter(p => p.category !== "Inventory").filter(p => (state.category === "All" || p.category === state.category) && p.name.toLowerCase().includes(state.search.toLowerCase()));
        return `${heading("Catalog management", "Products", "Create and maintain the items available to customers and the POS.", `<button class="button" data-action="new-product">＋ Add product</button>`)}
          ${productFilters(state.products.filter(p => p.category !== "Inventory"))}<div class="grid product-grid">${products.map(product => productCard(product, "manage")).join("") || `<div class="empty">No products match your search.</div>`}</div>`;
      }
      function promotionsPage() {
        return `${heading("Lipa Branch · Admin workspace", "Promotions", "Create offers for customers. Cashiers can apply configured offers at checkout.", `<button class="button" data-action="new-promo">＋ Create promotion</button>`)}
          <div class="grid product-grid">${state.promos.map(promo => `<article class="card"><div class="card-head"><span class="pill">${safe(promo.status)}</span><span class="card-note">Promotion</span></div><h2 style="font:500 23px Georgia,serif">${safe(promo.name)}</h2><p class="subtitle">${safe(promo.detail)}</p><div class="product-card-foot" style="margin-top:22px"><span class="card-note">Managed by Admin</span><button class="button secondary small" data-action="remove-promo" data-id="${promo.id}">Remove</button></div></article>`).join("") || `<div class="empty card">No promotions yet. Create one to show it here.</div>`}</div>`;
      }
      function employeesPage() {
        return `${heading("Lipa Branch · Admin workspace", "Employees", "Review team accounts and shift availability.", `<button class="button" data-action="new-employee">＋ Add employee</button>`)}
          <div class="card"><div class="card-head"><h2 class="card-title">Team</h2><span class="card-note">${state.employees.length} team members</span></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Role</th><th>Shift</th><th>Status</th></tr></thead><tbody>${state.employees.map((employee, index) => `<tr><td><div class="product-cell"><div class="avatar">${employee.name.split(" ").map(part => part[0]).join("")}</div><span class="product-name">${safe(employee.name)}</span></div></td><td>${safe(employee.role)}</td><td>${safe(employee.shift)}</td><td><span class="pill ${employee.status === "Off shift" ? "warn" : ""}">${safe(employee.status)}</span></td></tr>`).join("")}</tbody></table></div></div>`;
      }
      function reportsPage() {
        return `${heading("Performance", "Sales reports", "A quick view of store activity. Figures are sample data for this browser prototype.")}
          <div class="grid stats">${stat("Gross sales", money(state.sales), "Today")}${stat("Completed orders", state.orders.length + 183, "Today")}${stat("Average order value", money(455), "This week")}${stat("Top category", "Coffee", "Most ordered")}</div><div class="card"><div class="card-head"><h2 class="card-title">Daily sales</h2><span class="card-note">7 AM – 6 PM</span></div><div class="chart">${[42,56,39,73,66,91,80,100,75,96,83,100].map((height, index) => `<div class="bar-wrap"><div class="bar ${index === 11 ? "accent" : ""}" style="height:${height}%"></div><span>${7 + index}:00</span></div>`).join("")}</div></div>`;
      }
      function cartMarkup(customerMode = false) {
        const cart = state.cart;
        const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
        const total = subtotal;
        return `<div class="card cart-card"><div class="card-head"><div><h2 class="card-title">${customerMode ? "Your order" : "Current order"}</h2><span class="card-note">${cart.reduce((sum, line) => sum + line.qty, 0)} items · ${customerMode ? "Pickup" : "Walk-in"}</span></div><button class="button secondary small" data-action="clear-cart">Clear</button></div>${cart.length ? cart.map((line, index) => `<div class="cart-line"><div><strong>${safe(line.name)}</strong><span class="muted">${safe(line.option || "Regular · Iced")}</span><div class="cart-controls"><button class="qty-button" data-action="qty" data-index="${index}" data-change="-1" aria-label="Remove one">−</button><span>${line.qty}</span><button class="qty-button" data-action="qty" data-index="${index}" data-change="1" aria-label="Add one">＋</button></div></div><strong>${money(line.price * line.qty)}</strong></div>`).join("") : `<div class="empty">Your order is empty.<br />Choose a drink to get started.</div>`}
          <div class="totals"><div class="total-row"><span>Subtotal</span><span>${money(subtotal)}</span></div><div class="total-row"><span>VAT included</span><span>Included</span></div><div class="total-row grand"><span>Total</span><span>${money(total)}</span></div></div>${customerMode ? `<div class="field" style="margin-bottom:12px"><label for="pickup-time">Pickup time</label><select id="pickup-time" class="select full"><option>As soon as possible · ~8 min</option><option>In 15 minutes</option><option>In 30 minutes</option></select></div>` : `<div class="field" style="margin-bottom:12px"><label for="payment-method">Payment method</label><select id="payment-method" class="select full"><option>Cash</option><option>Wallet / QR</option></select></div>`}
          <button class="button dark full" data-action="${customerMode ? "place-order" : "checkout"}" ${cart.length ? "" : "disabled"}>${customerMode ? `Place pickup order · ${money(total)}` : `Charge ${money(total)}`}</button></div>`;
      }
      function posPage() {
        const products = filteredProducts();
        return `${heading("02 · Service choreography", "Point of sale", "Search, scan, configure, and collect. Stock is adjusted after a completed sale.", `<button class="button secondary" data-page="queue">View order queue →</button>`)}
          <div class="pos-layout"><div>${productFilters(state.products.filter(p => p.category !== "Inventory"))}<div class="grid product-grid">${products.map(product => productCard(product)).join("") || `<div class="empty">No matching products.</div>`}<button class="button secondary" data-action="scan">▦ &nbsp;Scan barcode / QR</button></div></div>${cartMarkup()}</div>`;
      }
      function queuePage() {
        const statuses = ["New", "Preparing", "Ready for pickup"];
        return `${heading("Service choreography", "Order queue", "Move orders through preparation and notify customers when pickup is ready.")}
          <div class="grid queue-grid">${statuses.map(status => { const orders = state.orders.filter(order => order.status.toLowerCase() === status.toLowerCase()); return `<section class="queue-column"><div class="queue-heading"><span>${status}</span><span class="pill">${orders.length}</span></div>${orders.length ? orders.map(order => `<article class="order-card"><div class="order-top"><span>#${safe(order.id)}</span><span>${safe(order.channel)}</span></div><p><strong>${safe(order.customer)}</strong><br />${safe(order.items)}</p><div class="order-top"><span>${money(order.total)}</span><span class="muted">${status === "New" ? "Just now" : "A few min ago"}</span></div><button class="button ${status === "Ready for pickup" ? "secondary" : ""} small full" style="margin-top:12px" data-action="advance-order" data-id="${safe(order.id)}">${status === "New" ? "Start preparing" : status === "Preparing" ? "Notify: ready for pickup" : "Complete pickup"}</button></article>`).join("") : `<div class="empty">No orders here.</div>`}</section>`; }).join("")}</div>`;
      }
      function receiptsPage() {
        return `${heading("Service history", "Receipts", "Recent counter and online orders processed at the Lipa Branch.")}
          <div class="card"><div class="card-head"><h2 class="card-title">Recent orders</h2><span class="card-note">Digital receipts</span></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${state.orders.map(order => `<tr><td>#${safe(order.id)}</td><td>${safe(order.customer)}</td><td>${safe(order.items)}</td><td>${money(order.total)}</td><td><span class="pill">${safe(order.status)}</span></td></tr>`).join("") || `<tr><td colspan="5" class="empty">No receipts yet.</td></tr>`}</tbody></table></div></div>`;
      }
      function customerHome() {
        return `${heading("360 Degrees Specialty Cafe · Lipa Branch", "Good morning, Mika.", "Your neighborhood coffee, ready when you are.", `<button class="button secondary" data-page="orders">Track your order →</button>`)}
          <div class="promo-banner"><div><div class="eyebrow">October special · from ${money(215)}</div><h2>Ube cloud, made for slow afternoons.</h2><p>Velvety ube, local espresso, and a sea-salt cream cap. Order ahead for pickup at our Lipa Branch.</p><button class="button" data-action="add-cart" data-id="2">Order Ube Cloud Latte</button></div><div class="promo-cup">🧋</div></div>
          <div class="grid two-col" style="margin-top:18px"><div><div class="card-head"><h2 class="card-title">Picked for you</h2><button class="button secondary small" data-page="menu">See menu</button></div><div class="grid product-grid">${state.products.filter(p => p.category !== "Inventory").slice(0, 3).map(product => productCard(product, "customer")).join("")}</div></div><div class="grid"><div class="reward-card"><div class="eyebrow">360 rewards</div><div class="points">${state.points} points</div><p>${Math.max(0, 1000 - state.points)} to a free drink</p><div class="progress"><span style="width:${Math.min(100, state.points / 10)}%"></span></div></div><div class="card"><div class="card-head"><h2 class="card-title">Active order</h2><span class="pill">${state.orders.find(order => order.customer === "Mika Reyes")?.status || "Ready to order"}</span></div><p class="subtitle">${state.orders.find(order => order.customer === "Mika Reyes") ? `Order #${state.orders.find(order => order.customer === "Mika Reyes").id} · pickup at Lipa Branch` : "Your next coffee is just around the corner."}</p><button class="button secondary full" data-page="orders">View order status</button></div></div></div>`;
      }
      function customerMenu() {
        const items = filteredProducts();
        return `${heading("Browse & search", "The menu", "Freshly made favorites, available for pickup at our Lipa Branch.", `<button class="button secondary" data-page="orders">Your orders</button>`)}
          <div class="toolbar-row"><input class="input" data-search placeholder="Search coffee, matcha, or pastry" value="${safe(state.search)}" /></div><div class="category-chips">${["All", "Coffee", "Cold", "Matcha", "Food"].map(value => `<button class="chip ${state.category === value ? "active" : ""}" data-category="${value}">${value}</button>`).join("")}</div>
          <div class="pos-layout"><div class="grid product-grid">${items.map(product => productCard(product, "customer")).join("") || `<div class="empty">No available items in this category.</div>`}</div>${cartMarkup(true)}</div>`;
      }
      function customerOrders() {
        const orders = state.orders.filter(order => order.customer === "Mika Reyes" || order.channel === "Online");
        return `${heading("Coffee in hand", "Your orders", "Follow your Lipa Branch pickup orders from preparation to ready.", `<button class="button secondary" data-page="history">View order history</button>`)}<div class="grid">${orders.map(order => `<article class="card"><div class="card-head"><div><div class="eyebrow">Active order · #${safe(order.id)}</div><h2 class="card-title" style="margin-top:7px">${safe(order.items)}</h2></div><span class="pill">${safe(order.status)}</span></div><p class="subtitle">Pickup · 360 Degrees Specialty Cafe, Lipa Branch · ${order.status === "Ready for pickup" ? "Ready now" : "Estimated ready in ~6 minutes"}</p><div class="progress"><span style="width:${order.status === "New" ? 28 : order.status === "Preparing" ? 66 : 100}%"></span></div></article>`).join("") || `<div class="card empty">No active orders. Browse the menu to order your next coffee.</div>`}</div>`;
      }
      function customerHistory() {
        const history = state.orderHistory.filter(order => order.customer === "Mika Reyes" || order.channel === "Online");
        return `${heading("Your account", "Order history", "Past orders picked up from 360 Degrees Specialty Cafe - Lipa Branch.", `<button class="button secondary" data-page="orders">View active orders</button>`)}
          <div class="card"><div class="card-head"><h2 class="card-title">Completed orders</h2><span class="card-note">${history.length} ${history.length === 1 ? "order" : "orders"}</span></div>${history.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Items</th><th>Pickup date</th><th>Total</th><th>Status</th></tr></thead><tbody>${history.map(order => `<tr><td>#${safe(order.id)}</td><td>${safe(order.items)}</td><td>${safe(order.completedAt || "Recently")}</td><td>${money(order.total)}</td><td><span class="pill">${safe(order.status || "Completed")}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Your completed pickup orders will appear here.</div>`}</div>`;
      }
      function customerWallet() {
        return `${heading("Your 360 account", "Wallet & rewards", "Keep track of your stored balance and points.")}
          <div class="grid two-col"><div class="wallet-card"><div class="card-note">360 WALLET</div><div class="balance">${money(state.wallet)}</div><div class="card-note">Mika Reyes · Lipa Branch</div><div style="display:flex;gap:9px;margin-top:20px"><button class="button" data-action="cash-in">＋ Cash in</button><button class="button secondary" data-action="wallet-history">History</button></div></div><div class="reward-card"><div class="eyebrow">360 rewards</div><div class="points">${state.points} points</div><p>${Math.max(0, 1000 - state.points)} points until a free drink</p><div class="progress"><span style="width:${Math.min(100, state.points / 10)}%"></span></div></div></div>
          <div class="card" style="margin-top:18px"><div class="card-head"><h2 class="card-title">Wallet activity</h2><span class="card-note">Recent transactions</span></div><div class="activity-row"><span>Starting wallet balance</span><strong>${money(state.wallet)}</strong></div><div class="activity-row"><span>Points from your purchases</span><strong>${state.points} pts</strong></div><p class="card-note" style="margin:12px 0 0">Demo note: cash-in changes this local preview balance only. No real payment is processed.</p></div>`;
      }
      function modalMarkup() {
        const modal = state.modal;
        const product = modal.type === "edit-product" ? productById(modal.id) : null;
        let body = "";
        let title = "";
        if (modal.type === "new-product" || modal.type === "edit-product") {
          title = product ? "Edit product" : "Add product";
          body = `<form data-form="product" class="form-grid"><input type="hidden" name="id" value="${product?.id || ""}"><div class="field"><label>Product name</label><input name="name" required value="${safe(product?.name || "")}" placeholder="e.g. Honey Oat Latte"></div><div class="field"><label>Category</label><select name="category">${["Coffee", "Cold", "Matcha", "Food"].map(category => `<option ${product?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div><div class="field"><label>Price (₱)</label><input type="number" name="price" min="1" step="1" required value="${product?.price || ""}"></div><div class="field"><label>Available quantity</label><input type="number" name="stock" min="0" step="1" required value="${product?.stock ?? 0}"></div><div class="field"><label>Description</label><input name="description" value="${safe(product?.description || "")}" placeholder="Short menu description"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Save product</button></div></form>`;
        } else if (modal.type === "new-promo") {
          title = "Create promotion";
          body = `<form data-form="promo" class="form-grid"><div class="field"><label>Promotion name</label><input name="name" required placeholder="e.g. Afternoon pick-me-up"></div><div class="field"><label>Offer details</label><input name="detail" required placeholder="e.g. ₱25 off selected drinks after 4 PM"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Create promotion</button></div></form>`;
        } else if (modal.type === "restock" || modal.type === "add-stock") {
          title = "Receive stock";
          const item = modal.id ? productById(modal.id) : null;
          body = `<form data-form="stock" class="form-grid">${item ? `<input type="hidden" name="id" value="${item.id}"><p class="subtitle">Add units to <strong>${safe(item.name)}</strong>. Current stock: ${item.stock}.</p>` : `<div class="field"><label>Inventory item</label><select name="id">${state.products.filter(p => p.category === "Inventory").map(p => `<option value="${p.id}">${safe(p.name)} · ${p.stock} on hand</option>`).join("")}</select></div>`}<div class="field"><label>Quantity to receive</label><input type="number" name="quantity" min="1" step="1" required placeholder="e.g. 12"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Update stock</button></div></form>`;
        } else if (modal.type === "new-employee") {
          title = "Add employee";
          body = `<form data-form="employee" class="form-grid"><div class="field"><label>Employee name</label><input name="name" required placeholder="Full name"></div><div class="field"><label>Role</label><select name="role"><option>Barista</option><option>Cashier</option><option>Operations admin</option></select></div><div class="field"><label>Shift</label><select name="shift"><option>Shift A</option><option>Shift B</option><option>Manager</option></select></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Add employee</button></div></form>`;
        } else if (modal.type === "customize") {
          const item = productById(modal.id);
          title = item.name;
          body = `<form data-form="customize" class="form-grid"><input type="hidden" name="id" value="${item.id}"><p class="subtitle">${safe(item.description)}</p><div class="field"><label>Size</label><select name="size"><option value="">Regular · 12 oz</option><option value="Large">Large · +₱20</option></select></div><div class="field"><label>Milk</label><select name="milk"><option value="">Regular milk</option><option value="Oat milk">Oat milk · +₱20</option></select></div><div class="field"><label>Temperature</label><select name="temperature"><option>Iced</option><option>Hot</option></select></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Add to order · ${money(item.price)}</button></div></form>`;
        } else if (modal.type === "cash-in") {
          title = "Add wallet balance";
          body = `<form data-form="cash-in" class="form-grid"><p class="subtitle">This is a local demo action; it does not charge a real payment method.</p><div class="field"><label>Cash-in amount (₱)</label><input type="number" name="amount" min="50" max="10000" step="50" required placeholder="e.g. 500"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button class="button">Add demo balance</button></div></form>`;
        } else {
          title = "Demo feature";
          body = `<p class="subtitle">This prototype does not connect to a real payment, barcode reader, or external notification service. No transaction was sent.</p><div class="form-actions"><button type="button" class="button" data-action="close-modal">Got it</button></div>`;
        }
        return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${safe(title)}</h2><p class="subtitle">360 Degrees Specialty Cafe · Lipa Branch</p></div><button class="close" data-action="close-modal" aria-label="Close">×</button></div>${body}</section></div>`;
      }
      function render() {
        let content;
        if (state.role === "admin") content = ({ overview: dashboard, inventory: inventoryPage, products: productsPage, promotions: promotionsPage, employees: employeesPage, reports: reportsPage }[state.page] || dashboard)();
        else if (state.role === "staff") content = ({ pos: posPage, queue: queuePage, receipts: receiptsPage }[state.page] || posPage)();
        else content = ({ home: customerHome, menu: customerMenu, orders: customerOrders, history: customerHistory, wallet: customerWallet }[state.page] || customerHome)();
        document.getElementById("content-view").innerHTML = content;
        document.getElementById("breadcrumb-page").textContent = pageNames[state.page] || "Workspace";
        document.querySelectorAll(".nav [data-page], .mobile-nav [data-page]").forEach(button => {
          const active = button.dataset.page === state.page;
          button.classList.toggle("active", active);
          if (active) button.setAttribute("aria-current", "page");
          else button.removeAttribute("aria-current");
        });
        document.getElementById("overlay-root").innerHTML = `${state.notice ? `<div class="notice" role="status">${safe(state.notice)}</div>` : ""}${state.modal ? modalMarkup() : ""}`;
      }
      function addToCart(id, option = "") {
        const product = productById(id);
        if (!product || product.category === "Inventory") return;
        const key = `${product.id}:${option}`;
        const existing = state.cart.find(line => line.key === key);
        if (existing) existing.qty += 1;
        else state.cart.push({ key, id: product.id, name: product.name, price: product.price + (option.includes("Large") ? 20 : 0) + (option.includes("Oat") ? 20 : 0), qty: 1, option: option || "Regular · Iced" });
        save();
        notify(`${product.name} added to your order.`);
      }
      function completeOrder() {
        if (!state.cart.length) return;
        const total = state.cart.reduce((sum, line) => sum + line.price * line.qty, 0);
        const nextNumber = Math.max(1846, ...state.orders.map(order => Number(order.id.split("-")[1]) || 0)) + 1;
        const items = state.cart.map(line => `${line.name} × ${line.qty}`).join(", ");
        if (state.role === "customer") {
          if (state.wallet < total) {
            state.orders.unshift({ id: `SC-${nextNumber}`, customer: "Mika Reyes", items, total, status: "New", channel: "Online" });
            state.wallet = Math.max(0, state.wallet);
            notify(`Order #SC-${nextNumber} placed. Pay at pickup or in store.`);
          } else {
            state.wallet -= total;
            state.orders.unshift({ id: `SC-${nextNumber}`, customer: "Mika Reyes", items, total, status: "New", channel: "Online" });
            notify(`Order #SC-${nextNumber} placed. Your pickup order is in the queue.`);
          }
          state.points += Math.floor(total / 10);
          state.page = "orders";
        } else {
          state.orders.unshift({ id: `SC-${nextNumber}`, customer: "Walk-in", items, total, status: "Ready for pickup", channel: "Counter" });
          state.sales += total;
          state.points += Math.floor(total / 10);
          notify("Payment recorded in the demo. Stock has been updated.");
        }
        for (const line of state.cart) {
          const product = productById(line.id);
          if (product) product.stock = Math.max(0, product.stock - line.qty);
        }
        state.cart = [];
        save();
        render();
      }
      document.addEventListener("click", event => {
        const button = event.target.closest("[data-action], [data-page], [data-category]");
        if (!button) return;
        if (button.dataset.page) { setPage(button.dataset.page); return; }
        if (button.dataset.category) { state.category = button.dataset.category; render(); return; }
        const action = button.dataset.action;
        if (action === "backdrop" && event.target !== button) return;
        if (action === "close-modal" || action === "backdrop") { state.modal = null; render(); return; }
        if (action === "new-product" || action === "new-promo" || action === "new-employee" || action === "add-stock" || action === "cash-in") { state.modal = { type: action }; render(); return; }
        if (action === "edit-product" || action === "restock") { state.modal = { type: action, id: Number(button.dataset.id) }; render(); return; }
        if (action === "add-cart") { state.modal = { type: "customize", id: Number(button.dataset.id) }; render(); return; }
        if (action === "checkout" || action === "place-order") { completeOrder(); return; }
        if (action === "clear-cart") { state.cart = []; save(); render(); return; }
        if (action === "qty") {
          const line = state.cart[Number(button.dataset.index)];
          if (line) { line.qty += Number(button.dataset.change); if (line.qty <= 0) state.cart.splice(Number(button.dataset.index), 1); save(); render(); }
          return;
        }
        if (action === "advance-order") {
          const order = state.orders.find(item => item.id === button.dataset.id);
          if (!order) return;
          if (order.status === "New") order.status = "Preparing";
          else if (order.status === "Preparing") order.status = "Ready for pickup";
          else {
            state.orderHistory.unshift({ ...order, status: "Completed", completedAt: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) });
            state.orders = state.orders.filter(item => item !== order);
            notify(`${order.id} marked as picked up and added to order history.`);
          }
          save(); render(); return;
        }
        if (action === "remove-promo") { state.promos = state.promos.filter(promo => promo.id !== Number(button.dataset.id)); save(); render(); notify("Promotion removed."); return; }
        if (action === "scan" || action === "notifications" || action === "wallet-history") { state.modal = { type: action }; render(); return; }
      });
      document.addEventListener("change", event => {
        if (event.target.matches("[data-role-select]")) { goRole(event.target.value); return; }
        if (event.target.matches("[data-filter]")) { state.category = event.target.value; render(); }
      });
      document.addEventListener("input", event => {
        if (!event.target.matches("[data-search]")) return;
        const cursor = event.target.selectionStart;
        state.search = event.target.value;
        render();
        const search = document.querySelector("[data-search]");
        search?.focus();
        search?.setSelectionRange(cursor, cursor);
      });
      document.addEventListener("submit", event => {
        const form = event.target.closest("[data-form]");
        if (!form) return;
        event.preventDefault();
        const data = new FormData(form);
        const kind = form.dataset.form;
        if (kind === "product") {
          const id = Number(data.get("id"));
          const existing = productById(id);
          const product = { id: id || Math.max(0, ...state.products.map(item => item.id)) + 1, name: String(data.get("name")).trim(), category: String(data.get("category")), price: Number(data.get("price")), stock: Number(data.get("stock")), description: String(data.get("description")).trim(), emoji: existing?.emoji || "☕" };
          if (existing) Object.assign(existing, product); else state.products.unshift(product);
          state.modal = null; save(); render(); notify(existing ? "Product updated." : "Product added to the catalog."); return;
        }
        if (kind === "promo") {
          state.promos.unshift({ id: Date.now(), name: String(data.get("name")).trim(), detail: String(data.get("detail")).trim(), status: "Active" });
          state.modal = null; save(); render(); notify("Promotion created."); return;
        }
        if (kind === "stock") {
          const item = productById(data.get("id"));
          if (item) item.stock += Number(data.get("quantity"));
          state.modal = null; save(); render(); notify("Inventory quantity updated."); return;
        }
        if (kind === "employee") {
          state.employees.push({ name: String(data.get("name")).trim(), role: String(data.get("role")), shift: String(data.get("shift")), status: "Active" });
          state.modal = null; save(); render(); notify("Employee added to the team list."); return;
        }
        if (kind === "customize") {
          const product = productById(data.get("id"));
          const options = [data.get("size"), data.get("temperature"), data.get("milk")].filter(Boolean).join(" · ");
          state.modal = null;
          addToCart(product.id, options); return;
        }
        if (kind === "cash-in") {
          const amount = Number(data.get("amount"));
          if (amount < 50 || amount > 10000) { notify("Choose a demo cash-in amount from ₱50 to ₱10,000."); return; }
          state.wallet += amount; state.modal = null; save(); render(); notify(`${money(amount)} demo balance added to your wallet.`); return;
        }
      });
      render();
