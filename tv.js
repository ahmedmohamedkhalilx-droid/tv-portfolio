import { getProjects } from './projects.js?v=20261023a';

// The site plays on a 1970s TV. The page scroll is a timeline: the set starts far away and switched off,
// scrolling switches it on and brings it closer until it fills the window, then the scroll moves the
// programme on its screen. Each section is a channel; the dial, the preset buttons and the number keys
// change channel with a burst of static, and a project can be watched on the set itself.

const LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
const ROOT = new URL('./', import.meta.url); // the site root
const at = (path) => new URL(path, ROOT).href;
const UI = {
  en: {
    program: 'Programme', watch: 'Watch it on this set', study: 'The story behind it', client: 'Client', brief: 'The brief',
    built: 'What I built', stack: 'Built with', open: 'Open the site ↗', nowShowing: 'Now showing', ch: 'CH',
    kinds: { helco: 'Corporate · Next.js · EN / AR', tessera: 'Commerce · Shopify · EN / AR', dental: 'Healthcare · WordPress' },
  },
  ar: {
    program: 'البرنامج', watch: 'شاهده على هذه الشاشة', study: 'القصة وراءه', client: 'العميل', brief: 'المطلوب',
    built: 'ما بنيته', stack: 'الأدوات المستخدمة', open: 'افتح الموقع ↖', nowShowing: 'يُعرض الآن', ch: 'قناة',
    kinds: { helco: 'شركات · Next.js · عربي / إنجليزي', tessera: 'تجارة إلكترونية · Shopify · عربي / إنجليزي', dental: 'رعاية صحية · WordPress' },
  },
}[LANG];

const projects = getProjects(LANG);
for (const p of Object.values(projects)) { p.url = at(p.url); p.poster = at(p.poster); }
const ORDER = ['helco', 'tessera', 'dental'];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const screen = document.getElementById('screen');
const reel = document.getElementById('reel');
const channels = [...reel.querySelectorAll('.ch')];
const presets = [...document.querySelectorAll('.presets button')];
const knob = document.getElementById('knob');
const osd = document.getElementById('osd');
const staticEl = document.getElementById('static');
const broadcast = document.getElementById('broadcast');
const bcFrame = document.getElementById('bc-frame');
const bcTitle = document.getElementById('bc-title');
const bcLink = document.getElementById('bc-link');
const bcBack = document.getElementById('bc-back');

// ---------- the programmes on channel 3 ----------
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
const list = document.getElementById('programs');
ORDER.forEach((id, i) => {
  const p = projects[id];
  const li = el('li', 'program');
  const thumb = el('div', 'thumb');
  const img = el('img');
  img.src = p.poster; img.alt = ''; img.loading = 'lazy'; img.width = 390; img.height = 600;
  thumb.append(img);
  const body = el('div');
  const watch = el('button', 'btn hot', '▶ ' + UI.watch);
  watch.type = 'button';
  watch.addEventListener('click', () => tuneTo(id, watch));
  const ctas = el('div', 'ctas');
  ctas.append(watch);
  const study = el('details', 'study');
  const built = el('ul');
  p.study.built.forEach((b) => built.append(el('li', '', b)));
  study.append(el('summary', '', UI.study), el('h4', '', UI.client), el('p', '', p.study.client), el('h4', '', UI.brief), el('p', '', p.study.brief),
    el('h4', '', UI.built), built, el('h4', '', UI.stack), el('p', '', p.study.stack));
  body.append(el('p', 'program-no', `${UI.program} 0${i + 1}`), el('h3', '', p.title), el('p', 'kind', UI.kinds[id]), el('p', 'desc', p.desc), ctas, study);
  li.append(thumb, body);
  list.append(li);
});

// ---------- static: a little noise texture, drawn once ----------
(() => {
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const g = c.getContext('2d');
  const img = g.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 30 + Math.random() * 200;
    img.data[i] = v; img.data[i + 1] = v * 0.97; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  staticEl.style.backgroundImage = `url(${c.toDataURL()})`;
})();
function burst(then) { // a moment of snow while the set changes over
  if (reduceMotion) { then(); return; }
  staticEl.classList.add('on');
  setTimeout(then, 200);
  setTimeout(() => staticEl.classList.remove('on'), 380);
}

// ---------- channels ----------
let current = 0;
let osdTimer = 0;
function showOsd(text, name) {
  osd.querySelector('.osd-ch').textContent = text;
  osd.querySelector('.osd-name').textContent = name;
  osd.classList.add('show');
  clearTimeout(osdTimer);
  osdTimer = setTimeout(() => osd.classList.remove('show'), 2200);
}
const chLabel = (i) => `${UI.ch} ${String(i + 1).padStart(2, '0')}`;
function mark(i) { // the set's controls follow whatever channel is on screen
  if (i === current) return;
  current = i;
  presets.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  knob.style.setProperty('--turn', i * (360 / channels.length) + 'deg');
  showOsd(chLabel(i), channels[i].dataset.name);
}
function goTo(i) {
  i = (i + channels.length) % channels.length;
  if (!broadcast.hidden) closeBroadcast(false);
  burst(() => {
    window.scrollTo({ top: channelTop(i), behavior: 'instant' });
    current = -1;
    mark(i);
  });
}
presets.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
knob.addEventListener('click', () => goTo(current + 1));
document.getElementById('ch-up').addEventListener('click', () => goTo(current + 1));
document.getElementById('ch-down').addEventListener('click', () => goTo(current - 1));
document.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  goTo(+a.dataset.goto - 1);
}));
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' && !broadcast.hidden) { closeBroadcast(true); return; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= channels.length) goTo(n - 1);
});

