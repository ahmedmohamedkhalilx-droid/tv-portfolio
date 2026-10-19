import { getProjects } from '../projects.js?v=20261020a';

// The retro TV: the page never scrolls, the screen does. Each section is a channel; the dial,
// the preset buttons and the number keys change channel with a burst of static, and a project
// can be watched on the set itself.

const LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
const ROOT = new URL('../', import.meta.url); // the site root
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
const channels = [...screen.querySelectorAll('.ch')];
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
    screen.scrollTo({ top: channels[i].offsetTop, behavior: 'instant' });
    current = -1;
    mark(i);
  });
}
// the channel whose picture crosses the middle of the screen is the one that's on
const watcher = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) mark(channels.indexOf(e.target)); });
}, { root: screen, rootMargin: '-50% 0px -50% 0px', threshold: 0 });
channels.forEach((c) => watcher.observe(c));

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
    (lastTrigger || screen).focus({ preventScroll: true });
  };
  if (withStatic) burst(done); else done();
}
bcBack.addEventListener('click', () => closeBroadcast(true));

// ---------- switch the set on ----------
presets[0].setAttribute('aria-current', 'true');
requestAnimationFrame(() => {
  document.documentElement.classList.add('on');
  screen.focus({ preventScroll: true }); // the arrow keys and space scroll the picture straight away
  setTimeout(() => showOsd(chLabel(0), channels[0].dataset.name), reduceMotion ? 0 : 700);
});
