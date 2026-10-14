import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A wall of retro TVs, seen straight on. A few "hero" TVs show the portfolio projects (a live site
// in an iframe, or a set of captured frames); the rest are shared-geometry decor TVs, mostly dark
// glossy glass with the odd channel lit up.
//
// Physical rule used by the layout: every TV rests on the one below it. The wall is built from
// columns; a TV may be topped by two or three narrower TVs side by side (they rest on its flat top).

const BODY = { w: 8, h: 6, d: 5 };
const RATIO = BODY.h / BODY.w;
const SCREEN = { w: 5.2, h: 3.9, x: -0.95, y: 0.15, r: 0.45 };
const FRAME_PX = { w: 1280, h: 960 }; // the iframe's size; its aspect matches SCREEN
const HOVER_SCALE = 1.1;
const FRONT = BODY.d / 2;

function rrect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function mulberry32(seed) { // small seeded random generator: the wall is the same on every load
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const glossTexture = () => canvasTexture(256, 256, (g) => {
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
});

function scanlines(g, w, h, alpha = 0.18) {
  g.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
}

const barsTexture = () => canvasTexture(128, 96, (g, w, h) => {
  const cols = ['#cfcfcf', '#cfcf00', '#00cfcf', '#00cf00', '#cf00cf', '#cf0000', '#0000cf'];
  cols.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * w) / 7, 0, w / 7 + 1, h * 0.72); });
  g.fillStyle = '#101010'; g.fillRect(0, h * 0.72, w, h * 0.28);
  g.fillStyle = '#cfcfcf'; g.fillRect(w * 0.1, h * 0.8, w * 0.18, h * 0.12);
  scanlines(g, w, h, 0.22);
});

const glowTexture = (inner, outer) => canvasTexture(64, 48, (g, w, h) => {
  const r = g.createRadialGradient(w * 0.45, h * 0.4, 2, w / 2, h / 2, w * 0.75);
  r.addColorStop(0, inner);
  r.addColorStop(1, outer);
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
  scanlines(g, w, h, 0.2);
});

