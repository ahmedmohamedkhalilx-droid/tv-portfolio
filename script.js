import { createTvs } from './tv3d.js';

// Case studies are written from each project's own README; keep them to facts the client would recognise.
const PROJECTS = {
  helco: {
    title: 'HELCO',
    desc: 'Bilingual website for an Egyptian audit, tax and advisory firm.',
    url: 'https://helco-co.github.io/en/', // the root is a redirect page; going straight to /en/ loads faster
    poster: 'assets/posters/helco.jpg',
    study: {
      client: 'Hany ElAraby & Co., an audit, tax and advisory firm in Egypt.',
      brief: 'The firm\u2019s website lived on an old deployment whose source code had been lost, so it could not be changed. It needed a rebuild that the firm could keep growing, in English and Arabic.',
      built: [
        'Rebuilt every page from the old live site as a clean Next.js codebase.',
        'English and Arabic throughout, with a full right-to-left layout for Arabic.',
        'A services page organised into 3 pillars, 19 groups and 124 services, plus pages for four industries, careers and contact.',
        'Automatic deployment to the firm\u2019s own domain on every change.',
      ],
      stack: 'Next.js 15 \u00b7 Tailwind CSS v4 \u00b7 next-intl \u00b7 GitHub Actions',
    },
  },
  dental: {
    title: 'The Dental Hauz',
    desc: 'WordPress website for a dental clinic, built from its brand sheet.',
    url: 'https://ahmedmohamedkhalilx-droid.github.io/The-dental-Website-/',
    poster: 'assets/posters/dental.jpg',
    study: {
      client: 'The Dental Hauz, a clinic for implants, oral surgery, clear aligners and cosmetic dentistry.',
      brief: 'A new website that looks like the clinic\u2019s brand, runs on WordPress so the team can manage it, and keeps everything the old site had, including the patient forms.',
      built: [
        'A custom WordPress theme designed from the clinic\u2019s brand sheet: its palette, type and photography.',
        'Every page of the old site carried over, checked automatically against the old site\u2019s text.',
        'Working patient forms (medical history, records requests, payment agreements), tested end to end on a real WordPress with real email.',
        '84 automated browser tests on desktop and phone sizes, run on every change.',
      ],
      stack: 'WordPress (custom theme, PHP) \u00b7 JavaScript \u00b7 Playwright \u00b7 GitHub Actions',
    },
  },
  tessera: {
    title: 'Tessera',
    desc: 'Bilingual Shopify store for an Egyptian luxury linen house. A working copy: basket and checkout open the real store.',
    url: 'tessera-site/', // a static copy of the storefront (Shopify stores cannot be framed); refresh with tools/tessera-copy
    noLink: true,
    poster: 'assets/posters/tessera.jpg',
    study: {
      client: 'Tessera Fine Linens, an Egyptian luxury bed and bath linen house.',
      brief: 'An online store that feels as considered as the product, in English and Arabic. Shopify\u2019s Dawn theme ships with no Arabic at all, so the whole right-to-left side had to be built.',
      built: [
        'About thirty bespoke sections and fifty snippets on top of Shopify\u2019s Dawn theme.',
        'A right-to-left layer written rule by rule, with Arabic fonts and prices that stay readable inside Arabic text, plus a language switch that remembers the visitor\u2019s choice.',
        'Collection pages that arrange themselves from settings in the Shopify admin, so the owner adds collections without touching code.',
        '\u201cShop the set\u201d pages with a set builder and a set discount, and colour swatches generated from the product photography.',
      ],
      stack: 'Shopify (Liquid, Dawn 15.5) \u00b7 JavaScript \u00b7 CSS',
    },
  },
};

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
// phones and data-saver: the TVs show stills of the sites; the live site loads only when a project is opened
const lite = window.matchMedia('(max-width: 700px)').matches || !!(navigator.connection && navigator.connection.saveData);

let tvs = null;
let current = null;
let lastTrigger = null;
try {
  tvs = createTvs(
    wall,
    [
      {
        id: 'helco', title: 'HELCO', siteUrl: PROJECTS.helco.url, poster: PROJECTS.helco.poster,
        // from helco-co.github.io: ground #0f1419, panels #1b2025, gold #a88c68
        palette: { body: 0x1b2025, back: 0x12181e, bezel: 0x0f1419, accent: 0xa88c68, knob: 0xe1c19a, slot: 0x090e14 },
      },
      {
        id: 'tessera', title: 'Tessera', siteUrl: PROJECTS.tessera.url, poster: PROJECTS.tessera.poster,
        // Tessera brand palette: stone #C9C0B0, forest #363C31, burgundy #33161A, plum-black #211415
        palette: {
          body: 0x33161a, back: 0x211415, bezel: 0x211415, accent: 0xc9c0b0, knob: 0xc9c0b0, slot: 0x150b0c,
        },
      },
      {
        // brand sheet: umber #514A43, sage #657568 / #A8B6A5, blush #D8B8B2, cream #F4F0E8
        id: 'dental', title: 'The Dental Hauz', siteUrl: PROJECTS.dental.url, poster: PROJECTS.dental.poster,
        palette: { body: 0x514a43, back: 0x3d3833, bezel: 0x2b2824, accent: 0xd8b8b2, knob: 0xa8b6a5, slot: 0x26231f },
      },
    ],
    { onPress: (id) => openProject(id), onHover: (id) => markHot(id), onLayout: () => alignLabels(), lite }
  );
} catch (err) {
  // no WebGL: the buttons below still open the projects
  wall.classList.add('no-3d');
  wall.textContent = '3D view is not available in this browser.';
}

function setRect(r) {
  frame.style.left = r.left + 'px';
  frame.style.top = r.top + 'px';
  frame.style.width = r.width + 'px';
  frame.style.height = r.height + 'px';
}
const fullRect = () => {
  const m = Math.min(window.innerWidth, window.innerHeight) * 0.03;
  return { left: m, top: m, width: window.innerWidth - m * 2, height: window.innerHeight - m * 2 };
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
  iframe.title = p.title + ' site';
  viewport.classList.add('loading'); // 'Tuning in…' until the site arrives
  iframe.addEventListener('load', () => viewport.classList.remove('loading'), { once: true });
  viewport.replaceChildren(iframe);
  renderStudy(p);
  setStudyOpen(window.matchMedia('(min-width: 1000px)').matches); // beside the site on wide screens, on request elsewhere

  project.hidden = false;
  document.body.style.overflow = 'hidden';
  setRect(startRect(id)); // start exactly over the TV screen
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

// The labels under the TVs: hovering or focusing a label raises its TV, hovering a TV lights its label,
// and when the TVs stand side by side each label sits directly under its TV.
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
  const left = labelRow.parentElement.getBoundingClientRect().left;
  labelRow.style.setProperty('--label-x', spots[0].left - left + 'px');
  labelRow.style.setProperty('--label-w', (spots[spots.length - 1].right - spots[0].left) / spots.length + 'px');
}

// The case study beside (or over, on phones) the live site
function renderStudy(p) {
  const s = p.study;
  const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
  const list = el('ul');
  s.built.forEach((item) => list.append(el('li', item)));
  study.replaceChildren(
    el('h3', 'Client'), el('p', s.client),
    el('h3', 'The brief'), el('p', s.brief),
    el('h3', 'What I built'), list,
    el('h3', 'Built with'), el('p', s.stack),
  );
  study.scrollTop = 0;
}
function setStudyOpen(open) {
  frame.classList.toggle('study-open', open);
  studyToggle.setAttribute('aria-expanded', String(open));
  studyToggle.textContent = open ? 'Hide case study' : 'Case study';
}
