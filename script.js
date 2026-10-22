import { createPhones } from './phones3d.js?v=20261022a'; // bump v= on every release so browsers fetch the new files
import { getProjects } from './projects.js?v=20261022a';

const LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
const BASE = new URL('.', import.meta.url); // the site root, so relative paths work from /ar/ as well
const at = (path) => new URL(path, BASE).href;
const UI = {
  en: { study: 'Case study', hideStudy: 'Hide case study', client: 'Client', brief: 'The brief', built: 'What I built', stack: 'Built with', site: 'site', no3d: '3D view is not available in this browser.' },
  ar: { study: 'دراسة الحالة', hideStudy: 'إخفاء دراسة الحالة', client: 'العميل', brief: 'المطلوب', built: 'ما بنيته', stack: 'الأدوات المستخدمة', site: 'الموقع', no3d: 'العرض ثلاثي الأبعاد غير متاح في هذا المتصفح.' },
}[LANG];

const PROJECTS = getProjects(LANG);
for (const p of Object.values(PROJECTS)) { p.url = at(p.url); p.poster = at(p.poster); }

const wall = document.getElementById('wall');
const project = document.getElementById('project');
const frame = document.getElementById('frame');
const viewport = document.getElementById('viewport');
const closeBtn = document.getElementById('close');
const pTitle = document.getElementById('p-title');
const pDesc = document.getElementById('p-desc');
const pLink = document.getElementById('p-link');
const study = document.getElementById('study');
const studyToggle = document.getElementById('study-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let tvs = null;
let current = null;
let lastTrigger = null;
try {
  tvs = createPhones(
    wall,
    [
      {
        id: 'helco', title: 'HELCO', siteUrl: PROJECTS.helco.url, poster: PROJECTS.helco.poster,
        // from helco-co.github.io: ground #0f1419, panels #1b2025, gold #a88c68
        palette: { frame: 0xa88c68 }, // the HELCO gold
      },
      {
        id: 'tessera', title: 'Tessera', siteUrl: PROJECTS.tessera.url, poster: PROJECTS.tessera.poster,
        // Tessera brand palette: stone #C9C0B0, forest #363C31, burgundy #33161A, plum-black #211415
        palette: { frame: 0x7a2c36 }, // burgundy, lifted so it reads as metal
      },
      {
        // brand sheet: umber #514A43, sage #657568 / #A8B6A5, blush #D8B8B2, cream #F4F0E8
        id: 'dental', title: 'The Dental Hauz', siteUrl: PROJECTS.dental.url, poster: PROJECTS.dental.poster,
        palette: { frame: 0xa8b6a5 }, // sage
      },
    ],
    { onPress: (id) => openProject(id), onHover: (id) => markHot(id), onLayout: () => alignLabels() }
  );
} catch (err) {
  // no WebGL: the buttons below still open the projects
  wall.classList.add('no-3d');
  wall.textContent = UI.no3d;
}

function setRect(r) {
  frame.style.left = r.left + 'px';
  frame.style.top = r.top + 'px';
  frame.style.width = r.width + 'px';
  frame.style.height = r.height + 'px';
}
const fullRect = () => { // the project fills the iPad's screen
  const r = document.getElementById('screen').getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
const startRect = (id) => {
  if (tvs) return tvs.screenRect(id);
  const w = wall.getBoundingClientRect();
  return { left: w.left + w.width / 2 - 40, top: w.top + w.height / 2 - 30, width: 80, height: 60 };
};

function openProject(id) {
  if (!project.hidden) return;
  const p = PROJECTS[id];
  current = id;
  lastTrigger = document.activeElement;
  if (tvs) tvs.setPaused(true);

  pTitle.textContent = p.title;
  pDesc.textContent = p.desc;
  pLink.hidden = !!p.noLink;
  pLink.href = p.url;
  const iframe = document.createElement('iframe');
  iframe.src = p.url;
  iframe.title = p.title + ' ' + UI.site;
  viewport.classList.add('loading'); // 'Tuning in…' until the site arrives
  iframe.addEventListener('load', () => viewport.classList.remove('loading'), { once: true });
  viewport.replaceChildren(iframe);
  renderStudy(p);
  setStudyOpen(window.matchMedia('(min-width: 1000px)').matches); // beside the site on wide screens, on request elsewhere

  project.hidden = false;
  document.body.style.overflow = 'hidden';
  setRect(startRect(id)); // start exactly over the phone screen
  frame.getBoundingClientRect(); // flush so the transition runs
  requestAnimationFrame(() => {
    project.classList.add('open');
    setRect(fullRect());
  });
  closeBtn.focus({ preventScroll: true });
}

function closeProject() {
  project.classList.remove('open');
  if (tvs) tvs.setPaused(false);
  setRect(startRect(current));
  setTimeout(() => {
    project.hidden = true;
    document.body.style.overflow = '';
    viewport.replaceChildren(); // stops the embedded site
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
  }, reduceMotion ? 0 : 450);
}

document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => openProject(btn.dataset.open));
});
closeBtn.addEventListener('click', closeProject);
studyToggle.addEventListener('click', () => setStudyOpen(studyToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !project.hidden) closeProject(); });
window.addEventListener('resize', () => { if (!project.hidden) setRect(fullRect()); });

