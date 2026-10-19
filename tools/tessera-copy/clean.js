// Removes Shopify's analytics (and the checkout pre-loader) from a copied page. The copy is a portfolio piece: it must not report
// visits to the client's store analytics, and those scripts call Shopify endpoints the copy cannot serve.
const TRACKING = [
  'wpmLoader',                 // web pixels manager
  '__TREKKIE_SHIM_QUEUE',      // Trekkie analytics shim
  'class="analytics"',         // Trekkie loader
  '"sendBeacon" in navigator', // performance beacon
  'shopify-perf-kit',          // performance kit
  'monorail',                  // event pipeline
  'checkouts/internal/preloads', // warms up checkout, which only happens on the real store
];

function cleanHtml(html) {
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (tag) => (TRACKING.some((t) => tag.includes(t)) ? '' : tag));
  return html.replace(/<link\b[^>]*monorail[^>]*>/g, '');
}

module.exports = { cleanHtml };
