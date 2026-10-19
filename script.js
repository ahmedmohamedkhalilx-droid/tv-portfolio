import { createPhones } from './phones3d.js?v=20261019f'; // bump v= on every release so browsers fetch the new files

const LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
const BASE = new URL('.', import.meta.url); // the site root, so relative paths work from /ar/ as well
const at = (path) => new URL(path, BASE).href;
const UI = {
  en: { study: 'Case study', hideStudy: 'Hide case study', client: 'Client', brief: 'The brief', built: 'What I built', stack: 'Built with', site: 'site', no3d: '3D view is not available in this browser.' },
  ar: { study: 'دراسة الحالة', hideStudy: 'إخفاء دراسة الحالة', client: 'العميل', brief: 'المطلوب', built: 'ما بنيته', stack: 'الأدوات المستخدمة', site: 'الموقع', no3d: 'العرض ثلاثي الأبعاد غير متاح في هذا المتصفح.' },
}[LANG];

// Case studies are written from each project's own README; keep them to facts the client would recognise.
const PROJECTS = {
  helco: {
    title: 'HELCO',
    desc: 'Bilingual website for an Egyptian audit, tax and advisory firm.',
    url: 'https://helco-co.github.io/en/', // the root is a redirect page; going straight to /en/ loads faster
    poster: 'assets/posters/helco-m.jpg',
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
    poster: 'assets/posters/dental-m.jpg',
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
    poster: 'assets/posters/tessera-m.jpg',
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

// Arabic copy for the Arabic page; HELCO and Tessera open their Arabic sites (The Dental Hauz has none)
const PROJECTS_AR = {
  helco: {
    desc: 'موقع ثنائي اللغة لشركة مصرية في التدقيق والضرائب والاستشارات.',
    url: 'https://helco-co.github.io/ar/',
    poster: 'assets/posters/helco-ar-m.jpg',
    study: {
      client: 'هاني العربي وشركاه، شركة تدقيق وضرائب واستشارات في مصر.',
      brief: 'كان موقع الشركة يعمل على نسخة قديمة فُقدت شيفرتها المصدرية، فلم يعد تعديله ممكناً. احتاجت الشركة إلى إعادة بنائه بشكل يسمح بتطويره باستمرار، بالعربية والإنجليزية.',
      built: [
        'أعدت بناء كل صفحات الموقع القديم في مشروع Next.js نظيف.',
        'العربية والإنجليزية في كل الصفحات، مع تخطيط كامل من اليمين إلى اليسار للعربية.',
        'صفحة خدمات منظمة في 3 محاور و19 مجموعة و124 خدمة، إلى جانب صفحات لأربعة قطاعات وللتوظيف والتواصل.',
        'نشر تلقائي على نطاق الشركة مع كل تعديل.',
      ],
    },
  },
  dental: {
    desc: 'موقع ووردبريس لعيادة أسنان، مبني على الهوية البصرية للعيادة.',
    study: {
      client: 'ذا دنتال هاوز، عيادة متخصصة في زراعة الأسنان وجراحة الفم وتقويم الأسنان الشفاف وتجميل الأسنان.',
      brief: 'موقع جديد يعكس هوية العيادة، ويعمل على ووردبريس ليتمكن الفريق من إدارته، ويحتفظ بكل ما كان في الموقع القديم بما في ذلك نماذج المرضى.',
      built: [
        'قالب ووردبريس مخصص مصمم من دليل الهوية البصرية للعيادة: ألوانها وخطوطها وصورها.',
        'نقل كل صفحات الموقع القديم، مع فحص تلقائي يطابقها بنصوص الموقع القديم.',
        'نماذج مرضى تعمل فعلياً (التاريخ الطبي، وطلب السجلات، واتفاقيات الدفع)، مختبرة من البداية إلى النهاية على ووردبريس حقيقي وبريد إلكتروني حقيقي.',
        '84 اختباراً آلياً في المتصفح على مقاسات الكمبيوتر والهاتف، تعمل مع كل تعديل.',
      ],
    },
  },
  tessera: {
    desc: 'متجر شوبيفاي ثنائي اللغة لدار مصرية للمفروشات الفاخرة. نسخة تعمل فعلياً: السلة والدفع يفتحان المتجر الحقيقي.',
    url: 'tessera-site/ar/',
    poster: 'assets/posters/tessera-ar-m.jpg',
    study: {
      client: 'تيسيرا للمفروشات الفاخرة، دار مصرية لمفروشات السرير والحمّام.',
      brief: 'متجر إلكتروني بنفس عناية المنتج، بالعربية والإنجليزية. قالب Dawn من شوبيفاي لا يأتي بأي دعم للعربية، فكان لا بد من بناء كل ما يخص الكتابة من اليمين إلى اليسار.',
      built: [
        'نحو ثلاثين قسماً مخصصاً وخمسين جزءاً برمجياً فوق قالب Dawn من شوبيفاي.',
        'طبقة كاملة للكتابة من اليمين إلى اليسار مكتوبة قاعدة بقاعدة، بخطوط عربية وأسعار تبقى مقروءة داخل النص العربي، ومفتاح لغة يتذكر اختيار الزائر.',
        'صفحات مجموعات ترتّب نفسها من إعدادات لوحة تحكم شوبيفاي، فيضيف المالك مجموعات جديدة دون لمس الشيفرة.',
        'صفحات «تسوّق الطقم» مع أداة لتجميع الطقم وخصم عليه، وعينات ألوان مولّدة من صور المنتجات.',
      ],
    },
  },
};
if (LANG === 'ar') {
  for (const [id, ar] of Object.entries(PROJECTS_AR)) {
    const p = PROJECTS[id];
    Object.assign(p, ar, { study: { ...p.study, ...ar.study } }); // the stack line stays as it is
  }
}
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
  const left = labelRow.getBoundingClientRect().left;
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

// ---------- the intro: an iPad that unlocks, then turns to landscape, as you scroll ----------
// Progress p runs 0 → 1 across the intro section: the first 30% unlocks it, the next 35% turns it,
// the rest pushes it forward and fades the big name, then the page scrolls on into the hero.
const unfold = document.querySelector('.unfold');
const unfoldStage = unfold && unfold.querySelector('.unfold-stage');
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
function updateUnfold() {
  if (!unfold) return;
  const set = (k, v) => unfoldStage.style.setProperty(k, v.toFixed(4));
  if (reduceMotion) { set('--unlock', 1); set('--turn', 1); return; }
  const range = unfold.offsetHeight - window.innerHeight;
  const p = range > 0 ? clamp01(-unfold.getBoundingClientRect().top / range) : 1;
  set('--unlock', easeInOut(clamp01(p / 0.3)));
  set('--turn', easeInOut(clamp01((p - 0.3) / 0.35)));
  set('--zoom', easeInOut(clamp01((p - 0.65) / 0.35)));
}
let unfoldTicking = false;
window.addEventListener('scroll', () => {
  if (unfoldTicking) return;
  unfoldTicking = true;
  requestAnimationFrame(() => { unfoldTicking = false; updateUnfold(); });
}, { passive: true });
window.addEventListener('resize', updateUnfold);
updateUnfold();

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