// The labels under the phones: hovering or focusing a label raises its phone, hovering a phone lights its label,
// and each label sits directly under its phone.
const labelRow = document.querySelector('.open-row');
const labels = [...labelRow.querySelectorAll('[data-open]')];
function markHot(id) {
  labels.forEach((b) => b.classList.toggle('is-hot', b.dataset.open === id));
}
labels.forEach((b) => {
  const raise = () => { if (tvs) tvs.highlight(b.dataset.open); };
  const lower = () => { if (tvs) tvs.highlight(null); };
  b.addEventListener('pointerenter', raise);
  b.addEventListener('pointerleave', lower);
  b.addEventListener('focus', raise);
  b.addEventListener('blur', lower);
});
function alignLabels() {
  if (!tvs) return;
  const spots = tvs.anchors();
  const sideBySide = spots.every((s) => Math.abs(s.bottom - spots[0].bottom) < 4);
  labelRow.classList.toggle('aligned', sideBySide);
  if (!sideBySide) return;
  const k = wall.getBoundingClientRect().width / wall.offsetWidth || 1; // the iPad's current scale
  const left = labelRow.getBoundingClientRect().left;
  labelRow.style.setProperty('--label-x', (spots[0].left - left) / k + 'px');
  labelRow.style.setProperty('--label-w', (spots[spots.length - 1].right - spots[0].left) / k / spots.length + 'px');
}

// The case study beside (or over, on phones) the live site
function renderStudy(p) {
  const s = p.study;
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
  const list = el('ul');
  s.built.forEach((item) => list.append(el('li', item)));
  study.replaceChildren(
    el('h3', UI.client), el('p', s.client),
    el('h3', UI.brief), el('p', s.brief),
    el('h3', UI.built), list,
    el('h3', UI.stack), el('p', s.stack),
  );
  study.scrollTop = 0;
}
function setStudyOpen(open) {
  frame.classList.toggle('study-open', open);
  studyToggle.setAttribute('aria-expanded', String(open));
  studyToggle.textContent = open ? UI.hideStudy : UI.study;
}

// ---------- the whole site plays on an iPad ----------
// The page scroll is a timeline. First the iPad unlocks and, on a wide window, turns from portrait to
// landscape while it grows to fill the window. Then the site scrolls on its screen. At the end the iPad
// turns back to portrait and rings: the contact screen. On a tall window (phones) it stays portrait.
const runway = document.querySelector('.runway');
const stage = runway.querySelector('.stage');
const device = stage.querySelector('.device');
const screenEl = document.getElementById('screen');
const site = document.getElementById('site');
const giant = stage.querySelector('.giant');
const lockEl = stage.querySelector('.lock');
const homeEl = stage.querySelector('.home');
const callEl = stage.querySelector('.call');
const callLinks = [...callEl.querySelectorAll('a')];
const dock = stage.querySelector('.dock');
const dockLinks = [...dock.querySelectorAll('a')];
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;

