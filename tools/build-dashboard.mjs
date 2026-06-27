import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(readFileSync(join(root, "data", file), "utf8"));

const data = {
  accounts: readJson("accounts.json"),
  sellers: readJson("sellers.json"),
  orders: readJson("orders.json"),
  products: readJson("products.json"),
  claims: readJson("claims.json"),
  generatedAt: new Date().toISOString(),
};

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Carousell Claim Dataset Dashboard</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #08090a;
      --panel: #101214;
      --panel-2: #15181b;
      --line: #272b30;
      --line-2: #343a40;
      --text: #f4f4f5;
      --muted: #9ca3af;
      --faint: #6b7280;
      --green: #34d399;
      --amber: #fbbf24;
      --red: #fb7185;
      --blue: #60a5fa;
      --radius: 8px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      background:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
        radial-gradient(circle at 10% 0%, rgba(96,165,250,.08), transparent 28%),
        radial-gradient(circle at 90% 10%, rgba(52,211,153,.07), transparent 24%),
        var(--bg);
      background-size: 56px 56px, 56px 56px, auto, auto, auto;
      color: var(--text);
    }
    button, input, select { font: inherit; }
    button { cursor: pointer; }
    .shell { max-width: 1540px; margin: 0 auto; padding: 20px; }
    header {
      display: grid;
      gap: 16px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); line-height: 1; letter-spacing: 0; }
    .sub { margin: 10px 0 0; max-width: 760px; color: var(--muted); line-height: 1.55; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 30px;
      padding: 6px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(16,18,20,.82);
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
      white-space: nowrap;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
    .stats {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      margin: 18px 0;
    }
    .stat, .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(21,24,27,.92), rgba(10,11,13,.92));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
    }
    .stat { padding: 14px; }
    .stat .label { color: var(--faint); font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; }
    .stat .value { margin-top: 8px; font-size: 26px; font-weight: 750; }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) 180px 180px;
      gap: 10px;
      margin-bottom: 14px;
    }
    input, select {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #0b0d0f;
      color: var(--text);
      padding: 0 12px;
      outline: none;
    }
    input:focus, select:focus { border-color: var(--line-2); }
    .layout {
      display: grid;
      grid-template-columns: 420px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }
    .list { max-height: calc(100vh - 230px); overflow: auto; }
    .row {
      width: 100%;
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      color: inherit;
      padding: 12px;
      text-align: left;
    }
    .row:hover, .row.active { background: rgba(255,255,255,.045); }
    .rowtop { display: flex; gap: 8px; justify-content: space-between; align-items: start; }
    .id { color: #fff; font-weight: 750; }
    .name { margin-top: 5px; color: var(--muted); font-size: 13px; line-height: 1.35; }
    .small { color: var(--faint); font-size: 12px; }
    .badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 4px 7px;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }
    .low { color: #bbf7d0; border-color: rgba(52,211,153,.28); background: rgba(52,211,153,.10); }
    .elevated { color: #fde68a; border-color: rgba(251,191,36,.30); background: rgba(251,191,36,.10); }
    .high { color: #fecdd3; border-color: rgba(251,113,133,.34); background: rgba(251,113,133,.12); }
    .detail { padding: 16px; min-height: calc(100vh - 230px); }
    .detail-head { display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr) 360px; align-items: start; }
    h2 { margin: 0; font-size: 24px; letter-spacing: 0; }
    h3 { margin: 0 0 10px; font-size: 14px; color: #fff; }
    .desc { margin: 10px 0 0; color: var(--muted); line-height: 1.55; }
    .imagebox {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #090a0b;
      aspect-ratio: 4 / 3;
    }
    .imagebox img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .grid { display: grid; gap: 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; }
    .kv {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(8,9,10,.55);
      padding: 10px;
      min-width: 0;
    }
    .kv .k { color: var(--faint); font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; }
    .kv .v { margin-top: 6px; color: var(--text); font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
    .sections { display: grid; gap: 12px; margin-top: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .section { border: 1px solid var(--line); border-radius: var(--radius); background: rgba(8,9,10,.48); padding: 12px; }
    .json {
      white-space: pre-wrap;
      overflow: auto;
      max-height: 280px;
      margin: 0;
      color: #d1d5db;
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .empty { padding: 28px; text-align: center; color: var(--faint); }
    @media (max-width: 1080px) {
      header, .layout, .detail-head { grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .toolbar { grid-template-columns: 1fr; }
      .list { max-height: 360px; }
      .sections, .grid { grid-template-columns: 1fr; }
      .meta { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div>
        <h1>Behavioural Truth Dashboard</h1>
        <p class="sub">A local viewer for Carousell dispute-review behavioural truth: buyer profiles, orders, sellers, products, claim descriptions, private eval labels, and attached evidence images. Built from the current JSON files in <code>data/</code>.</p>
      </div>
      <div class="meta">
        <span class="pill"><span class="dot"></span>Local static viewer</span>
        <span class="pill" id="generatedAt"></span>
      </div>
    </header>

    <section class="stats" id="stats"></section>

    <section class="toolbar">
      <input id="search" type="search" placeholder="Search IDs, buyers, sellers, products, descriptions..." />
      <select id="view">
        <option value="claims">Claims</option>
        <option value="accounts">Buyer profiles</option>
        <option value="orders">Orders</option>
        <option value="sellers">Sellers</option>
        <option value="products">Products</option>
      </select>
      <select id="band">
        <option value="all">All bands</option>
        <option value="Low">Low</option>
        <option value="Elevated">Elevated</option>
        <option value="High">High</option>
      </select>
    </section>

    <main class="layout">
      <aside class="panel list" id="list"></aside>
      <section class="panel detail" id="detail"></section>
    </main>
  </div>

  <script id="dataset" type="application/json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>
  <script>
    const db = JSON.parse(document.getElementById("dataset").textContent);
    const $ = (id) => document.getElementById(id);
    let state = { view: "claims", q: "", band: "all", selected: null };

    const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
    const accounts = byId(db.accounts);
    const sellers = byId(db.sellers);
    const orders = byId(db.orders);
    const products = byId(db.products);
    const claims = byId(db.claims);

    function init() {
      $("generatedAt").textContent = "Generated " + new Date(db.generatedAt).toLocaleString();
      $("search").addEventListener("input", (event) => { state.q = event.target.value.toLowerCase(); render(); });
      $("view").addEventListener("change", (event) => { state.view = event.target.value; state.selected = null; render(); });
      $("band").addEventListener("change", (event) => { state.band = event.target.value; render(); });
      render();
    }

    function render() {
      renderStats();
      const items = filteredItems();
      if (!state.selected && items[0]) state.selected = items[0].id;
      if (items.length && !items.some((item) => item.id === state.selected)) state.selected = items[0].id;
      renderList(items);
      renderDetail(items.find((item) => item.id === state.selected) || items[0]);
    }

    function filteredItems() {
      const base = db[state.view];
      const q = state.q;
      return base.filter((item) => {
        if (state.view === "claims" && state.band !== "all" && item._dev?.expected_band !== state.band) return false;
        if (!q) return true;
        return JSON.stringify(enrich(item)).toLowerCase().includes(q);
      });
    }

    function enrich(item) {
      if (state.view !== "claims") return item;
      return {
        ...item,
        account: accounts[item.account_id],
        order: orders[item.order_id],
        product: products[item.product_id],
        seller: sellers[orders[item.order_id]?.seller_id],
      };
    }

    function renderStats() {
      const high = db.claims.filter((c) => c._dev?.expected_band === "High").length;
      const elevated = db.claims.filter((c) => c._dev?.expected_band === "Elevated").length;
      const low = db.claims.filter((c) => c._dev?.expected_band === "Low").length;
      $("stats").innerHTML = [
        stat("Claims", db.claims.length),
        stat("Buyer profiles", db.accounts.length),
        stat("Orders", db.orders.length),
        stat("Products", db.products.length),
        stat("Bands", high + " high / " + elevated + " elevated / " + low + " low"),
      ].join("");
    }

    function stat(label, value) {
      return '<div class="stat"><div class="label">' + esc(label) + '</div><div class="value">' + esc(value) + '</div></div>';
    }

    function renderList(items) {
      $("list").innerHTML = items.length ? items.map((item) => row(item)).join("") : '<div class="empty">No records match.</div>';
      document.querySelectorAll(".row").forEach((button) => {
        button.addEventListener("click", () => { state.selected = button.dataset.id; render(); });
      });
    }

    function row(item) {
      const active = item.id === state.selected ? " active" : "";
      if (state.view === "claims") {
        const product = products[item.product_id];
        const account = accounts[item.account_id];
        const band = item._dev?.expected_band || "Unknown";
        return '<button class="row' + active + '" data-id="' + esc(item.id) + '">' +
          '<div class="rowtop"><span class="id">' + esc(item.id) + '</span>' + bandBadge(band) + '</div>' +
          '<div class="name">' + esc(product?.name || item.product_id) + '</div>' +
          '<div class="small">' + esc(account?.display_name || item.account_id) + ' · ' + esc(item.reason_category) + '</div>' +
        '</button>';
      }
      const primary = item.display_name || item.name || item.id;
      return '<button class="row' + active + '" data-id="' + esc(item.id) + '">' +
        '<div class="rowtop"><span class="id">' + esc(item.id) + '</span></div>' +
        '<div class="name">' + esc(primary) + '</div>' +
        '<div class="small">' + esc(summary(item)) + '</div>' +
      '</button>';
    }

    function renderDetail(item) {
      if (!item) {
        $("detail").innerHTML = '<div class="empty">Select a record.</div>';
        return;
      }
      if (state.view === "claims") return renderClaim(item);
      if (state.view === "accounts") return renderAccount(item);
      if (state.view === "orders") return renderOrder(item);
      if (state.view === "sellers") return renderSeller(item);
      return renderProduct(item);
    }

    function renderClaim(claim) {
      const account = accounts[claim.account_id] || {};
      const order = orders[claim.order_id] || {};
      const product = products[claim.product_id] || {};
      const seller = sellers[order.seller_id] || {};
      const image = claim.images?.[0];
      $("detail").innerHTML =
        '<div class="detail-head">' +
          '<div><div class="chips">' + bandBadge(claim._dev?.expected_band) + badge(account.user_profile_badge || "profile unknown") + badge(image?.metadata_status || "metadata unknown") + '</div>' +
          '<h2>' + esc(claim.id) + ' · ' + esc(product.name || claim.product_id) + '</h2>' +
          '<p class="desc">' + esc(claim.refund_request_description || claim.claim_text || "") + '</p></div>' +
          '<div class="imagebox">' + (image ? '<img src="data/images/claims/' + encodeURIComponent(image.filename) + '" alt="' + esc(image.filename) + '">' : '') + '</div>' +
        '</div>' +
        '<div class="grid">' +
          kv("Buyer", account.display_name || claim.account_id) +
          kv("Buyer profile", account.user_profile_badge || "n/a") +
          kv("ID verified", account.identity_verified ? "Yes" : "No") +
          kv("Seller", seller.display_name || order.seller_id || "n/a") +
          kv("Seller profile", seller.user_profile_badge || "n/a") +
          kv("Order", claim.order_id) +
          kv("Refund type", order.refund_type_requested || "n/a") +
          kv("Refund amount", money(order.refund_amount_requested_sgd)) +
          kv("Return required", String(order.return_required)) +
          kv("Fulfilment", order.fulfilment_method || "n/a") +
          kv("Dispute deadline", order.dispute_window_deadline || "n/a") +
        '</div>' +
        '<div class="sections">' +
          section("Buyer behavioural truth", obj(account)) +
          section("Order", obj(order)) +
          section("Seller", obj(seller)) +
          section("Product", obj(product)) +
          section("Image", obj(image || {})) +
          section("Private eval label", obj(claim._dev || {})) +
        '</div>';
    }

    function renderAccount(account) {
      const accountClaims = db.claims.filter((c) => c.account_id === account.id);
      $("detail").innerHTML =
        '<h2>' + esc(account.id) + ' · ' + esc(account.display_name) + '</h2>' +
        '<p class="desc">' + esc(account.profile_note || "") + '</p>' +
        '<div class="grid">' +
          kv("Created", account.account_created_at) +
          kv("Profile badge", account.user_profile_badge || "n/a") +
          kv("ID verified", account.identity_verified ? "Yes" : "No") +
          kv("Age", account.account_age_days + " days") +
          kv("Orders", account.total_orders) +
          kv("Refunds", account.total_refunds) +
          kv("Recent claims", account.recent_refund_claims) +
          kv("Claims in 30d", account.claims_last_30_days) +
        '</div>' +
        '<div class="sections">' + section("Claims for this buyer", accountClaims.map((c) => c.id + " · " + (products[c.product_id]?.name || c.product_id) + " · " + c._dev?.expected_band).join("\\n") || "None") + section("Raw behavioural truth", obj(account)) + '</div>';
    }

    function renderOrder(order) {
      const orderClaims = db.claims.filter((c) => c.order_id === order.id);
      $("detail").innerHTML =
        '<h2>' + esc(order.id) + '</h2>' +
        '<div class="grid">' +
          kv("Buyer", accounts[order.account_id]?.display_name || order.account_id) +
          kv("Seller", sellers[order.seller_id]?.display_name || order.seller_id) +
          kv("Product", products[order.product_id]?.name || order.product_id) +
          kv("Items", order.items) +
          kv("Order claims", order.total_claims_against_order) +
          kv("Programme", order.programme) +
          kv("Fulfilment", order.fulfilment_method) +
          kv("Refund type", order.refund_type_requested) +
        '</div>' +
        '<div class="sections">' + section("Claims on order", orderClaims.map((c) => c.id + " · " + c.refund_request_description).join("\\n") || "None") + section("Raw order", obj(order)) + '</div>';
    }

    function renderSeller(seller) {
      const sellerOrders = db.orders.filter((o) => o.seller_id === seller.id);
      $("detail").innerHTML =
        '<h2>' + esc(seller.id) + ' · ' + esc(seller.display_name) + '</h2>' +
        '<div class="grid">' +
          kv("Type", seller.seller_type) +
          kv("Profile badge", seller.user_profile_badge || "n/a") +
          kv("ID verified", seller.identity_verified ? "Yes" : "No") +
          kv("Created", seller.seller_created_at) +
          kv("Orders 90d", seller.orders_last_90d) +
          kv("Disputes 90d", seller.disputes_last_90d) +
          kv("Packaging complaints", seller.packaging_complaints_count) +
        '</div>' +
        '<div class="sections">' + section("Orders", sellerOrders.map((o) => o.id + " · " + (products[o.product_id]?.name || o.product_id)).join("\\n") || "None") + section("Raw seller", obj(seller)) + '</div>';
    }

    function renderProduct(product) {
      const productClaims = db.claims.filter((c) => c.product_id === product.id);
      const ref = product.reference_image ? '<div class="imagebox"><img src="data/images/reference/' + encodeURIComponent(product.reference_image) + '" alt="' + esc(product.reference_image) + '"></div>' : "";
      $("detail").innerHTML =
        '<div class="detail-head"><div><h2>' + esc(product.id) + ' · ' + esc(product.name) + '</h2><p class="desc">' + esc(product.material || "") + '</p></div>' + ref + '</div>' +
        '<div class="grid">' +
          kv("Category", product.category) +
          kv("Price", money(product.price_sgd)) +
          kv("Reference image", product.reference_image || "None") +
          kv("Claims", productClaims.length) +
        '</div>' +
        '<div class="sections">' + section("Typical failure modes", (product.typical_failure_modes || []).join("\\n")) + section("Claims", productClaims.map((c) => c.id + " · " + c._dev?.expected_band + " · " + c.refund_request_description).join("\\n") || "None") + section("Raw product", obj(product)) + '</div>';
    }

    function kv(k, v) { return '<div class="kv"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v ?? "n/a") + '</div></div>'; }
    function section(title, content) { return '<div class="section"><h3>' + esc(title) + '</h3><pre class="json">' + esc(content || "None") + '</pre></div>'; }
    function obj(value) { return JSON.stringify(value, null, 2); }
    function badge(text) { return '<span class="badge">' + esc(text || "n/a") + '</span>'; }
    function bandBadge(band) { return '<span class="badge ' + String(band || "").toLowerCase() + '">' + esc(band || "Unknown") + '</span>'; }
    function money(value) { return typeof value === "number" ? "SGD " + value.toFixed(2) : "n/a"; }
    function summary(item) {
      if (state.view === "accounts") return item.profile_note || "";
      if (state.view === "orders") return [item.account_id, item.seller_id, item.product_id].join(" · ");
      if (state.view === "sellers") return [item.seller_type, item.disputes_last_90d + " disputes"].join(" · ");
      if (state.view === "products") return [item.category, money(item.price_sgd)].join(" · ");
      return "";
    }
    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }
    init();
  </script>
</body>
</html>`;

writeFileSync(join(root, "dataset-dashboard.html"), html);
console.log("Wrote dataset-dashboard.html");
