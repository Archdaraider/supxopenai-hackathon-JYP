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
  <title>Test User Data Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #eef2ff;
      --surface: #ffffff;
      --surface-2: #f8fbff;
      --ink: #14151f;
      --muted: #626b80;
      --faint: #8a93a8;
      --line: #d8deef;
      --line-2: #bcc6dd;
      --green: #08795b;
      --amber: #a05a00;
      --red: #b42336;
      --blue: #2457c5;
      --shadow: 0 22px 58px rgba(36, 55, 103, .13);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      color: var(--ink);
      background:
        linear-gradient(135deg, rgba(36,87,197,.12), transparent 36%),
        linear-gradient(315deg, rgba(8,121,91,.10), transparent 32%),
        var(--bg);
    }
    button, input, select, summary { font: inherit; }
    button { cursor: pointer; }
    .shell { max-width: 1720px; margin: 0 auto; padding: 22px; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 18px;
      margin-bottom: 18px;
    }
    .eyebrow, .label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 850;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { margin-top: 4px; font-size: clamp(36px, 5vw, 72px); line-height: .92; letter-spacing: 0; }
    .sub { margin-top: 12px; max-width: 900px; color: var(--muted); line-height: 1.55; font-size: 16px; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .pill, .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 5px 9px;
      background: rgba(255,255,255,.72);
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) 180px;
      gap: 10px;
      margin-bottom: 14px;
    }
    input, select {
      width: 100%;
      min-height: 48px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(255,255,255,.86);
      color: var(--ink);
      padding: 0 12px;
      outline: none;
    }
    input:focus, select:focus { border-color: var(--line-2); }
    .stats {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 16px;
    }
    .stat, .panel {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,.92);
      box-shadow: var(--shadow);
    }
    .stat { padding: 18px; min-height: 116px; display: grid; align-content: space-between; }
    .stat strong { display: block; margin-top: 12px; font-size: 38px; line-height: .95; }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    .case-list {
      max-height: none;
      overflow: visible;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      padding: 12px;
    }
    .case-row {
      width: 100%;
      min-height: 158px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, #ffffff, #f9fbff);
      color: inherit;
      text-align: left;
      padding: 14px;
      box-shadow: 0 10px 28px rgba(36,55,103,.06);
    }
    .case-row:hover, .case-row.active { border-color: #8fa7df; background: #f7faff; }
    .case-row.active { box-shadow: inset 0 0 0 2px #8fa7df, 0 14px 34px rgba(36,55,103,.12); }
    .row-top { display: flex; justify-content: space-between; align-items: start; gap: 8px; }
    .case-id { font-weight: 900; }
    .row-title { margin-top: 14px; font-weight: 900; line-height: 1.24; font-size: 17px; }
    .row-meta { margin-top: 10px; color: var(--muted); font-size: 13px; line-height: 1.35; }
    .detail { padding: 22px; min-height: auto; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(380px, .9fr);
      gap: 22px;
      align-items: start;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
    .badge.low { color: #0f5132; border-color: #b9dfc8; background: #e7f4ec; }
    .badge.elevated { color: #7a3d00; border-color: #f1d18d; background: #fff4dc; }
    .badge.high { color: #842029; border-color: #f2b8c1; background: #fdecef; }
    h2 { font-size: clamp(34px, 4vw, 58px); line-height: .96; letter-spacing: 0; }
    .desc { margin-top: 16px; color: var(--muted); line-height: 1.56; font-size: 18px; }
    .process {
      margin-top: 18px;
      border-left: 5px solid #4f7bd9;
      background: #f4f7ff;
      border-radius: 0 12px 12px 0;
      padding: 16px;
      color: #253960;
      font-weight: 760;
      line-height: 1.45;
      font-size: 17px;
    }
    .image-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #f9faf8;
      padding: 18px;
    }
    .image-frame {
      aspect-ratio: 16 / 11;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      display: grid;
      place-items: center;
      padding: 16px;
      overflow: hidden;
    }
    .image-frame img { max-width: 94%; max-height: 94%; object-fit: contain; display: block; border-radius: 4px; box-shadow: 0 10px 26px rgba(20, 25, 21, .10); }
    .image-caption { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 7px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .summary-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--surface-2);
      padding: 18px;
      min-height: 168px;
      min-width: 0;
      display: grid;
      align-content: start;
    }
    .summary-card strong { display: block; margin-top: 12px; font-size: 28px; line-height: 1.05; overflow-wrap: anywhere; }
    .summary-card p { margin-top: 12px; color: var(--muted); font-size: 15px; line-height: 1.45; }
    .wide { grid-column: span 1; }
    .section-band {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .feature {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      padding: 18px;
      min-height: 168px;
    }
    .feature h3 { font-size: 20px; }
    .feature ul { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.5; font-size: 15px; }
    .more {
      margin-top: 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      overflow: hidden;
    }
    .more summary {
      cursor: pointer;
      min-height: 56px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      font-weight: 850;
    }
    .raw-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding: 0 14px 14px;
    }
    .raw-block {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #f9faf8;
      padding: 10px;
      min-width: 0;
    }
    .raw-block h3 { margin-bottom: 8px; font-size: 13px; }
    pre {
      margin: 0;
      white-space: pre-wrap;
      overflow: auto;
      max-height: 260px;
      color: #374151;
      font: 12px/1.48 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .empty { padding: 34px; text-align: center; color: var(--muted); }
    @media (max-width: 1180px) {
      header, .layout, .hero { display: grid; grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .case-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .summary-grid, .section-band, .raw-grid { grid-template-columns: 1fr; }
      .wide { grid-column: span 1; }
      .header-actions { justify-content: flex-start; }
    }
    @media (max-width: 700px) {
      .shell { padding: 10px; }
      .toolbar, .case-list { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div>
        <div class="eyebrow">Presentation Database</div>
        <h1>Test User Data Dashboard</h1>
        <p class="sub">Large-card case summaries for explaining the buyer, seller, order, refund, and evidence characteristics used by the reviewer workflow.</p>
      </div>
      <div class="header-actions">
        <span class="pill"><span class="pulse"></span>Presentation mode</span>
        <span class="pill" id="generatedAt"></span>
      </div>
    </header>

    <section class="stats" id="stats"></section>

    <section class="toolbar">
      <input id="search" type="search" placeholder="Search case, buyer, seller, product, description..." />
      <select id="band">
        <option value="all">All cases</option>
        <option value="Low">Low</option>
        <option value="Elevated">Elevated</option>
        <option value="High">High</option>
      </select>
    </section>

    <main class="layout">
      <aside class="panel case-list" id="list"></aside>
      <section class="panel detail" id="detail"></section>
    </main>
  </div>

  <script id="dataset" type="application/json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>
  <script>
    const db = JSON.parse(document.getElementById("dataset").textContent);
    const $ = (id) => document.getElementById(id);
    let state = { q: "", band: "all", selected: null };

    const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
    const accounts = byId(db.accounts);
    const sellers = byId(db.sellers);
    const orders = byId(db.orders);
    const products = byId(db.products);

    function init() {
      $("generatedAt").textContent = "Generated " + new Date(db.generatedAt).toLocaleString();
      $("search").addEventListener("input", (event) => { state.q = event.target.value.toLowerCase(); render(); });
      $("band").addEventListener("change", (event) => { state.band = event.target.value; render(); });
      render();
    }

    function cases() {
      return db.claims.map((claim) => {
        const order = orders[claim.order_id] || {};
        return {
          claim,
          account: accounts[claim.account_id] || {},
          order,
          seller: sellers[order.seller_id] || {},
          product: products[claim.product_id] || {},
          image: claim.images && claim.images[0],
        };
      });
    }

    function filteredCases() {
      const q = state.q;
      return cases().filter((item) => {
        if (state.band !== "all" && item.claim._dev?.expected_band !== state.band) return false;
        if (!q) return true;
        return [
          item.claim.id,
          item.account.display_name,
          item.seller.display_name,
          item.product.name,
          item.claim.refund_request_description,
          item.account.user_profile_badge,
          item.seller.user_profile_badge,
        ].join(" ").toLowerCase().includes(q);
      });
    }

    function render() {
      renderStats();
      const items = filteredCases();
      if (!state.selected && items[0]) state.selected = items[0].claim.id;
      if (items.length && !items.some((item) => item.claim.id === state.selected)) state.selected = items[0].claim.id;
      renderList(items);
      renderDetail(items.find((item) => item.claim.id === state.selected) || items[0]);
    }

    function renderStats() {
      const claimCount = db.claims.length;
      const verified = db.accounts.filter((account) => account.identity_verified).length;
      const avgRefund = db.orders.reduce((sum, order) => sum + Number(order.refund_amount_requested_sgd || 0), 0) / db.orders.length;
      const highSellerContext = db.sellers.filter((seller) => seller.packaging_complaints_count >= 3 || seller.disputes_last_90d >= 4).length;
      const newUsers = db.accounts.filter((account) => account.user_profile_badge === "New User").length;
      $("stats").innerHTML = [
        stat("Dispute claims", claimCount),
        stat("Verified buyers", verified + " / " + db.accounts.length),
        stat("Avg refund", money(avgRefund)),
        stat("Seller context flags", highSellerContext),
        stat("New users", newUsers),
      ].join("");
    }

    function renderList(items) {
      $("list").innerHTML = items.length ? items.map((item) => row(item)).join("") : '<div class="empty">No cases match.</div>';
      document.querySelectorAll(".case-row").forEach((button) => {
        button.addEventListener("click", () => { state.selected = button.dataset.id; render(); });
      });
    }

    function row(item) {
      const active = item.claim.id === state.selected ? " active" : "";
      const band = item.claim._dev?.expected_band || "Unlabeled";
      return '<button class="case-row' + active + '" data-id="' + esc(item.claim.id) + '">' +
        '<div class="row-top"><span class="case-id">' + esc(item.claim.id) + '</span>' + bandBadge(band) + '</div>' +
        '<div class="row-title">' + esc(item.product.name || item.claim.product_id) + '</div>' +
        '<div class="row-meta">' + esc(item.account.user_profile_badge || "Unknown profile") + ' buyer · ' + esc(money(item.order.refund_amount_requested_sgd)) + '</div>' +
      '</button>';
    }

    function renderDetail(item) {
      if (!item) {
        $("detail").innerHTML = '<div class="empty">Select a case.</div>';
        return;
      }

      const refundRate = item.account.total_orders ? item.account.total_refunds / item.account.total_orders : 0;
      const sellerDisputeRate = item.seller.orders_last_90d ? item.seller.disputes_last_90d / item.seller.orders_last_90d : 0;
      const processLine = buildProcessLine(item);
      const imageHtml = item.image ? '<img src="data/images/claims/' + encodeURIComponent(item.image.filename) + '" alt="' + esc(item.image.filename) + '">' : '<span>No image</span>';

      $("detail").innerHTML =
        '<div class="hero">' +
          '<div>' +
            '<div class="chips">' +
              bandBadge(item.claim._dev?.expected_band || "Unlabeled") +
              badge(item.account.user_profile_badge || "Unknown buyer profile") +
              badge(item.seller.user_profile_badge || "Unknown seller profile") +
              badge(item.order.programme || "Buyer Protection") +
            '</div>' +
            '<h2>' + esc(item.product.name || item.claim.product_id) + '</h2>' +
            '<p class="desc">' + esc(item.claim.refund_request_description || item.claim.claim_text || "") + '</p>' +
            '<div class="process">' + esc(processLine) + '</div>' +
          '</div>' +
          '<div class="image-card">' +
            '<div class="image-frame">' + imageHtml + '</div>' +
            '<div class="image-caption">' + badge(item.image?.metadata_status || "metadata unknown") + badge(item.image?.capture_context || "claim evidence") + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="summary-grid">' +
          summaryCard("Buyer statistics", item.account.account_created_at || "n/a", [
            "Account age: " + (item.account.account_age_days ?? "n/a") + " days",
            "Refund rate: " + percent(refundRate),
            "Recent claims: " + (item.account.claims_last_30_days ?? 0) + " in 30 days",
          ]) +
          summaryCard("Verification type", item.account.user_profile_badge || "n/a", [
            item.account.identity_verified ? "Identity verified" : "Identity not verified",
            item.account.user_profile_meaning || "Profile context unavailable",
          ]) +
          summaryCard("Seller reviews", item.seller.user_profile_badge || "n/a", [
            "Orders in 90d: " + (item.seller.orders_last_90d ?? "n/a"),
            "Dispute rate: " + percent(sellerDisputeRate),
            "Packaging complaints: " + (item.seller.packaging_complaints_count ?? 0),
          ]) +
          summaryCard("Refund amount", money(item.order.refund_amount_requested_sgd), [
            "Type: " + human(item.order.refund_type_requested),
            "Return handled separately: " + (item.order.return_required ? "Yes" : "No"),
          ]) +
          summaryCard("Product context", item.product.category || "n/a", [
            "Price: " + money(item.product.price_sgd),
            "Material: " + (item.product.material || "n/a"),
          ], "wide") +
          summaryCard("Fulfilment context", human(item.order.fulfilment_method), [
            "Delivered: " + (item.order.delivered_at || "n/a"),
            "Dispute deadline: " + (item.order.dispute_window_deadline || "n/a"),
          ], "wide") +
        '</div>' +
        '<div class="section-band">' +
          feature("What the reviewer sees", [
            "Buyer claim and attached image are visible first.",
            "Risk context is summarized without exposing raw fixture data.",
            "Raw JSON is hidden below for internal audit only.",
          ]) +
          feature("Important behavioural cues", [
            "Buyer profile: " + (item.account.user_profile_badge || "n/a"),
            "Refund history: " + (item.account.total_refunds ?? 0) + " refunds from " + (item.account.total_orders ?? 0) + " orders",
            "Seller context: " + (item.seller.disputes_last_90d ?? 0) + " recent disputes",
          ]) +
          feature("Evidence characteristics", [
            "Image file: " + (item.image?.filename || "n/a"),
            "Metadata: " + (item.image?.metadata_status || "unknown"),
            "Product failure modes: " + (item.product.typical_failure_modes || []).slice(0, 2).join("; "),
          ]) +
        '</div>' +
        '<details class="more">' +
          '<summary>Show more: underlying dataset records</summary>' +
          '<div class="raw-grid">' +
            rawBlock("Buyer", item.account) +
            rawBlock("Seller", item.seller) +
            rawBlock("Order", item.order) +
            rawBlock("Product", item.product) +
            rawBlock("Claim", item.claim) +
            rawBlock("Image", item.image || {}) +
          '</div>' +
        '</details>';
    }

    function buildProcessLine(item) {
      return (item.account.display_name || "Buyer") + " bought " + (item.product.name || "an item") + " from " + (item.seller.display_name || "seller") + ", claimed damage after delivery, the seller rejected the refund, and the case was escalated to Carousell review.";
    }

    function stat(label, value) {
      return '<div class="stat"><div class="label">' + esc(label) + '</div><strong>' + esc(value) + '</strong></div>';
    }
    function summaryCard(title, value, lines, extraClass) {
      return '<div class="summary-card ' + esc(extraClass || "") + '"><div class="label">' + esc(title) + '</div><strong>' + esc(value) + '</strong><p>' + esc(lines.join(" · ")) + '</p></div>';
    }
    function feature(title, lines) {
      return '<div class="feature"><h3>' + esc(title) + '</h3><ul>' + lines.map((line) => '<li>' + esc(line) + '</li>').join("") + '</ul></div>';
    }
    function rawBlock(title, value) {
      return '<div class="raw-block"><h3>' + esc(title) + '</h3><pre>' + esc(JSON.stringify(value, null, 2)) + '</pre></div>';
    }
    function badge(text) { return '<span class="badge">' + esc(text || "n/a") + '</span>'; }
    function bandBadge(band) { return '<span class="badge ' + String(band || "").toLowerCase() + '">' + esc(band || "Unknown") + '</span>'; }
    function money(value) { return typeof value === "number" && Number.isFinite(value) ? "SGD " + value.toFixed(2) : "n/a"; }
    function percent(value) { return Number.isFinite(value) ? Math.round(value * 100) + "%" : "n/a"; }
    function human(value) { return String(value || "n/a").replaceAll("_", " "); }
    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }
    init();
  </script>
</body>
</html>`;

writeFileSync(join(root, "dataset-dashboard.html"), html);
console.log("Wrote dataset-dashboard.html");