let G = null; // geometry, recomputed on resize
function measure() {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const wide = vw >= vh * 1.05;
  let dw, dh;
  if (wide) { // landscape, leaving room for the top bar
    dw = Math.min(vw * 0.92, 1400);
    dh = Math.min(vh - 140, dw / 1.3);
    dw = Math.min(dw, dh * 1.62);
  } else { // portrait
    dw = Math.min(vw - 20, 900);
    dh = Math.min(vh - 120, dw * 2.2);
  }
  const b = Math.round(Math.max(8, Math.min(18, Math.min(dw, dh) * 0.022)));
  const sw = dw - 2 * b, sh = dh - 2 * b;
  // the portrait size at the start and the end, as a fraction of the full size
  const s0 = wide ? Math.min((vh * 0.66) / dw, (vw * 0.7) / dh) : Math.min((vh * 0.66) / dh, (vw * 0.72) / dw);
  const lw = wide ? sh : sw, lh = wide ? sw : sh; // the portrait screens' own size (upright)
  stage.classList.toggle('tall', !wide);
  for (const [k, v] of Object.entries({ '--dw': dw, '--dh': dh, '--b': b, '--sw': sw, '--sh': sh, '--lw': lw })) stage.style.setProperty(k, v + 'px');
  for (const el of [lockEl, callEl]) Object.assign(el.style, { width: lw + 'px', height: lh + 'px', marginLeft: -lw / 2 + 'px', marginTop: -lh / 2 + 'px' });
  const intro = reduceMotion ? 0 : vh * (wide ? 1.5 : 1.1); // unlock, then turn and grow
  const travel = Math.max(0, site.offsetHeight - sh);
  const outro = reduceMotion ? 0 : vh * 1.1;
  G = { vw, vh, wide, dw, dh, sw, sh, s0, intro, travel, outro };
  runway.style.height = intro + travel + outro + vh * 1.15 + 'px';
}

let turnedFully = false;
function update() {
  if (!G) return;
  const y = window.scrollY;
  const { wide, sw, sh, s0, intro, travel, outro } = G;
  // phases
  const u = reduceMotion ? 1 : easeInOut(clamp01(y / (intro * 0.35)));                   // unlock
  const t = reduceMotion ? 1 : easeInOut(clamp01((y - intro * 0.35) / (intro * 0.65)));  // turn and grow
  const o = reduceMotion ? 0 : easeInOut(clamp01((y - intro - travel) / outro));         // turn back and ring
  const scroll = Math.min(travel, Math.max(0, y - intro));

  // the device: portrait and smaller at both ends, full size and (on wide windows) landscape in the middle
  const open = t * (1 - o);
  const s = lerp(s0, 1, open);
  const rot = wide ? -90 * (1 - open) : 0;
  device.style.transform = `rotate(${rot}deg) scale(${s})`;
  giant.style.opacity = (1 - open).toFixed(3);

  // the lock screen leaves as it unlocks
  lockEl.style.opacity = clamp01(1 - u * 1.4).toFixed(3);
  lockEl.style.transform = `translateY(${-u * 14}%) rotate(${wide ? 90 : 0}deg)`;
  lockEl.style.visibility = u >= 1 ? 'hidden' : '';

  // on wide windows a portrait home screen turns with the device, then gives way to the site itself
  if (wide && !reduceMotion) {
    const w = lerp(sh, sw, t), h = lerp(sw, sh, t);
    Object.assign(homeEl.style, { width: w + 'px', height: h + 'px', marginLeft: -w / 2 + 'px', marginTop: -h / 2 + 'px',
      transform: `rotate(${90 * (1 - t)}deg) scale(${0.94 + 0.06 * u})`, opacity: clamp01((1 - t) / 0.18).toFixed(3), visibility: t >= 1 ? 'hidden' : '' });
  } else homeEl.style.visibility = 'hidden';

  // the site scrolls on the screen
  site.style.transform = `translate3d(0, ${-scroll}px, 0)`;
  // while the device turns, the sideways site stays hidden behind the turning screens
  const shown = wide ? clamp01((t - 0.8) / 0.2) * clamp01(1 - o / 0.3) : 1;
  site.style.opacity = dock.style.opacity = shown.toFixed(3);

  // the call screen comes in as the device turns back
  callEl.style.opacity = clamp01((o - 0.25) / 0.45).toFixed(3);
  callEl.style.transform = `rotate(${wide ? 90 * o : 0}deg)`;
  const live = o > 0.7;
  callEl.classList.toggle('live', live);
  callEl.setAttribute('aria-hidden', String(!live));
  callLinks.forEach((a) => { a.tabIndex = live ? 0 : -1; });

  // once the iPad is fully open the labels under the phones can be measured
  const full = t >= 1 && o === 0;
  if (full && !turnedFully) alignLabels();
  turnedFully = full;
  markDock(scroll);
}

