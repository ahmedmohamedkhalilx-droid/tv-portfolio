// Runs inside the portfolio's copy of the Tessera store (saved as tessera-site/_copy.js).
// The copy is static, so anything that needs Shopify's servers (basket, checkout, account, search,
// newsletter) goes to the real store in a new tab, and the language switch jumps between the English
// and Arabic copies of the same page.
(function () {
  var STORE = 'https://tessera-4987.myshopify.com';
  var me = document.currentScript;
  var ROOT = new URL((me && me.getAttribute('data-root')) || './', location.href); // the copy's root folder

  // the page being viewed, as a path on the real store: "/ar/products/x", "/collections/y?page=2"
  function storePath() {
    var p = location.pathname.slice(ROOT.pathname.length - 1);
    p = p.replace(/index\.html$/, '').replace(/\/page-(\d+)\/$/, '?page=$1').replace(/\/$/, '');
    return p || '/';
  }
  function copyUrl(path) { // the copy's address for a store path
    var m = path.match(/^(.*?)(?:\?page=(\d+))?$/);
    var dir = m[1].replace(/^\//, '');
    return new URL(dir + (dir ? '/' : '') + (m[2] ? 'page-' + m[2] + '/' : ''), ROOT).href;
  }

  // returns true when the copy handled the submission itself (the language switch)
  function handle(form) {
    var action = form.getAttribute('action') || '';
    if (/\/localization$/.test(action)) {
      var code = (form.querySelector('[name="locale_code"]') || {}).value || 'en';
      var p = storePath().replace(/^\/ar(?=\/|\?|$)/, '') || '/';
      if (code === 'ar') p = '/ar' + (p === '/' ? '' : p);
      location.href = copyUrl(p);
      return true;
    }
    if (action.indexOf(STORE) === 0) form.target = '_blank'; // basket, checkout, search, newsletter: post to the real store
    return false;
  }
  document.addEventListener('submit', function (e) {
    if (handle(e.target)) e.preventDefault();
    e.stopImmediatePropagation(); // keep the theme's fetch-based handlers out of it: the form itself goes to the real store
  }, true);
  var nativeSubmit = HTMLFormElement.prototype.submit; // scripts that call form.submit() skip the submit event
  HTMLFormElement.prototype.submit = function () { if (!handle(this)) nativeSubmit.call(this); };

  // links that only exist on the real store (basket, account, checkout) open it in a new tab
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="' + STORE + '"]');
    if (!a) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.open(a.href, '_blank', 'noopener');
  }, true);

  // the theme asks Shopify for the basket and recommendations with root-relative URLs; there is no server
  // behind the copy, so answer with an empty basket / empty section instead of a 404
  var nativeFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.indexOf(location.origin) === 0 ? url.slice(location.origin.length) : url;
    if (/^\/(cart|recommendations|search|sf_private_access_tokens)(\/|\.js|\?|$)/.test(path)) {
      var json = /^\/cart/.test(path);
      return Promise.resolve(new Response(json ? '{"items":[],"item_count":0,"sections":{}}' : '', {
        status: 200, headers: { 'Content-Type': json ? 'application/json' : 'text/html' },
      }));
    }
    return nativeFetch.apply(this, arguments);
  };
})();