// ---------- watching a project on the set ----------
let lastTrigger = null;
function tuneTo(id, trigger) {
  const p = projects[id];
  lastTrigger = trigger;
  burst(() => {
    bcFrame.src = p.url;
    bcFrame.title = p.title;
    bcTitle.textContent = `${UI.nowShowing}: ${p.title}`;
    bcLink.hidden = !!p.noLink;
    bcLink.href = p.url;
    broadcast.hidden = false;
    bcBack.focus();
  });
}
function closeBroadcast(withStatic) {
  const done = () => {
    broadcast.hidden = true;
    bcFrame.src = 'about:blank';
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  };
  if (withStatic) burst(done); else done();
}
bcBack.addEventListener('click', () => closeBroadcast(true));
// the page stays put while a site plays on the set (the site itself still scrolls inside its frame)
const SCROLL_KEYS = [' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
const holdStill = (e) => { if (!broadcast.hidden) e.preventDefault(); };
window.addEventListener('wheel', holdStill, { passive: false });
window.addEventListener('touchmove', holdStill, { passive: false });
window.addEventListener('keydown', (e) => { if (SCROLL_KEYS.includes(e.key) && !e.target.closest('button, a')) holdStill(e); });

// ---------- the timeline: far away and off → on and close → the programme ----------
const runway = document.querySelector('.runway');
const stage = runway.querySelector('.stage');
const tv = stage.querySelector('.tv');
const giant = stage.querySelector('.giant');
const antenna = stage.querySelector('.antenna');
const offEl = stage.querySelector('.off');
const powerEl = stage.querySelector('.power');
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;

let G = null;
function measure() {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const sh = screen.clientHeight;
  stage.style.setProperty('--sh', sh + 'px');
  const far = vw >= vh ? 0.5 : 0.62; // how big the set looks from across the room
  const intro = reduceMotion ? 0 : vh * 1.4;
  const travel = Math.max(0, reel.offsetHeight - sh);
  const tops = channels.map((c) => c.offsetTop); // read once here, never during the scroll
  G = { vh, sh, far, intro, travel, tops };
  runway.style.height = intro + travel + vh + 'px';
}
function channelTop(i) { return G.intro + Math.min(G.travel, G.tops[i]); }

let switchedOn = false;
function update() {
  if (!G) return;
  const y = window.scrollY;
  const on = reduceMotion ? 1 : clamp01(y / (G.intro * 0.3));                                // switching on
  const near = reduceMotion ? 1 : easeInOut(clamp01((y - G.intro * 0.25) / (G.intro * 0.75))); // coming closer
  const scroll = Math.min(G.travel, Math.max(0, y - G.intro));

  // while the set moves it is its own layer; once it is close it settles, so the picture stays sharp and cheap to scroll
  const moving = near < 1;
  tv.style.transform = moving ? `scale(${lerp(G.far, 1, near)})` : 'none';
  tv.style.willChange = moving ? 'transform' : 'auto';
  tv.classList.toggle('close', !moving);
  giant.style.opacity = (1 - near).toFixed(3);
  antenna.style.opacity = clamp01(1 - near * 1.6).toFixed(3);

  offEl.style.opacity = clamp01(1 - on / 0.35).toFixed(3);
  const line = clamp01((on - 0.25) / 0.75);
  powerEl.style.opacity = (on > 0.2 && on < 1 ? 1 - easeOut(line) : 0).toFixed(3);
  powerEl.style.transform = `scale(${lerp(0.6, 1, clamp01(line * 3))}, ${lerp(0.004, 1, easeOut(clamp01((line - 0.3) / 0.7)))})`;
  if (on >= 1 && !switchedOn) showOsd(chLabel(current), channels[current].dataset.name);
  switchedOn = on >= 1;

  reel.style.transform = `translate3d(0, ${-scroll}px, 0)`;
  // the channel whose picture is in the middle of the screen is the one that's on
  let i = 0;
  G.tops.forEach((t, k) => { if (t <= scroll + G.sh * 0.5) i = k; });
  if (switchedOn) mark(i);
}

// keyboard focus inside the screen brings that part of the programme into view (the screen itself never scrolls)
reel.addEventListener('focusin', (e) => {
  screen.scrollTop = 0;
  let at = 0;
  for (let n = e.target; n && n !== reel; n = n.offsetParent) at += n.offsetTop;
  const shown = window.scrollY - G.intro;
  if (shown < 0 || at < shown || at > shown + G.sh * 0.8) window.scrollTo({ top: G.intro + Math.min(G.travel, Math.max(0, at - G.sh * 0.35)), behavior: 'auto' });
});
screen.addEventListener('scroll', () => { screen.scrollTop = 0; });

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; update(); });
}, { passive: true });
function relayout() { measure(); update(); }
let relayoutQueued = false;
const queueRelayout = () => { if (relayoutQueued) return; relayoutQueued = true; requestAnimationFrame(() => { relayoutQueued = false; relayout(); }); };
window.addEventListener('resize', queueRelayout);
new ResizeObserver(queueRelayout).observe(reel);
presets[0].setAttribute('aria-current', 'true');
relayout();
