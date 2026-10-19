import { createTvs } from './tv3d.js';

const PROJECTS = {
  helco: {
    title: 'HELCO',
    desc: 'Marketing site for Hany ElAraby & Co., an Egyptian audit, tax and advisory firm. Next.js, Tailwind and next-intl, in English and Arabic with full RTL.',
    url: 'https://helco-co.github.io/en/', // the root is a redirect page; going straight to /en/ loads faster
  },
  dental: {
    title: 'The Dental Hauz',
    desc: 'Website for a dental clinic (implants, oral surgery, clear aligners and cosmetic dentistry): a custom WordPress theme built from the brand sheet. Shown here as a static preview of the theme.',
    url: 'https://ahmedmohamedkhalilx-droid.github.io/The-dental-Website-/',
  },
  tessera: {
    title: 'Tessera',
    desc: 'Online store for an Egyptian luxury bed and bath linen house: a custom Shopify theme with about thirty bespoke sections, English and Arabic with full right-to-left support. This is a working copy of the live store; Add to basket and checkout open the real store.',
    url: 'tessera-site/', // a static copy of the storefront (Shopify stores cannot be framed); refresh with tools/tessera-copy
    noLink: true,
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
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let tvs = null;
let current = null;
let lastTrigger = null;
try {
  tvs = createTvs(
    wall,
    [
      {
        id: 'helco', title: 'HELCO', siteUrl: PROJECTS.helco.url,
        // from helco-co.github.io: ground #0f1419, panels #1b2025, gold #a88c68
        palette: { body: 0x1b2025, back: 0x12181e, bezel: 0x0f1419, accent: 0xa88c68, knob: 0xe1c19a, slot: 0x090e14 },
      },
      {
        id: 'tessera', title: 'Tessera', siteUrl: PROJECTS.tessera.url,
        // Tessera brand palette: stone #C9C0B0, forest #363C31, burgundy #33161A, plum-black #211415
        palette: {
          body: 0x33161a, back: 0x211415, bezel: 0x211415, accent: 0xc9c0b0, knob: 0xc9c0b0, slot: 0x150b0c,
        },
      },
      {
        // brand sheet: umber #514A43, sage #657568 / #A8B6A5, blush #D8B8B2, cream #F4F0E8
        id: 'dental', title: 'The Dental Hauz', siteUrl: PROJECTS.dental.url,
        palette: { body: 0x514a43, back: 0x3d3833, bezel: 0x2b2824, accent: 0xd8b8b2, knob: 0xa8b6a5, slot: 0x26231f },
      },
    ],
    { onPress: (id) => openProject(id), onHover: (id) => markHot(id), onLayout: () => alignLabels() }
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