// the dock lights the section on screen
const sections = ['intro', 'work', 'about', 'contact'].map((id) => document.getElementById(id));
const order = sections.slice().sort((a, b) => offsetIn(a) - offsetIn(b));
function offsetIn(el) { // an element's top within the site, in the site's own pixels
  let y = 0;
  for (let n = el; n && n !== site; n = n.offsetParent) y += n.offsetTop;
  return y;
}
function markDock(scroll) {
  const probe = scroll + G.sh * 0.4;
  let on = order[0];
  for (const s of order) if (offsetIn(s) <= probe) on = s;
  dockLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + on.id)));
}

// in-page links move the timeline: to a section on the screen, or back to the start
function scrollToY(top) { window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' }); }
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  if (target === runway) { scrollToY(0); return; }
  if (!site.contains(target)) return;
  scrollToY(G.intro + Math.min(G.travel, offsetIn(target)) + 2);
});
// keyboard focus inside the screen brings that part of the site into view (the screen itself never scrolls)
site.addEventListener('focusin', (e) => {
  screenEl.scrollTop = 0;
  screenEl.scrollLeft = 0;
  const at = offsetIn(e.target);
  const shown = window.scrollY - G.intro; // the part of the site on screen starts here
  if (shown < 0 || at < shown || at > shown + G.sh * 0.8) {
    window.scrollTo({ top: G.intro + Math.min(G.travel, Math.max(0, at - G.sh * 0.35)), behavior: 'auto' });
  }
});
screenEl.addEventListener('scroll', () => { screenEl.scrollTop = 0; screenEl.scrollLeft = 0; });

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; update(); });
}, { passive: true });
function relayout() { measure(); update(); }
window.addEventListener('resize', relayout);
new ResizeObserver(() => { const before = G && G.travel; measure(); if (G.travel !== before) update(); }).observe(site);
relayout();

// the lock screen shows the time in Cairo
const clockFmt = new Intl.DateTimeFormat(LANG === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo' });
function tickClock() { document.querySelectorAll('[data-clock]').forEach((el) => { el.textContent = clockFmt.format(new Date()); }); }
tickClock();
setInterval(tickClock, 30000);

// ---------- sections drift up into place as they enter the screen ----------
const revealer = 'IntersectionObserver' in window && !reduceMotion
  ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
  : null;
document.querySelectorAll('.reveal').forEach((el, i) => {
  if (!revealer) { el.classList.add('in'); return; }
  el.style.transitionDelay = (i % 4) * 70 + 'ms'; // neighbours arrive one after another
  revealer.observe(el);
});
