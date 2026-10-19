import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Procedural iPhones standing side by side. Each one shows a phone-sized still of its site and
// wears that site's colours on its metal frame; pressing one opens the live site.

const PHONE = { w: 3.6, h: 7.5, d: 0.36, r: 0.62 };       // outer size of the frame
const SCREEN = { w: 3.26, h: 7.06, r: 0.44 };              // 390 × 844 stills fit this exactly
const GAP = 1.25;                                          // air between neighbours
const GAP_TIGHT = 0.5;                                     // on a narrow wall the phones sit closer so each one is bigger
const HOVER_SCALE = 1.07;
const FRONT = PHONE.d / 2;

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

// a flat rounded rectangle whose UVs run 0..1 across it, ready for a texture
function panel(w, h, r) {
  const geo = new THREE.ShapeGeometry(rrect(w, h, r), 32);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5);
  return geo;
}

function glossTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.32, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(255,255,255,0.0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function createPhones(container, phoneConfigs, { onPress, onHover, onLayout }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);

  const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.05;
  gl.domElement.style.position = 'absolute';
  gl.domElement.style.inset = '0';
  container.append(gl.domElement);

  const gloss = glossTexture();
  const glassMat = new THREE.MeshPhysicalMaterial({ // the black glass around the display
    color: 0x050505, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1,
  });

  // the frame's outline, extruded with a rounded bevel so the edges catch the light
  const BEVEL = 0.08;
  const frameGeo = new THREE.ExtrudeGeometry(rrect(PHONE.w - 2 * BEVEL, PHONE.h - 2 * BEVEL, PHONE.r - BEVEL), {
    depth: PHONE.d - 2 * BEVEL, bevelEnabled: true, bevelSize: BEVEL, bevelThickness: BEVEL, bevelSegments: 5, curveSegments: 32,
  });
  frameGeo.translate(0, 0, -(PHONE.d - 2 * BEVEL) / 2);

  function buildPhone(cfg) {
    const g = new THREE.Group();
    const pal = cfg.palette; // each phone wears its website's colours
    const metal = new THREE.MeshPhysicalMaterial({   // brushed titanium in the site's colour
      color: pal.frame, roughness: 0.3, metalness: 0.75, clearcoat: 0.3, clearcoatRoughness: 0.3, envMapIntensity: 1.2,
    });

    const body = new THREE.Mesh(frameGeo, metal);
    body.castShadow = true;
    g.add(body);

    const glass = new THREE.Mesh(new THREE.ShapeGeometry(rrect(PHONE.w - 0.1, PHONE.h - 0.1, PHONE.r - 0.05), 32), glassMat);
    glass.position.z = FRONT + 0.002;
    g.add(glass);

    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0b, toneMapped: false });
    const screen = new THREE.Mesh(panel(SCREEN.w, SCREEN.h, SCREEN.r), screenMat);
    screen.position.z = FRONT + 0.004;
    g.add(screen);
    if (cfg.poster) {
      new THREE.TextureLoader().load(cfg.poster, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        screenMat.map = tex;
        screenMat.color.set(0xffffff);
        screenMat.needsUpdate = true;
        dirty = true;
      });
    }

    const glare = new THREE.Mesh(
      panel(SCREEN.w, SCREEN.h, SCREEN.r),
      new THREE.MeshBasicMaterial({ map: gloss, transparent: true, depthWrite: false, opacity: 0.22, toneMapped: false })
    );
    glare.position.z = FRONT + 0.008;
    g.add(glare);

    // side buttons: action and volume on the left, power on the right
    const sx = PHONE.w / 2 + 0.005;
    [[-sx, 2.35, 0.36], [-sx, 1.6, 0.62], [-sx, 0.82, 0.62], [sx, 1.35, 0.95]].forEach(([x, y, len]) => {
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.08, len, 0.14, 3, 0.03), metal);
      b.position.set(x, y, 0);
      g.add(b);
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -PHONE.h / 2 - 0.01;
    floor.receiveShadow = true;
    g.add(floor);

    return { id: cfg.id, group: g, screen, scale: 1, target: 1 };
  }

  const row = new THREE.Group();
  scene.add(row);
  const phones = phoneConfigs.map(buildPhone);
  phones.forEach((p) => row.add(p.group));

  // studio environment: gives the metal and glass something to reflect
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x14181a, 0.35));
  const key = new THREE.DirectionalLight(0xfff3e4, 1.8); // warm key from the upper left front
  key.position.set(-6, 10, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8f2, 1.2); // cool edge light from behind, for the frame's outline
  rim.position.set(8, 3, -7);
  scene.add(rim);

  // ----- layout: three phones in a row, seen straight on
  let gap = GAP;
  function layout(aspect) {
    const n = phones.length;
    const tight = aspect < 1.4;
    gap = tight ? GAP_TIGHT : GAP;
    const step = PHONE.w + gap;
    phones.forEach((p, i) => p.group.position.set((i - (n - 1) / 2) * step, 0, 0));
    const spanW = (n - 1) * step + PHONE.w + (tight ? 0.5 : 1.6); // room at the sides for a phone raised on hover
    const spanH = PHONE.h + 1.6;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(spanW / (2 * t * aspect), spanH / (2 * t)) * 1.04;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
  }

  // ----- render on demand
  let paused = false;
  let dirty = true;
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    gl.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout(w / h);
    dirty = true;
    if (onLayout) requestAnimationFrame(() => onLayout());
  }
  new ResizeObserver(resize).observe(container);
  resize();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop() {
    requestAnimationFrame(loop);
    if (paused) return;
    for (const p of phones) { // ease each phone toward its hover size
      if (Math.abs(p.scale - p.target) > 0.001) {
        p.scale = reduceMotion ? p.target : p.scale + (p.target - p.scale) * 0.16;
        p.group.scale.setScalar(p.scale);
        p.group.position.y = (p.scale - 1) * PHONE.h / 2; // grows upward, so it stays standing on the floor
        p.group.position.z = (p.scale - 1) * 6;
        dirty = true;
      }
    }
    if (!dirty) return;
    dirty = false;
    gl.render(scene, camera);
  }
  loop();

  // ----- hover + press
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function phoneAt(e) {
    const r = gl.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(phones.map((p) => p.group), true).find((h) => h.object.material.type !== 'ShadowMaterial');
    if (!hit) return null;
    return phones.find((p) => { let o = hit.object; while (o) { if (o === p.group) return true; o = o.parent; } return false; }) || null;
  }
  let pointerHot = null, labelHot = null;
  function applyHot() {
    const hot = pointerHot || labelHot;
    for (const p of phones) p.target = p === hot ? HOVER_SCALE : 1;
  }
  function setHover(p) {
    if (p === pointerHot) return;
    pointerHot = p;
    applyHot();
    gl.domElement.style.cursor = p ? 'pointer' : 'default';
    if (onHover) onHover(p ? p.id : null);
  }
  gl.domElement.addEventListener('pointermove', (e) => setHover(phoneAt(e)));
  gl.domElement.addEventListener('pointerleave', () => setHover(null));
  gl.domElement.addEventListener('click', (e) => {
    const p = phoneAt(e);
    if (p) onPress(p.id);
  });

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) =>
    new THREE.Vector3((sx * SCREEN.w) / 2, (sy * SCREEN.h) / 2, 0));

  return {
    // a phone's screen as a box in viewport pixels: where the zoom into the project starts
    screenRect(id) {
      const p = phones.find((x) => x.id === id);
      row.updateMatrixWorld(true);
      const box = container.getBoundingClientRect();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of corners) {
        const v = c.clone().applyMatrix4(p.screen.matrixWorld).project(camera);
        const px = box.left + ((v.x + 1) / 2) * box.width;
        const py = box.top + ((1 - v.y) / 2) * box.height;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px);
        y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
    },
    setPaused(v) { paused = v; dirty = true; },
    // raise a phone from outside (its label is hovered or focused); null lowers it
    highlight(id) { labelHot = phones.find((x) => x.id === id) || null; applyHot(); },
    // each phone's footprint in viewport pixels, at rest (ignores the hover lift)
    anchors() {
      const box = container.getBoundingClientRect();
      row.updateMatrixWorld(true);
      const toPx = (x, y) => {
        const v = new THREE.Vector3(x, y, FRONT).applyMatrix4(row.matrixWorld).project(camera);
        return { x: box.left + ((v.x + 1) / 2) * box.width, y: box.top + ((1 - v.y) / 2) * box.height };
      };
      const step = PHONE.w + gap;
      const slot = PHONE.w + gap * 0.6; // a phone plus most of its share of the gap: room for a label under it
      return phones.map((p, i) => {
        const cx = (i - (phones.length - 1) / 2) * step;
        const a = toPx(cx - slot / 2, -PHONE.h / 2);
        const b = toPx(cx + slot / 2, PHONE.h / 2);
        return { id: p.id, left: a.x, right: b.x, top: b.y, bottom: a.y };
      });
    },
  };
}