const woodTexture = (base, dark) => {
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rng = mulberry32(base.length * 977 + dark.length);
    for (let i = 0; i < 46; i++) {
      g.fillStyle = dark;
      g.globalAlpha = 0.08 + rng() * 0.22;
      g.fillRect(0, rng() * h, w, 0.6 + rng() * 2.4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const slotsTexture = () => canvasTexture(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.75)';
  for (let x = 4; x < w - 2; x += 6) g.fillRect(x, 4, 2.5, h - 8);
}, false);

export function createTvs(container, heroConfigs, { onPress }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(14, 1, 1, 1000); // a long lens: nearly orthographic, so the wall reads flat and straight on

  const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.shadowMap.autoUpdate = false; // the wall is static; shadows are re-drawn only when something moves
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.05;
  const css = new CSS3DRenderer();
  for (const el of [css.domElement, gl.domElement]) { el.style.position = 'absolute'; el.style.inset = '0'; }
  css.domElement.style.pointerEvents = 'none';
  container.append(css.domElement, gl.domElement);

  let dirty = true;       // the canvas needs a redraw
  let dirtyCss = true;    // the iframes need their 3D transform refreshed (only when the camera or a hero TV moved)
  let dirtyShadow = true; // shadows need re-rendering

  // ----- lighting: a studio environment for reflections + a warm key light
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x14181a, 0.16));
  const key = new THREE.DirectionalLight(0xfff0de, 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(3072, 3072);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.05;
  scene.add(key, key.target);

  // ----- shared geometry and materials for the decor TVs
  const bodyGeo = new RoundedBoxGeometry(BODY.w, BODY.h, BODY.d, 4, 0.28);
  const ringShape = rrect(SCREEN.w + 0.7, SCREEN.h + 0.7, SCREEN.r + 0.25);
  ringShape.holes.push(rrect(SCREEN.w, SCREEN.h, SCREEN.r));
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 14 });
  const glassGeo = new THREE.ShapeGeometry(rrect(SCREEN.w, SCREEN.h, SCREEN.r), 14);
  { // map UVs to 0..1 so textures fill the glass
    const uv = glassGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / SCREEN.w + 0.5, uv.getY(i) / SCREEN.h + 0.5);
  }
  const knobGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.34, 24);
  const slotsGeo = new THREE.PlaneGeometry(1.5, 1.5);

  const cabinet = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.46, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.4, ...extra });
  const woodA = woodTexture('#6a4527', '#2c1a0d');
  const woodB = woodTexture('#8a5b32', '#3b230f');
  const cabinets = [
    cabinet(0x16181b), cabinet(0x16181b), cabinet(0x2b2d31), cabinet(0x2b2d31), cabinet(0x8d8f8d), cabinet(0xc9bfa9),
    cabinet(0xffffff, { map: woodA, roughness: 0.55 }), cabinet(0xffffff, { map: woodA, roughness: 0.55 }),
    cabinet(0xffffff, { map: woodB, roughness: 0.55 }), cabinet(0x3a1f1b), cabinet(0x3a3f2e), cabinet(0x3b484b),
  ];
  const bezelShared = new THREE.MeshPhysicalMaterial({ color: 0x0c0d0e, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.28, metalness: 1, envMapIntensity: 1.1 });
  const slotsMat = new THREE.MeshBasicMaterial({ map: slotsTexture(), transparent: true, toneMapped: false });

  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 96; noiseCanvas.height = 72;
  const noiseCtx = noiseCanvas.getContext('2d');
  const noiseTex = new THREE.CanvasTexture(noiseCanvas);
  noiseTex.colorSpace = THREE.SRGBColorSpace;
  function drawNoise() {
    const img = noiseCtx.createImageData(96, 72);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 70 + Math.random() * 150;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    noiseCtx.putImageData(img, 0, 0);
    scanlines(noiseCtx, 96, 72, 0.25);
    noiseTex.needsUpdate = true;
  }
  drawNoise();

  const lit = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false, color: 0xd8d8d8 });
  const channels = {
    off: new THREE.MeshPhysicalMaterial({ color: 0x050707, roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5 }),
    noise: lit(noiseTex),
    bars: lit(barsTexture()),
    blue: lit(glowTexture('#6f9bd8', '#16253e')),
    teal: lit(glowTexture('#7fc6bb', '#13302e')),
    amber: lit(glowTexture('#e2b46e', '#3a2410')),
  };
  const channelOrder = ['off', 'off', 'off', 'off', 'off', 'off', 'noise', 'noise', 'blue', 'teal', 'amber', 'bars'];

  function buildDecor(rng) {
    const g = new THREE.Group();
    const mirror = rng() < 0.3 ? -1 : 1; // some TVs keep their controls on the left
    const body = new THREE.Mesh(bodyGeo, cabinets[Math.floor(rng() * cabinets.length)]);
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    const ring = new THREE.Mesh(ringGeo, bezelShared);
    ring.position.set(SCREEN.x * mirror, SCREEN.y, FRONT);
    g.add(ring);
    const entry = { kind: 'decor', group: g, channel: channelOrder[Math.floor(rng() * channelOrder.length)] };
    const glass = new THREE.Mesh(glassGeo, channels[entry.channel]);
    glass.position.set(SCREEN.x * mirror, SCREEN.y, FRONT + 0.03);
    g.add(glass);
    entry.glass = glass;
    const knobs = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < knobs; i++) {
      const knob = new THREE.Mesh(knobGeo, metal);
      knob.rotation.x = Math.PI / 2;
      knob.rotation.y = rng() * Math.PI * 2;
      knob.position.set(3 * mirror, 1.9 - i * 1.05, FRONT + 0.17);
      g.add(knob);
    }
    if (rng() < 0.75) {
      const slots = new THREE.Mesh(slotsGeo, slotsMat);
      slots.position.set(3 * mirror, -1.5, FRONT + 0.012);
      g.add(slots);
    }
    g.userData.entry = entry;
    return entry;
  }

  // ----- hero TVs: full detail, show a project
  const hole = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, side: THREE.DoubleSide });
  const gloss = glossTexture();

  function buildHero(cfg) {
    const g = new THREE.Group();
    const pal = cfg.palette; // each TV wears its website's colours
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: pal.body, roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.28, envMapIntensity: 0.7 });
    const bezelMat = new THREE.MeshPhysicalMaterial({ color: pal.bezel, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
    const chrome = new THREE.MeshStandardMaterial({ color: pal.knob, roughness: 0.24, metalness: 1, envMapIntensity: 1.1 });
    const tan = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.34, metalness: 1, envMapIntensity: 1 });
    const black = new THREE.MeshStandardMaterial({ color: pal.slot, roughness: 0.92, metalness: 0, envMapIntensity: 0.2 });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = body.receiveShadow = true;
    g.add(body);

    const bezel = new THREE.Mesh(ringGeo, bezelMat);
    bezel.position.set(SCREEN.x, SCREEN.y, FRONT);
    g.add(bezel);

    // the screen: a see-through hole for a live site (iframe behind the canvas), or a cycled set of captured frames
    const screenZ = FRONT + 0.03;
    const frameTextures = cfg.frames ? cfg.frames.map((url) => {
      const tex = new THREE.TextureLoader().load(url, () => { dirty = true; });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = gl.capabilities.getMaxAnisotropy();
      return tex;
    }) : null;
    const screenMat = cfg.siteUrl ? hole : new THREE.MeshBasicMaterial({ map: frameTextures?.[0], color: frameTextures ? 0xffffff : 0x101010, side: THREE.DoubleSide, toneMapped: false });
    const screen = new THREE.Mesh(glassGeo, screenMat);
    screen.position.set(SCREEN.x, SCREEN.y, screenZ);
    g.add(screen);
    if (frameTextures && !reduceMotion) {
      let shown = 0; // flip through the captured pages, like someone browsing the site
      setInterval(() => {
        if (document.hidden) return;
        shown = (shown + 1) % frameTextures.length;
        screenMat.map = frameTextures[shown];
        screenMat.needsUpdate = true;
        dirty = true;
      }, 3200);
    }
    const glare = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), new THREE.MeshBasicMaterial({ map: gloss, transparent: true, depthWrite: false, opacity: 0.3, toneMapped: false }));
    glare.position.set(SCREEN.x, SCREEN.y, screenZ + 0.005);
    g.add(glare);

    // two real dials: a recessed collar, a ridged metal knob, a tan cap and a dark pointer
    const panelX = 3.0;
    const dials = [];
    [[1.8, -0.5], [0.75, 0.9]].forEach(([y, start]) => {
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.1, 32), black);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(panelX, y, FRONT + 0.05);
      g.add(collar);
      const dial = new THREE.Group();
      dial.position.set(panelX, y, FRONT + 0.1);
      dial.userData.dial = { angle: start, target: start };
      dial.rotation.z = start;
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.34, 32), chrome);
      knob.rotation.x = Math.PI / 2;
      knob.position.z = 0.17;
      dial.add(knob);
      for (let k = 0; k < 20; k++) {
        const ang = (k / 20) * Math.PI * 2;
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.3), chrome);
        ridge.position.set(Math.cos(ang) * 0.45, Math.sin(ang) * 0.45, 0.17);
        ridge.rotation.z = ang;
        dial.add(ridge);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24), tan);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = 0.36;
      dial.add(cap);
      const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.05), black);
      pointer.position.set(0, 0.17, 0.41);
      dial.add(pointer);
      dial.traverse((o) => { o.userData.dialOwner = dial; });
      g.add(dial);
      dials.push(dial);
    });
    for (let i = 0; i < 9; i++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.5, 0.05), black);
      slot.position.set(panelX - 0.55 + i * 0.14, -1.35, FRONT + 0.01);
      g.add(slot);
    }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.04), tan);
    strip.position.set(panelX, -2.35, FRONT + 0.01);
    g.add(strip);

    if (cfg.siteUrl) { // the live site, mapped onto the screen
      const frame = document.createElement('iframe');
      frame.src = cfg.siteUrl;
      frame.title = cfg.title + ' live preview';
      frame.loading = 'lazy';
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      Object.assign(frame.style, { width: FRAME_PX.w + 'px', height: FRAME_PX.h + 'px', border: '0', background: '#0f1512', pointerEvents: 'none' });
      const site = new CSS3DObject(frame);
      site.position.set(SCREEN.x, SCREEN.y, screenZ);
      site.scale.setScalar(SCREEN.w / FRAME_PX.w);
      g.add(site);
    }
    const entry = { kind: 'hero', id: cfg.id, group: g, screen, dials, scale: 1, target: 1, base: 1, baseZ: 0 };
    g.userData.entry = entry;
    return entry;
  }
  const heroes = heroConfigs.map(buildHero);
  heroes.forEach((h, i) => { // a soft pool of brand-coloured light in front of each project TV
    const light = new THREE.PointLight(heroConfigs[i].palette.accent, 0, 0, 2);
    h.glow = light;
    scene.add(light);
  });
  const wall = new THREE.Group();
  scene.add(wall);
  heroes.forEach((h) => wall.add(h.group));
  let decor = [];
  let pickables = [...heroes.map((h) => h.group)];

  // ----- the wall plan: columns of stacked TVs, every TV resting on the one below
  let plannedKey = '';
  function planWall(aspect) {
    const mobile = aspect < 1.15;
    const VW = mobile ? 60 : 126; // the visible width of the wall in world units (wide enough for all three project TVs)
    const VH = VW / aspect;
    const planKey = (mobile ? 'm' : 'd') + VH.toFixed(1);
    if (planKey === plannedKey) return { VW, VH, same: true };
    plannedKey = planKey;
    const rng = mulberry32(mobile ? 11 : 7);
    const top = VH / 2 + 1;
    const placed = []; // { x, y, w, h } for decor TVs, in column-local x (shifted to centre later)
    const heroSlots = []; // { idx, x, y, w }

    // fill upward from y: a TV, then either another TV or a split into two narrower stacks that rest on it
    function fillColumn(x0, w, y, depth) {
      let cy = y;
      while (cy < top) {
        const h = w * RATIO;
        placed.push({ x: x0 + w / 2, y: cy + h / 2, w, h });
        cy += h;
        if (cy >= top) return;
        if (depth < 2 && w >= 17 && rng() < 0.45) {
          const a = Math.round(w * (0.4 + rng() * 0.2) * 10) / 10;
          fillColumn(x0, a, cy, depth + 1);
          fillColumn(x0 + a, w - a, cy, depth + 1);
          return;
        }
      }
    }
    // a column holding hero TVs: plain TVs below (they carry the hero), splits allowed above
    function heroColumn(x0, w, targets) { // targets: [{ idx, ty }] ascending ty
      const h = w * RATIO;
      let k = Math.ceil((targets[0].ty - h / 2 + VH / 2) / h) + 1;
      let cy = targets[0].ty - h / 2 - k * h;
      for (let i = 0; i < k; i++) { placed.push({ x: x0 + w / 2, y: cy + h / 2, w, h }); cy += h; }
      targets.forEach((t, n) => {
        if (n > 0) {
          const gap = Math.max(0, Math.round((t.ty - h / 2 - cy) / h));
          for (let i = 0; i < gap; i++) { placed.push({ x: x0 + w / 2, y: cy + h / 2, w, h }); cy += h; }
        }
        heroSlots.push({ idx: t.idx, x: x0 + w / 2, y: cy + h / 2, w });
        cy += h;
      });
      fillColumn(x0, w, cy, 0);
    }
    function decorColumn(x0, w) {
      fillColumn(x0, w, -VH / 2 - rng() * w * RATIO * 0.9 - 2, 0);
    }

    const cols = [];
    if (!mobile) {
      const HW = 27;
      const between = () => 10 + rng() * 4;
      const edge = () => 13 + rng() * 6;
      cols.push({ w: edge() }, { w: 9 + rng() * 5 }, { hero: [{ idx: 0, ty: -0.05 * VH }], w: HW }, { w: between() },
        { hero: [{ idx: 1, ty: 0.04 * VH }], w: HW }, { w: between() }, { hero: [{ idx: 2, ty: -0.02 * VH }], w: HW }, { w: 9 + rng() * 5 }, { w: edge() });
    } else {
      const HW = 27;
      cols.push({ w: 9 }, { hero: [{ idx: 2, ty: -0.24 * VH }, { idx: 0, ty: 0.24 * VH }], w: HW }, { hero: [{ idx: 1, ty: 0 }], w: HW }, { w: 8 });
    }
    let x = 0;
    cols.forEach((c) => { c.x0 = x; x += c.w; (c.hero ? heroColumn(c.x0, c.w, c.hero) : decorColumn(c.x0, c.w)); });
    // centre the three hero TVs in the view
    const left = Math.min(...heroSlots.map((h) => h.x - h.w / 2));
    const right = Math.max(...heroSlots.map((h) => h.x + h.w / 2));
    const shift = -(left + right) / 2;
    return { VW, VH, mobile, placed, heroSlots, shift, rng, same: false };
  }

  function layout(aspect) {
    const plan = planWall(aspect);
    const { VW, VH } = plan;
    const dist = VH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    key.position.set(-VW * 0.32, VH * 0.45 + 6, dist * 0.8);
    key.target.position.set(0, 0, 0);
    Object.assign(key.shadow.camera, { left: -VW * 0.75, right: VW * 0.75, top: VH * 0.75, bottom: -VH * 0.75, near: 1, far: dist * 3 });
    key.shadow.camera.updateProjectionMatrix();
    if (!plan.same) {
      decor.forEach((d) => wall.remove(d.group));
      const rng = plan.rng;
      decor = plan.placed.map((p) => {
        const d = buildDecor(rng);
        const s = p.w / BODY.w;
        d.group.scale.setScalar(s);
        d.group.position.set(p.x + plan.shift, p.y, rng() * 0.1 * p.w); // a few TVs sit a little proud of their neighbours
        wall.add(d.group);
        return d;
      });
      plan.heroSlots.forEach((s) => {
        const h = heroes[s.idx];
        h.base = s.w / BODY.w;
        h.baseZ = s.w * 0.08;
        h.group.scale.setScalar(h.base * h.scale);
        h.group.position.set(s.x + plan.shift, s.y, h.baseZ + (h.scale - 1) * h.base * 7);
        h.glow.position.set(s.x + plan.shift, s.y, s.w * 1.1);
        h.glow.intensity = 0.34 * s.w * s.w; // roughly: enough to lift the neighbouring TVs without washing them out
      });
      pickables = [...heroes.map((h) => h.group), ...decor.map((d) => d.group)];
      dirtyCss = dirtyShadow = true;
    }
    dirty = true;
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    gl.setSize(w, h);
    css.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout(w / h);
    dirtyCss = true;
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // ----- render on demand
  let paused = false;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(container);
  function loop() {
    requestAnimationFrame(loop);
    if (paused || !visible || document.hidden) return;
    for (const t of heroes) { // ease each hero TV toward its hover size
      if (Math.abs(t.scale - t.target) > 0.001) {
        t.scale = reduceMotion ? t.target : t.scale + (t.target - t.scale) * 0.16;
        t.group.scale.setScalar(t.base * t.scale);
        t.group.position.z = t.baseZ + (t.scale - 1) * t.base * 7;
        dirty = dirtyCss = dirtyShadow = true;
      }
      for (const d of t.dials) {
        const st = d.userData.dial;
        if (Math.abs(st.angle - st.target) > 0.002) {
          st.angle = reduceMotion ? st.target : st.angle + (st.target - st.angle) * 0.2;
          d.rotation.z = st.angle;
          dirty = true;
        }
      }
    }
    if (!dirty) return;
    dirty = false;
    if (dirtyShadow) { gl.shadowMap.needsUpdate = true; dirtyShadow = false; }
    gl.render(scene, camera);
    if (dirtyCss) { css.render(scene, camera); dirtyCss = false; }
  }
  loop();
  if (!reduceMotion) { // the lit screens' static flickers
    setInterval(() => {
      if (paused || !visible || document.hidden) return;
      drawNoise();
      dirty = true;
    }, 110);
  }

  // ----- hover, press, change channel
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function pick(e) {
    const r = gl.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !o.userData.entry) o = o.parent;
    return o ? { entry: o.userData.entry, dial: hit.object.userData.dialOwner || null } : null;
  }
  function setHover(entry) {
    for (const h of heroes) h.target = h === entry ? HOVER_SCALE : 1;
    gl.domElement.style.cursor = entry ? 'pointer' : 'default';
  }
  gl.domElement.addEventListener('pointermove', (e) => setHover(pick(e)?.entry ?? null));
  gl.domElement.addEventListener('pointerleave', () => setHover(null));
  const order = Object.keys(channels);
  gl.domElement.addEventListener('click', (e) => {
    const hit = pick(e);
    if (!hit) return;
    const { entry } = hit;
    if (entry.kind === 'decor') { // change the channel: off → static → colour bars → glows → off
      entry.channel = order[(order.indexOf(entry.channel) + 1) % order.length];
      entry.glass.material = channels[entry.channel];
      dirty = true;
      return;
    }
    if (hit.dial) { hit.dial.userData.dial.target -= Math.PI / 3; dirty = true; return; } // a knob click turns the dial; it does not open the project
    onPress(entry.id);
  });

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => new THREE.Vector3((sx * SCREEN.w) / 2, (sy * SCREEN.h) / 2, 0));

  return {
    // a hero TV's screen as a bounding box in viewport pixels: the start of the zoom animation
    screenRect(id) {
      const t = heroes.find((x) => x.id === id);
      wall.updateMatrixWorld(true);
      const box = container.getBoundingClientRect();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of corners) {
        const v = c.clone().applyMatrix4(t.screen.matrixWorld).project(camera);
        const px = box.left + ((v.x + 1) / 2) * box.width;
        const py = box.top + ((1 - v.y) / 2) * box.height;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px);
        y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
    },
    setPaused(p) { paused = p; dirty = dirtyCss = true; },
  };
}
