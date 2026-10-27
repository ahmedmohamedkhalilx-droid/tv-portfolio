// The three projects, shared by the main site and the retro TV page.
// Paths are relative to the site root; each page resolves them against its own location.

// Case studies are written from each project's own README; keep them to facts the client would recognise.
const BASE_PROJECTS = {
  helco: {
    title: 'HELCO',
    desc: 'Bilingual website for an Egyptian audit, tax and advisory firm.',
    result: 'A site the firm can grow again: 124 services in 3 pillars, in English and Arabic, rebuilt from a deployment whose code was lost.',
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
    result: 'Every page of the old site carried over and checked automatically, with 84 browser tests running on every change.',
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
    result: 'A complete Arabic, right-to-left store, on a Shopify theme that shipped with no Arabic at all.',
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
    result: 'موقع تستطيع الشركة تطويره من جديد: 124 خدمة في 3 محاور، بالعربية والإنجليزية، أُعيد بناؤه من نسخة فُقدت شيفرتها.',
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
    result: 'نُقلت كل صفحات الموقع القديم وفُحصت تلقائياً، مع 84 اختباراً في المتصفح تعمل مع كل تعديل.',
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
    result: 'متجر عربي كامل من اليمين إلى اليسار، على قالب شوبيفاي لم يكن يدعم العربية إطلاقاً.',
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

// a fresh copy for one language: the Arabic page gets Arabic copy and the Arabic sites
export function getProjects(lang) {
  const out = JSON.parse(JSON.stringify(BASE_PROJECTS));
  if (lang === 'ar') {
    for (const [id, ar] of Object.entries(PROJECTS_AR)) {
      const p = out[id];
      Object.assign(p, ar, { study: { ...p.study, ...ar.study } }); // the stack line stays as it is
    }
  }
  return out;
}
