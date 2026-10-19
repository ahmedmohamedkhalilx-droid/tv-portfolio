// Copies the public Tessera storefront (English + Arabic) into a static folder that works inside the
// portfolio. Pages are saved as HTML with their links pointed at the copy; styles, scripts, fonts and
// photos keep loading from Shopify's CDN (it allows cross-origin use). Basket, checkout, account, search
// and newsletter forms are sent to the real store in a new tab by _copy.js.
const fs = require('fs');
const path = require('path');
const { cleanHtml } = require('./clean');
const STORE = 'https://tessera-4987.myshopify.com';
const HOST = new URL(STORE).host;
const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'tessera-site');

const PAGE_RE = /^(\/ar)?(\/|\/collections|\/collections\/[^/.]+|\/products\/[^/.]+|\/pages\/[^/.]+|\/blogs\/[^/.]+(\/[^/.]+)?|\/policies\/[^/.]+)$/;
const ASSET_RE = /^\/(cdn|checkouts|services|apps|wpm|s\/files)\b|\.(css|js|png|jpe?g|webp|gif|svg|woff2?|ico|json|xml|txt)$/i;

// canonical key for a store URL: path (+ ?page=N for paginated listings), or null if it is not a page we copy
function keyOf(u) {
  let p = u.pathname.replace(/\/+$/, '') || '/';
  p = p.replace(/^((?:\/ar)?)\/collections\/[^/]+\/products\//, '$1/products/'); // product-in-collection URLs → the product page
  if (p === '/ar/') p = '/ar';
  if (!PAGE_RE.test(p) && p !== '/ar') return null;
  const page = Number(u.searchParams.get('page') || 1);
  return page > 1 ? `${p}?page=${page}` : p;
}
function localFile(key) {
  const [p, q] = key.split('?page=');
  const dir = (p === '/' ? '' : p.slice(1)) + (q ? `/page-${q}` : '');
  return path.posix.join(dir, 'index.html');
}
const dirOf = (key) => path.posix.dirname(localFile(key));
function rel(fromDir, toDir) {
  let r = path.posix.relative(fromDir === '.' ? '' : fromDir, toDir === '.' ? '' : toDir);
  return (r ? r + '/' : './');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (portfolio copy)' } });
      if (res.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      return { status: res.status, url: res.url, text: res.ok ? await res.text() : '' };
    } catch (e) { await sleep(1500); }
  }
  return { status: 0, url, text: '' };
}

(async () => {
  const seeds = ['/', '/ar', '/collections', '/ar/collections', '/collections/all', '/ar/collections/all'];
  const index = await get(STORE + '/sitemap.xml');
  const maps = [...index.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  for (const m of maps) {
    const sm = await get(m);
    for (const x of sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)) seeds.push(new URL(x[1].replace(/&amp;/g, '&')).pathname);
    await sleep(200);
  }
  const queue = [];
  const seen = new Set();
  const pages = new Map(); // key -> html
  const alias = new Map(); // requested key -> final key (after redirects)
  const push = (u) => { const k = keyOf(u); if (k && !seen.has(k)) { seen.add(k); queue.push(k); } };
  seeds.forEach((s) => push(new URL(s, STORE)));

  let done = 0;
  async function worker() {
    while (queue.length) {
      const key = queue.shift();
      const res = await get(STORE + key);
      done++;
      if (res.status === 200 && res.text) {
        const finalKey = keyOf(new URL(res.url)) || key;
        if (finalKey !== key) alias.set(key, finalKey);
        if (!pages.has(finalKey)) pages.set(finalKey, res.text);
        for (const m of res.text.matchAll(/href="([^"]+)"/g)) {
          const v = m[1].replace(/&amp;/g, '&');
          if (v.startsWith('/') && !v.startsWith('//')) push(new URL(v, STORE));
          else if (v.startsWith(STORE) || v.startsWith('//' + HOST)) push(new URL(v.startsWith('//') ? 'https:' + v : v));
        }
      } else console.log('skip', res.status, key);
      if (done % 25 === 0) console.log(`fetched ${done}, saved ${pages.size}, queued ${queue.length}`);
      await sleep(250);
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  console.log(`crawl finished: ${pages.size} pages`);

  const has = (k) => pages.has(k) || (alias.has(k) && pages.has(alias.get(k)));
  const target = (k) => (pages.has(k) ? k : alias.get(k));

  function rewriteValue(val, attr, fromDir) {
    const raw = val.replace(/&amp;/g, '&');
    let url;
    if (raw.startsWith('//')) url = 'https:' + raw;
    else if (raw.startsWith('/')) url = STORE + raw;
    else if (raw.startsWith(STORE)) url = raw;
    else return val; // relative, anchors, mailto:, other sites
    const u = new URL(url);
    if (u.host !== HOST) return val;
    if (ASSET_RE.test(u.pathname)) return '//' + HOST + u.pathname + u.search.replace(/&/g, '&amp;') + u.hash;
    if (attr === 'action') return STORE + u.pathname; // store-only forms: _copy.js sends them to the real store
    const k = keyOf(u);
    if (k && has(k)) return rel(fromDir, dirOf(target(k))) + u.hash;
    return STORE + u.pathname + u.search.replace(/&/g, '&amp;') + u.hash; // not copied: opens the real store (new tab)
  }

  fs.mkdirSync(OUT, { recursive: true }); // empty the folder (not delete it: it may be a shell working directory)
  for (const e of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
  let bytes = 0;
  for (const [key, html0] of pages) {
    const fromDir = dirOf(key);
    let html = cleanHtml(html0).replace(/(["'\s,(])\/cdn\//g, `$1//${HOST}/cdn/`); // root-relative CDN refs inside srcset, inline styles
    html = html.replace(/\b(href|action|src)="([^"]*)"/g, (m, attr, val) => `${attr}="${rewriteValue(val, attr, fromDir)}"`);
    const root = rel(fromDir, '.');
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="robots" content="noindex"><script src="${root}_copy.js" data-root="${root}"></script>`);
    const file = path.join(OUT, localFile(key));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    bytes += Buffer.byteLength(html);
  }
  fs.copyFileSync(path.join(__dirname, 'copy-runtime.js'), path.join(OUT, '_copy.js')); // the in-page helper every copied page loads
  fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify({ store: STORE, copied: new Date().toISOString(), pages: [...pages.keys()].sort(), alias: Object.fromEntries(alias) }, null, 1));
  console.log(`wrote ${pages.size} pages, ${(bytes / 1048576).toFixed(1)} MB`);
})().catch((e) => { console.error(e); process.exit(1); });
