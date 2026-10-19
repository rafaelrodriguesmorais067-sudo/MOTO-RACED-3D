(() => {
'use strict';

/* =====================================================================
   MOTO RACER 3D  -  Three.js
   Fases com clima · 5 motos · Garagem
   ===================================================================== */

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const PI = Math.PI;
const hex = c => '#' + c.toString(16).padStart(6, '0');

/* ---------------------------------------------------------------------
   Cena, câmera, luzes
   --------------------------------------------------------------------- */
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ccfff);
scene.fog = new THREE.Fog(0x8ccfff, 80, 430);

const camera = new THREE.PerspectiveCamera(68, 1, 0.3, 900);
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const hemi = new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 0.9);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
sunLight.position.set(40, 80, 30);
scene.add(sunLight);

/* Farol da moto (acende nas fases escuras) */
const headlight = new THREE.SpotLight(0xfff0cc, 0, 95, 0.5, 0.55, 1.1);
scene.add(headlight, headlight.target);

/* ---------------------------------------------------------------------
   Fases (clima)
   --------------------------------------------------------------------- */
const STAGE_LEN = 3000;   // metros por fase

const STAGES = [
  { name: 'Colinas Ensolaradas', icon: '☀️',
    sky: 0x8ccfff, fogN: 80, fogF: 430, ground: 0x3f8f3a, folA: 0x1f6b2d, folB: 0x2a8239,
    hemiS: 0xffffff, hemiG: 0x4a7a3a, hemiI: 0.9, sunC: 0xfff2d0, sunI: 0.9,
    discC: 0xfff3b0, disc: 1, discY: 170, discS: 1, mount: 0x6f93b8,
    asphalt: 0x38383f, rough: 0.9, bright: 1, head: 0, stars: 0, rain: 0, snow: 0, grip: 1 },
  { name: 'Pôr do Sol', icon: '🌇',
    sky: 0xf59a62, fogN: 70, fogF: 400, ground: 0x4a7a2e, folA: 0x24512a, folB: 0x35702e,
    hemiS: 0xffc9a0, hemiG: 0x5a4636, hemiI: 0.75, sunC: 0xff9a55, sunI: 0.85,
    discC: 0xffd98a, disc: 1, discY: 38, discS: 1.7, mount: 0x9a5f7e,
    asphalt: 0x3a3438, rough: 0.85, bright: 0.95, head: 0.5, stars: 0, rain: 0, snow: 0, grip: 1 },
  { name: 'Tempestade', icon: '🌧️',
    sky: 0x66737f, fogN: 30, fogF: 270, ground: 0x2d6433, folA: 0x15451f, folB: 0x1d5629,
    hemiS: 0xb4c0cc, hemiG: 0x37463f, hemiI: 0.62, sunC: 0x9fb0c0, sunI: 0.3,
    discC: 0xdddddd, disc: 0, discY: 170, discS: 1, mount: 0x4c5863,
    asphalt: 0x23252a, rough: 0.32, bright: 0.8, head: 1.0, stars: 0, rain: 1, snow: 0, grip: 0.68 },
  { name: 'Neblina Densa', icon: '🌫️',
    sky: 0xc3ccd3, fogN: 8, fogF: 160, ground: 0x587450, folA: 0x35523c, folB: 0x426248,
    hemiS: 0xffffff, hemiG: 0x6a7a68, hemiI: 0.85, sunC: 0xeef2f5, sunI: 0.35,
    discC: 0xffffff, disc: 0, discY: 170, discS: 1, mount: 0xc3ccd3,
    asphalt: 0x3a3c42, rough: 0.75, bright: 0.9, head: 0.9, stars: 0, rain: 0, snow: 0, grip: 0.9 },
  { name: 'Nevasca', icon: '❄️',
    sky: 0xd5e3ef, fogN: 20, fogF: 230, ground: 0xeff4f8, folA: 0xdfeaf2, folB: 0xc7d8e5,
    hemiS: 0xffffff, hemiG: 0x9fb0c2, hemiI: 0.95, sunC: 0xdce8f5, sunI: 0.45,
    discC: 0xffffff, disc: 0, discY: 170, discS: 1, mount: 0xe0eaf3,
    asphalt: 0x4b4f58, rough: 0.55, bright: 0.95, head: 0.6, stars: 0, rain: 0, snow: 1, grip: 0.5 },
  { name: 'Noite Estrelada', icon: '🌙',
    sky: 0x060a1c, fogN: 25, fogF: 320, ground: 0x14301d, folA: 0x0d2619, folB: 0x123320,
    hemiS: 0x5666a8, hemiG: 0x0e121a, hemiI: 0.42, sunC: 0x6f80c0, sunI: 0.22,
    discC: 0xe6ecff, disc: 1, discY: 150, discS: 0.8, mount: 0x131a3a,
    asphalt: 0x1f2126, rough: 0.5, bright: 0.6, head: 2.4, stars: 1, rain: 0, snow: 0, grip: 1 }
];
const COL_KEYS = ['sky', 'ground', 'folA', 'folB', 'hemiS', 'hemiG', 'sunC', 'discC', 'mount', 'asphalt'];
const NUM_KEYS = ['fogN', 'fogF', 'hemiI', 'sunI', 'disc', 'discY', 'discS', 'rough', 'bright', 'head', 'stars', 'rain', 'snow'];
for (const s of STAGES) {
  s.c = {};
  for (const k of COL_KEYS) s.c[k] = new THREE.Color(s[k]);
}

const env = { c: {}, n: {} };
let envTarget = STAGES[0];
function setEnvTarget(stage, instant) {
  envTarget = stage;
  if (instant || !env.c.sky) {
    for (const k of COL_KEYS) env.c[k] = stage.c[k].clone();
    for (const k of NUM_KEYS) env.n[k] = stage[k];
  }
}
setEnvTarget(STAGES[0], true);

/* ---------------------------------------------------------------------
   Constantes do mundo
   --------------------------------------------------------------------- */
const ROAD_W = 14;
const LANES = [-5.25, -1.75, 1.75, 5.25];
const SEG_L = 12;
const SEG_N = 48;               // par, para o padrão de listras casar
const SPAN = SEG_L * SEG_N;
const K = 0.0003;               // intensidade da curva

let curve = 0, curveTarget = 0, curveTimer = 6;
const curveX = d => curve * K * Math.pow(Math.max(d, 0), 2);
const curveSlope = d => 2 * K * curve * Math.max(d, 0);

/* ---------------------------------------------------------------------
   Estrada
   --------------------------------------------------------------------- */
const flatGeo = (w, l) => { const g = new THREE.PlaneGeometry(w, l); g.rotateX(-PI / 2); return g; };
const stdMat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9, metalness: 0 }, o));
const offsetMat = (c) => new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

const asphalt = [stdMat(0x38383f), stdMat(0x3f3f47)];
const rumble = [offsetMat(0xd93030), offsetMat(0xf2f2f2)];
const lineMat = offsetMat(0xf4f4f4);

const segs = [];
for (let i = 0; i < SEG_N; i++) {
  const g = new THREE.Group();
  const road = new THREE.Mesh(flatGeo(ROAD_W, SEG_L + 0.1), asphalt[i & 1]);
  g.add(road);

  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(flatGeo(0.7, SEG_L + 0.1), rumble[i & 1]);
    r.position.set(s * (ROAD_W / 2 + 0.35), 0.02, 0);
    g.add(r);
    const e = new THREE.Mesh(flatGeo(0.16, SEG_L + 0.1), lineMat);
    e.position.set(s * (ROAD_W / 2 - 0.3), 0.03, 0);
    g.add(e);
  }
  if ((i & 1) === 0) {
    for (const x of [-3.5, 0, 3.5]) {
      const d = new THREE.Mesh(flatGeo(0.16, SEG_L * 0.5), lineMat);
      d.position.set(x, 0.03, 0);
      g.add(d);
    }
  }
  scene.add(g);
  segs.push(g);
}

/* Chão (textura neutra, tingida pela cor da fase) */
function makeGroundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f6f6'; g.fillRect(0, 0, 64, 32);
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 32, 64, 32);
  for (let i = 0; i < 240; i++) {
    g.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#d2d2d2';
    g.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(75, 75);
  t.magFilter = THREE.NearestFilter;
  return t;
}
const groundTex = makeGroundTexture();
const ground = new THREE.Mesh(
  flatGeo(1200, 1200),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
);
ground.position.set(0, -0.05, -380);
scene.add(ground);

/* Montanhas, sol/lua e estrelas (fundo) */
const mtMat = new THREE.MeshBasicMaterial({ color: 0x6f93b8, fog: false });
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(rand(70, 140), rand(70, 170), 5), mtMat);
  m.position.set(-700 + i * 105 + rand(-30, 30), 40, -640);
  scene.add(m);
}
const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(30, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false, transparent: true })
);
sunDisc.position.set(130, 170, -700);
scene.add(sunDisc);

const starPos = new Float32Array(500 * 3);
for (let i = 0; i < 500; i++) {
  const v = new THREE.Vector3(rand(-1, 1), rand(0.06, 1), rand(-1, 0.1)).normalize().multiplyScalar(780);
  starPos.set([v.x, v.y, v.z], i * 3);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0, depthWrite: false
}));
stars.frustumCulled = false;
stars.visible = false;
scene.add(stars);

/* Plataforma giratória da garagem */
const turntable = new THREE.Group();
{
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.5, 0.12, 40),
    new THREE.MeshStandardMaterial({ color: 0x20242c, roughness: 0.4, metalness: 0.6 })
  );
  disc.position.y = 0.06;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.04, 8, 56), new THREE.MeshBasicMaterial({ color: 0xff3b4e }));
  ring.rotation.x = PI / 2;
  ring.position.y = 0.13;
  turntable.add(disc, ring);
  turntable.visible = false;
  scene.add(turntable);
}

/* ---------------------------------------------------------------------
   Aplicar ambiente (transição suave entre fases)
   --------------------------------------------------------------------- */
const WHITE = new THREE.Color(1, 1, 1);
let lightning = 0, lightningTimer = 6;

function applyEnv() {
  const L = lightning;
  scene.background.copy(env.c.sky).lerp(WHITE, L * 0.55);
  scene.fog.color.copy(scene.background);
  scene.fog.near = env.n.fogN;
  scene.fog.far = env.n.fogF;

  hemi.color.copy(env.c.hemiS);
  hemi.groundColor.copy(env.c.hemiG);
  hemi.intensity = env.n.hemiI + L * 1.3;
  sunLight.color.copy(env.c.sunC);
  sunLight.intensity = env.n.sunI;

  ground.material.color.copy(env.c.ground);
  folA.color.copy(env.c.folA);
  folB.color.copy(env.c.folB);
  mtMat.color.copy(env.c.mount);

  sunDisc.material.color.copy(env.c.discC);
  sunDisc.material.opacity = env.n.disc;
  sunDisc.visible = env.n.disc > 0.02;
  sunDisc.position.y = env.n.discY;
  sunDisc.scale.setScalar(env.n.discS);

  asphalt[0].color.copy(env.c.asphalt);
  asphalt[1].color.copy(env.c.asphalt).multiplyScalar(1.14);
  asphalt[0].roughness = asphalt[1].roughness = env.n.rough;

  const b = env.n.bright;
  lineMat.color.setRGB(0.957 * b, 0.957 * b, 0.957 * b);
  rumble[0].color.setRGB(0.85 * b, 0.19 * b, 0.19 * b);
  rumble[1].color.setRGB(0.95 * b, 0.95 * b, 0.95 * b);

  headlight.intensity = env.n.head;
  stars.visible = env.n.stars > 0.02;
  stars.material.opacity = env.n.stars;
}

function updateEnv(dt) {
  const k = Math.min(1, dt * 0.9);
  for (const key of COL_KEYS) env.c[key].lerp(envTarget.c[key], k);
  for (const key of NUM_KEYS) env.n[key] += (envTarget[key] - env.n[key]) * k;
  applyEnv();
}

/* ---------------------------------------------------------------------
   Partículas de clima
   --------------------------------------------------------------------- */
const wxGroup = new THREE.Group();
scene.add(wxGroup);

const RAIN_N = 800, SNOW_N = 1000;
const rainPos = new Float32Array(RAIN_N * 6);
const rainData = [];
for (let i = 0; i < RAIN_N; i++) rainData.push({ x: rand(-28, 28), y: rand(0, 24), z: rand(-75, 8) });
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xb9d0ee, transparent: true, opacity: 0 });
const rain = new THREE.LineSegments(rainGeo, rainMat);
rain.frustumCulled = false;
rain.visible = false;
wxGroup.add(rain);

const snowPos = new Float32Array(SNOW_N * 3);
const snowData = [];
for (let i = 0; i < SNOW_N; i++) snowData.push({ x: rand(-28, 28), y: rand(0, 24), z: rand(-75, 8) });
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0, depthWrite: false });
const snow = new THREE.Points(snowGeo, snowMat);
snow.frustumCulled = false;
snow.visible = false;
wxGroup.add(snow);

let T = 0;
function updateWeather(dt, v) {
  wxGroup.position.x = camera.position.x;

  const r = env.n.rain, s = env.n.snow;
  rain.visible = r > 0.02;
  if (rain.visible) {
    rainMat.opacity = 0.6 * r;
    for (let i = 0; i < RAIN_N; i++) {
      const d = rainData[i];
      d.y -= 40 * dt;
      d.z += v * dt;
      if (d.y < 0) { d.y += 24; d.x = rand(-28, 28); }
      if (d.z > 8) { d.z -= 83; d.x = rand(-28, 28); }
      const o = i * 6;
      rainPos[o] = d.x; rainPos[o + 1] = d.y; rainPos[o + 2] = d.z;
      rainPos[o + 3] = d.x; rainPos[o + 4] = d.y + 0.88; rainPos[o + 5] = d.z - v * 0.022;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  snow.visible = s > 0.02;
  if (snow.visible) {
    snowMat.opacity = 0.9 * s;
    for (let i = 0; i < SNOW_N; i++) {
      const d = snowData[i];
      d.y -= 3.5 * dt;
      d.x += Math.sin(T * 1.3 + i) * 0.8 * dt;
      d.z += v * dt;
      if (d.y < 0) { d.y += 24; d.x = rand(-28, 28); }
      if (d.z > 8) { d.z -= 83; d.x = rand(-28, 28); }
      snowPos[i * 3] = d.x; snowPos[i * 3 + 1] = d.y; snowPos[i * 3 + 2] = d.z;
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  // relâmpagos na tempestade
  if (r > 0.7) {
    lightningTimer -= dt;
    if (lightningTimer <= 0) {
      lightning = 1;
      lightningTimer = rand(5, 12);
      thunder();
    }
  }
  lightning = Math.max(0, lightning - dt * 5);
}

/* ---------------------------------------------------------------------
   Modelos
   --------------------------------------------------------------------- */
function disposeObj(o) {
  o.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
      else c.material.dispose();
    }
  });
}

function limb(a, b, r, color) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), stdMat(color, { roughness: 0.6 }));
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/* Estilos de moto: medidas de cada modelo */
const MOTO_STYLES = {
  street: {
    fr: 0.42, fw: 0.2, fz: 0.95, rr: 0.42, rw: 0.2, rz: 0.95,
    body: { y: 0.85, z: 0.1, l: 1.3 }, tank: { s: [0.6, 0.55, 1.1], p: [0, 1.2, -0.25] },
    seat: { y: 1.12, z: 0.55 }, tail: { y: 1.22, z: 1.0, rot: -0.2, s: [0.3, 0.2, 0.6] },
    bar: { y: 1.42, z: -0.6, w: 0.8 }, head: [0, 1.22, -1.12], tl: [0, 1.25, 1.33],
    torso: { y: 1.78, z: 0.2, rot: -0.6 }, helmet: { y: 2.32, z: -0.12 }, footZ: 0.15, footY: 0.62,
    exh: { x: 0.26, y: 0.55, z: 0.95, l: 0.9 }, flame: 0xff8a00
  },
  sport: {
    fr: 0.40, fw: 0.22, fz: 0.92, rr: 0.41, rw: 0.3, rz: 0.92,
    body: { y: 0.82, z: 0.1, l: 1.25 }, tank: { s: [0.55, 0.45, 1.0], p: [0, 1.15, -0.3] },
    seat: { y: 1.08, z: 0.66 }, tail: { y: 1.2, z: 1.08, rot: -0.35, s: [0.32, 0.22, 0.78] },
    bar: { y: 1.28, z: -0.72, w: 0.62 }, head: [0, 1.1, -1.18], tl: [0, 1.22, 1.45],
    torso: { y: 1.58, z: 0.02, rot: -1.05 }, helmet: { y: 2.02, z: -0.4 }, footZ: 0.4, footY: 0.55,
    exh: { x: 0.22, y: 0.5, z: 1.05, l: 1.0 }, flame: 0x66b3ff
  },
  chopper: {
    fr: 0.45, fw: 0.12, fz: 1.75, rr: 0.46, rw: 0.34, rz: 0.9,
    body: { y: 0.8, z: 0.15, l: 1.5 }, tank: { s: [0.55, 0.5, 0.85], p: [0, 1.18, -0.2] },
    seat: { y: 0.98, z: 0.55 }, tail: { y: 0.98, z: 1.0, rot: 0, s: [0.34, 0.08, 0.8] },
    bar: { y: 1.75, z: -0.45, w: 0.9 }, forkTop: [0, 1.4, -0.8], head: [0, 1.1, -1.25], tl: [0, 1.0, 1.45],
    torso: { y: 1.72, z: 0.45, rot: 0.2 }, helmet: { y: 2.32, z: 0.4 }, footZ: -0.7, footY: 0.55,
    exh: { x: 0.3, y: 0.45, z: 0.9, l: 1.6 }, flame: 0xffa030
  },
  trail: {
    fr: 0.5, fw: 0.15, fz: 1.0, rr: 0.5, rw: 0.18, rz: 1.0,
    body: { y: 1.15, z: 0.15, l: 1.3 }, tank: { s: [0.55, 0.55, 0.9], p: [0, 1.62, -0.2] },
    seat: { y: 1.5, z: 0.55 }, tail: { y: 1.6, z: 1.1, rot: -0.15, s: [0.34, 0.14, 0.7] },
    bar: { y: 1.95, z: -0.55, w: 0.85 }, forkTop: [0, 1.9, -0.6], head: [0, 1.7, -1.0], tl: [0, 1.62, 1.45],
    torso: { y: 2.2, z: 0.28, rot: -0.3 }, helmet: { y: 2.78, z: 0.05 }, footZ: 0.25, footY: 0.72,
    exh: { x: 0.28, y: 1.1, z: 1.0, l: 1.0 }, flame: 0xff8a00
  },
  volt: {
    fr: 0.34, fw: 0.14, fz: 0.8, rr: 0.34, rw: 0.16, rz: 0.8,
    seat: { y: 1.25, z: 0.6 },
    bar: { y: 1.45, z: -0.62, w: 0.6 }, head: [0, 1.15, -0.84], tl: [0, 1.05, 1.08],
    torso: { y: 1.78, z: 0.3, rot: -0.22 }, helmet: { y: 2.3, z: 0.1 }, footZ: -0.15, footY: 0.72,
    exh: { x: 0, y: 0.7, z: 1.05, l: 0 }, flame: 0x40e0ff
  }
};

function makeMoto(bodyColor, riderColor, style) {
  style = style || 'street';
  const S = MOTO_STYLES[style];
  const root = new THREE.Group();
  const lean = new THREE.Group();
  root.add(lean);
  const M = (geo, c, o) => new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5, metalness: 0.3 }, o)));
  const place = (m, x, y, z, rx) => { m.position.set(x, y, z); if (rx) m.rotation.x = rx; return m; };
  const parts = [];

  // rodas
  const wheels = [];
  for (const wd of [{ z: -S.fz, r: S.fr, w: S.fw }, { z: S.rz, r: S.rr, w: S.rw }]) {
    const w = new THREE.Group();
    w.position.set(0, wd.r, wd.z);
    const tire = M(new THREE.CylinderGeometry(wd.r, wd.r, wd.w, 24), 0x111111, { metalness: 0 });
    tire.rotation.z = PI / 2;
    const rim = M(new THREE.CylinderGeometry(wd.r * 0.62, wd.r * 0.62, wd.w + 0.02, 16), 0xbbbbbb);
    rim.rotation.z = PI / 2;
    const bar = M(new THREE.BoxGeometry(wd.w + 0.04, 0.08, wd.r * 1.2), 0x555555);
    w.add(tire, rim, bar);
    lean.add(w);
    wheels.push(w);
  }

  // garfo, guidão, farol, lanterna, banco
  parts.push(limb([0, S.fr, -S.fz], S.forkTop || [0, S.bar.y, S.bar.z], 0.05, 0xaaaaaa));
  const bars = M(new THREE.CylinderGeometry(0.03, 0.03, S.bar.w, 8), 0x999999);
  bars.rotation.z = PI / 2;
  parts.push(place(bars, 0, S.bar.y, S.bar.z));
  parts.push(place(M(new THREE.SphereGeometry(0.13, 12, 10), 0xffffcc, { emissive: 0xffee88, emissiveIntensity: 1 }), ...S.head));
  parts.push(place(M(new THREE.BoxGeometry(0.2, 0.08, 0.05), 0xff0000, { emissive: 0xff0000, emissiveIntensity: 1 }), ...S.tl));
  parts.push(place(M(new THREE.BoxGeometry(0.4, 0.15, 0.8), 0x111111), 0, S.seat.y, S.seat.z));

  if (style === 'volt') {
    // scooter elétrica com neon
    const neon = { emissive: bodyColor, emissiveIntensity: 1.4, metalness: 0 };
    parts.push(place(M(new THREE.BoxGeometry(0.55, 0.12, 1.2), bodyColor), 0, 0.62, 0.05));
    parts.push(place(M(new THREE.BoxGeometry(0.42, 0.26, 0.95), 0x1a1d24), 0, 0.48, 0.05));
    for (const s of [-1, 1]) parts.push(place(M(new THREE.BoxGeometry(0.04, 0.05, 1.0), bodyColor, neon), s * 0.29, 0.5, 0.05));
    parts.push(place(M(new THREE.BoxGeometry(0.46, 0.5, 0.7), bodyColor), 0, 0.95, 0.72));
    parts.push(place(M(new THREE.BoxGeometry(0.46, 0.55, 0.22), bodyColor), 0, 1.05, -0.7, -0.2));
    parts.push(place(M(new THREE.BoxGeometry(0.34, 0.06, 0.05), 0xaaffff, { emissive: 0x66ffff, emissiveIntensity: 1.5 }), 0, 1.28, -0.82));
  } else {
    parts.push(place(M(new THREE.BoxGeometry(0.38, 0.42, S.body.l), 0x222222), 0, S.body.y, S.body.z));
    const tank = M(new THREE.SphereGeometry(0.5, 16, 12), bodyColor);
    tank.scale.set(...S.tank.s);
    parts.push(place(tank, ...S.tank.p));
    parts.push(place(M(new THREE.BoxGeometry(...S.tail.s), bodyColor), 0, S.tail.y, S.tail.z, S.tail.rot));
    const exhaust = M(new THREE.CylinderGeometry(0.06, 0.07, S.exh.l, 8), 0xaaaaaa);
    exhaust.rotation.x = PI / 2;
    parts.push(place(exhaust, S.exh.x, S.exh.y, S.exh.z));
  }

  // detalhes de cada modelo
  if (style === 'street') {
    parts.push(place(M(new THREE.BoxGeometry(0.5, 0.45, 0.5), bodyColor), 0, 1.1, -0.85));
  }
  if (style === 'sport') {
    parts.push(place(M(new THREE.BoxGeometry(0.5, 0.46, 0.8), bodyColor), 0, 1.08, -0.88, 0.12));
    parts.push(place(M(new THREE.BoxGeometry(0.4, 0.34, 0.04), 0x99ccff, { transparent: true, opacity: 0.55, metalness: 0.1 }), 0, 1.52, -0.7, -0.55));
    for (const s of [-1, 1]) parts.push(place(M(new THREE.BoxGeometry(0.08, 0.42, 0.95), bodyColor), s * 0.28, 0.92, -0.3));
    parts.push(place(M(new THREE.BoxGeometry(0.12, 0.02, 0.9), 0xffffff), 0, 1.385, -0.3));
  }
  if (style === 'chopper') {
    parts.push(limb([0, 1.02, 1.15], [0, 1.8, 1.4], 0.03, 0xcccccc));
    parts.push(place(M(new THREE.BoxGeometry(0.3, 0.35, 0.08), 0x222222), 0, 1.55, 1.4));
    for (const s of [-1, 1]) parts.push(limb([s * 0.38, 1.3, -0.58], [s * 0.45, 1.75, -0.45], 0.03, 0xcccccc));
    const ex2 = M(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 8), 0xcccccc);
    ex2.rotation.x = PI / 2;
    parts.push(place(ex2, -0.3, 0.45, 0.9));
    parts.push(place(M(new THREE.BoxGeometry(0.4, 0.06, 1.0), 0x999999), 0, 1.04, 0.95));
    parts.push(place(M(new THREE.BoxGeometry(0.16, 0.05, 0.55), bodyColor), 0, 1.0, -1.75));
  }
  if (style === 'trail') {
    parts.push(place(M(new THREE.BoxGeometry(0.22, 0.06, 0.75), bodyColor), 0, 1.2, -1.1, 0.25));
    parts.push(place(M(new THREE.BoxGeometry(0.3, 0.05, 0.6), bodyColor), 0, 1.12, 1.15));
    parts.push(place(M(new THREE.BoxGeometry(0.55, 0.45, 0.6), 0xe86a1a), 0, 1.85, 1.3));
    parts.push(place(M(new THREE.BoxGeometry(0.4, 0.3, 0.04), 0xaaccee, { transparent: true, opacity: 0.55 }), 0, 2.15, -0.8, -0.4));
    parts.push(place(M(new THREE.BoxGeometry(0.3, 0.1, 0.8), 0x555555), 0, 0.7, 0));
  }

  // piloto
  const T0 = S.torso;
  parts.push(place(M(new THREE.BoxGeometry(0.5, 0.75, 0.32), riderColor, { metalness: 0 }), 0, T0.y, T0.z, T0.rot));
  parts.push(place(M(new THREE.SphereGeometry(0.27, 16, 12), 0xf5f5f5, { metalness: 0.1 }), 0, S.helmet.y, S.helmet.z));
  parts.push(place(M(new THREE.BoxGeometry(0.34, 0.12, 0.22), 0x111122), 0, S.helmet.y, S.helmet.z - 0.21));
  for (const s of [-1, 1]) {
    parts.push(limb([s * 0.26, T0.y + 0.22, T0.z - 0.15], [s * (S.bar.w / 2 - 0.02), S.bar.y, S.bar.z], 0.07, riderColor));
    const hip = [s * 0.25, S.seat.y + 0.1, S.seat.z + 0.1];
    const foot = [s * 0.28, S.footY, S.footZ];
    const knee = [(hip[0] + foot[0]) / 2 + s * 0.08, (hip[1] + foot[1]) / 2 + 0.12, (hip[2] + foot[2]) / 2 - 0.25];
    parts.push(limb(hip, knee, 0.1, 0x1a1a22), limb(knee, foot, 0.085, 0x1a1a22));
  }

  // chama do nitro
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 1.4, 10),
    new THREE.MeshBasicMaterial({ color: S.flame, transparent: true, opacity: 0.85 })
  );
  flame.rotation.x = PI / 2;
  flame.position.set(S.exh.x, S.exh.y, S.exh.z + 1.05);
  flame.visible = false;
  parts.push(flame);

  parts.forEach(p => lean.add(p));

  // sombra (ou brilho neon na elétrica)
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(1, 16),
    new THREE.MeshBasicMaterial({ color: style === 'volt' ? bodyColor : 0x000000, transparent: true, opacity: style === 'volt' ? 0.45 : 0.35 })
  );
  blob.rotation.x = -PI / 2;
  blob.scale.set(0.7, 1.9, 1);
  blob.position.y = 0.04;
  root.add(blob);

  root.userData = { lean, wheels, flame };
  return root;
}

function makeCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 3.8), stdMat(color, { roughness: 0.4, metalness: 0.4 }));
  body.position.y = 0.68;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 1.9), stdMat(0x1c2a3a, { roughness: 0.2, metalness: 0.6 }));
  cabin.position.set(0, 1.25, 0.2);
  g.add(body, cabin);
  for (const x of [-0.92, 0.92]) for (const z of [-1.2, 1.2]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14), stdMat(0x111111));
    w.rotation.z = PI / 2;
    w.position.set(x, 0.38, z);
    g.add(w);
  }
  for (const x of [-0.65, 0.65]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    l.position.set(x, 0.8, 1.92);
    g.add(l);
  }
  return g;
}

function makeTruck(color) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.5, 4.6), stdMat(color, { roughness: 0.6 }));
  box.position.set(0, 1.9, 1.0);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.8), stdMat(0xd0d4da, { roughness: 0.5 }));
  cab.position.set(0, 1.45, -2.1);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.1), stdMat(0x1c2a3a, { roughness: 0.2 }));
  glass.position.set(0, 1.9, -3.03);
  g.add(box, cab, glass);
  for (const x of [-1.1, 1.1]) for (const z of [-2.2, 0.2, 2.4]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), stdMat(0x111111));
    w.rotation.z = PI / 2;
    w.position.set(x, 0.5, z);
    g.add(w);
  }
  for (const x of [-0.8, 0.8]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    l.position.set(x, 0.9, 3.33);
    g.add(l);
  }
  return g;
}

/* Cenário lateral (materiais compartilhados: mudam de cor com a fase) */
const trunkMat = stdMat(0x6b4a2b);
const folA = stdMat(0x1f6b2d);
const folB = stdMat(0x2a8239);
const poleMat = stdMat(0x888c94);
const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff1b0 });

function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 8), trunkMat);
  trunk.position.y = 1;
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 4.5, 8), folA);
  c1.position.y = 4;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.5, 8), folB);
  c2.position.y = 6.2;
  g.add(trunk, c1, c2);
  g.scale.setScalar(rand(0.8, 1.6));
  return g;
}
function makePole() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8, 8), poleMat);
  p.position.y = 4;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), poleMat);
  arm.position.set(-1, 8, 0);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), lampMat);
  lamp.position.set(-2, 7.9, 0);
  g.add(p, arm, lamp);
  return g;
}

const sideObjs = [];
for (let i = 0; i < 80; i++) {
  const isPole = i % 8 === 0;
  const mesh = isPole ? makePole() : makeTree();
  const o = {
    mesh, isPole,
    side: Math.random() < 0.5 ? -1 : 1,
    off: isPole ? ROAD_W / 2 + 2 : rand(9.5, 45),
    d: rand(-20, 410)
  };
  scene.add(mesh);
  sideObjs.push(o);
}

/* ---------------------------------------------------------------------
   Motos jogáveis
   --------------------------------------------------------------------- */
const COLORS = [0xd81f2d, 0x1b64e0, 0xf2b01e, 0x23a455, 0xf26a21, 0x8a3ddb, 0xeeeeee, 0x1b1b1b, 0x00d4ff];

const BIKES = [
  { id: 'falcon', name: 'Falcon S1', style: 'street', color: 0xd81f2d, rider: 0x1e5bd8,
    desc: 'Naked equilibrada. Ótima para aprender as pistas.',
    top: 235, accel: 1.0, handling: 1.0, brake: 1.0, grip: 1.0, lives: 3, off: 90, nUse: 1.0, nRec: 1.0, camY: 3.1,
    snd: { type: 'sawtooth', pitch: 1.0 }, r: [3, 3, 3, 3, 3] },
  { id: 'viper', name: 'Viper RR', style: 'sport', color: 0x1b64e0, rider: 0x111111,
    desc: 'Superesportiva carenada. Velocidade brutal, mas nervosa e frágil.',
    top: 268, accel: 1.15, handling: 0.86, brake: 1.1, grip: 0.9, lives: 2, off: 80, nUse: 1.1, nRec: 0.9, camY: 3.0,
    snd: { type: 'sawtooth', pitch: 1.25 }, r: [5, 4, 2, 2, 2] },
  { id: 'iron', name: 'Iron Cruiser', style: 'chopper', color: 0x1b1b1b, rider: 0x5a3a1e,
    desc: 'Chopper pesada. Lenta para virar, mas aguenta 4 batidas.',
    top: 215, accel: 0.8, handling: 0.78, brake: 0.9, grip: 1.0, lives: 4, off: 85, nUse: 0.9, nRec: 1.0, camY: 3.2,
    snd: { type: 'sawtooth', pitch: 0.65 }, r: [2, 2, 2, 3, 5] },
  { id: 'dune', name: 'Dune Runner', style: 'trail', color: 0xf26a21, rider: 0x23a455,
    desc: 'Trail de aventura. Domina chuva, neve e o fora de pista.',
    top: 225, accel: 1.0, handling: 1.1, brake: 1.0, grip: 1.35, lives: 3, off: 160, nUse: 1.0, nRec: 1.1, camY: 3.8,
    snd: { type: 'sawtooth', pitch: 0.9 }, r: [3, 3, 4, 5, 3] },
  { id: 'volt', name: 'Neon Volt', style: 'volt', color: 0x00d4ff, rider: 0x2a2f45,
    desc: 'Elétrica neon. Arrancada e controle incríveis, nitro recarrega rápido.',
    top: 205, accel: 1.45, handling: 1.25, brake: 1.05, grip: 1.0, lives: 2, off: 90, nUse: 0.9, nRec: 2.6, camY: 3.1,
    snd: { type: 'triangle', pitch: 1.6 }, r: [2, 5, 5, 3, 2] }
];

/* Seleção salva */
const SAVE_KEY = 'moto_racer_sel_v2';
function loadSel() {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    const bi = BIKES.findIndex(b => b.id === o.bike);
    return { bike: bi >= 0 ? bi : 0, colors: o.colors || {}, stage: clamp(o.stage | 0, 0, STAGES.length - 1) };
  } catch (err) {
    return { bike: 0, colors: {}, stage: 0 };
  }
}
let sel = loadSel();
let unlockedStage = 0;
try { unlockedStage = clamp(parseInt(localStorage.getItem('moto_unlocked') || '0', 10) || 0, 0, STAGES.length - 1); } catch (err) { /* ignora */ }
sel.stage = Math.min(sel.stage, unlockedStage);

const curBike = () => BIKES[sel.bike];
const curColor = () => {
  const c = sel.colors[curBike().id];
  return c !== undefined ? c : curBike().color;
};
function saveSel() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ bike: curBike().id, colors: sel.colors, stage: sel.stage })); } catch (err) { /* ignora */ }
}

/* ---------------------------------------------------------------------
   Estado do jogador
   --------------------------------------------------------------------- */
let playerMoto = null;
function buildPlayerMoto() {
  if (playerMoto) { scene.remove(playerMoto); disposeObj(playerMoto); }
  const b = curBike();
  playerMoto = makeMoto(curColor(), b.rider, b.style);
  scene.add(playerMoto);
}

const player = { x: 1.75 };
let speed = 0, steer = 0, vx = 0, nitro = 100, nitroOn = false;
let lives = 3, maxLives = 3, invuln = 0, shake = 0, bonus = 0, dist = 0;
let menuT = 0, garageT = 0, spawnTimer = 1.5, camFov = 68, offroad = false;
let startStage = 0, curStageIdx = 0;
let state = 'menu';
let hudTimer = 0;

const enemies = [];
buildPlayerMoto();

/* ---------------------------------------------------------------------
   Entrada
   --------------------------------------------------------------------- */
const keys = { up: false, down: false, left: false, right: false, nitro: false };
const keyMap = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'nitro', ShiftRight: 'nitro'
};
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;

  if (state === 'garage') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') cycleBike(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') cycleBike(1);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') cycleStage(1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') cycleStage(-1);
    else if (e.code === 'Enter' || e.code === 'Space') startGame();
    else if (e.code === 'Escape') backToMenu();
    else return;
    e.preventDefault();
    return;
  }

  if (keyMap[e.code]) { keys[keyMap[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyM') { muted = !muted; if (muted) engineSound(0, false, false); }
  if (e.code === 'Enter' && state === 'menu') openGarage();
});
window.addEventListener('keyup', e => {
  if (keyMap[e.code]) keys[keyMap[e.code]] = false;
});
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (state === 'play') togglePause();
});

/* Toque (celular): metade esquerda/direita da tela para virar, sempre acelerando */
canvas.addEventListener('touchstart', e => handleTouch(e), { passive: false });
canvas.addEventListener('touchmove', e => handleTouch(e), { passive: false });
canvas.addEventListener('touchend', () => { keys.left = keys.right = keys.up = keys.nitro = false; });
function handleTouch(e) {
  e.preventDefault();
  if (state !== 'play') return;
  const x = e.touches[0].clientX;
  keys.up = true;
  keys.left = x < window.innerWidth / 2;
  keys.right = !keys.left;
  keys.nitro = e.touches.length > 1;
}

/* ---------------------------------------------------------------------
   Áudio
   --------------------------------------------------------------------- */
let actx = null, osc, filt, gainNode, ambGain, muted = false;
function initAudio() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    osc = actx.createOscillator();
    osc.type = 'sawtooth';
    filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 700;
    gainNode = actx.createGain();
    gainNode.gain.value = 0;
    osc.connect(filt); filt.connect(gainNode); gainNode.connect(actx.destination);
    osc.start();

    // vento / chuva (ruído contínuo)
    const len = actx.sampleRate * 2;
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const ns = actx.createBufferSource();
    ns.buffer = buf; ns.loop = true;
    const bp = actx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.4;
    ambGain = actx.createGain();
    ambGain.gain.value = 0;
    ns.connect(bp); bp.connect(ambGain); ambGain.connect(actx.destination);
    ns.start();
  } catch (err) { actx = null; }
}
function applyBikeSound() {
  if (actx && osc) osc.type = curBike().snd.type;
}
function engineSound(spd, nit, on) {
  if (!actx) return;
  const t = actx.currentTime;
  const g = Math.min(4, Math.floor(spd / 55));
  const f = (70 + (spd - g * 55) * 2 + g * 20 + (nit ? 25 : 0)) * curBike().snd.pitch;
  osc.frequency.setTargetAtTime(f, t, 0.05);
  filt.frequency.setTargetAtTime(500 + spd * 4, t, 0.1);
  gainNode.gain.setTargetAtTime(muted || !on ? 0 : 0.07, t, 0.1);
  const amb = Math.min(0.12, 0.01 + spd / 310 * 0.03 + env.n.rain * 0.07 + env.n.snow * 0.015);
  ambGain.gain.setTargetAtTime(muted || !on ? 0 : amb, t, 0.2);
}
function noiseBurst(dur, vol, lp) {
  if (!actx || muted) return;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const src = actx.createBufferSource();
  const g = actx.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  if (lp) {
    const f = actx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lp;
    src.connect(f); f.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(actx.destination);
  src.start();
}
const crashSound = () => noiseBurst(0.45, 0.4);
function thunder() { setTimeout(() => noiseBurst(1.6, 0.6, 350), rand(250, 900)); }

/* ---------------------------------------------------------------------
   Ranking (API Python com fallback em localStorage)
   --------------------------------------------------------------------- */
async function getScores() {
  try {
    const r = await fetch('/api/scores');
    if (!r.ok) throw new Error('api');
    return await r.json();
  } catch (err) {
    try { return JSON.parse(localStorage.getItem('moto_scores') || '[]'); } catch (e) { return []; }
  }
}
async function postScore(entry) {
  try {
    const r = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!r.ok) throw new Error('api');
    return await r.json();
  } catch (err) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem('moto_scores') || '[]'); } catch (e) { list = []; }
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    list.splice(10);
    try { localStorage.setItem('moto_scores', JSON.stringify(list)); } catch (e) { /* ignora */ }
    return list;
  }
}
function renderRank(el, list) {
  el.textContent = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Ainda sem recordes. Seja o primeiro!';
    el.appendChild(li);
    return;
  }
  for (const s of list.slice(0, 10)) {
    const li = document.createElement('li');
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = s.name;
    if (s.bike) {
      const sm = document.createElement('small');
      sm.textContent = s.bike + ' · F' + (s.stage || 1);
      a.appendChild(sm);
    }
    b.textContent = s.score;
    li.append(a, b);
    el.appendChild(li);
  }
}
async function refreshMenuRank() { renderRank($('rankMenu'), await getScores()); }

/* ---------------------------------------------------------------------
   HUD
   --------------------------------------------------------------------- */
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}
function showBanner(num, name) {
  $('bannerNum').textContent = num;
  $('bannerName').textContent = name;
  const el = $('banner');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}
const stageOf = idx => STAGES[idx % STAGES.length];
function getScore() { return Math.floor(dist / 10) + bonus; }
function updateHud() {
  $('speed').textContent = Math.round(speed);
  $('score').textContent = getScore();
  $('dist').textContent = Math.floor(dist);
  $('lives').textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, maxLives - lives));
  const st = stageOf(curStageIdx);
  $('stageName').textContent = 'FASE ' + (curStageIdx + 1) + ' · ' + st.icon + ' ' + st.name.toUpperCase();
  $('stageFill').style.width = ((dist % STAGE_LEN) / STAGE_LEN * 100) + '%';
  const f = $('nitroFill');
  f.style.width = nitro + '%';
  f.classList.toggle('active', nitroOn);
}

/* ---------------------------------------------------------------------
   Inimigos
   --------------------------------------------------------------------- */
const CAR_COLORS = [0x2f7de1, 0xf2b01e, 0x23a455, 0xe8e8e8, 0x8a3ddb, 0xf26a21, 0x1b1b1b];
const RIVAL_STYLES = ['street', 'sport', 'trail', 'volt'];

function spawnEnemy() {
  const r = Math.random();
  const type = r < 0.55 ? 'car' : r < 0.85 ? 'moto' : 'truck';
  const lane = Math.floor(Math.random() * 4);
  const d = 330;
  const near = enemies.filter(e => Math.abs(e.d - d) < 50);
  if (near.some(e => e.lane === lane) || new Set(near.map(e => e.lane)).size >= 3) return;

  let mesh, v, w, l;
  if (type === 'car')   { mesh = makeCar(pick(CAR_COLORS)); v = rand(60, 110) / 3.6; w = 1.8; l = 3.8; }
  if (type === 'moto')  { mesh = makeMoto(pick(CAR_COLORS), pick(CAR_COLORS), pick(RIVAL_STYLES)); v = rand(90, 150) / 3.6; w = 0.7; l = 2.2; }
  if (type === 'truck') { mesh = makeTruck(pick([0xe8e8e8, 0x3a6fb0, 0xc23b2e])); v = rand(45, 70) / 3.6; w = 2.3; l = 6.6; }
  scene.add(mesh);
  enemies.push({ mesh, type, lane, x: LANES[lane], d, v, w, l, hit: false, passed: false, vx: 0 });
}

function clearEnemies() {
  for (const e of enemies) { scene.remove(e.mesh); disposeObj(e.mesh); }
  enemies.length = 0;
}

function updateEnemies(dt, active) {
  const v = speed / 3.6;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.d -= (v - e.v) * dt;

    if (e.hit) {
      e.x += e.vx * dt;
      e.mesh.rotation.y += dt * 5 * Math.sign(e.vx);
    } else {
      e.mesh.rotation.y = -Math.atan(curveSlope(e.d));
      if (e.mesh.userData.wheels) {
        for (const w of e.mesh.userData.wheels) w.rotation.x -= e.v * dt / 0.42;
      }
    }

    if (active && !e.hit && !e.passed && e.d < -e.l / 2 - 1.5 && speed > 60) {
      e.passed = true;
      bonus += 50;
      toast('ULTRAPASSAGEM +50');
    }

    e.mesh.position.set(e.x + curveX(e.d), 0, -e.d);

    if (e.d < -20 || e.d > 480 || Math.abs(e.x) > 45) {
      scene.remove(e.mesh);
      disposeObj(e.mesh);
      enemies.splice(i, 1);
    }
  }
}

/* ---------------------------------------------------------------------
   Atualização do mundo
   --------------------------------------------------------------------- */
function updateWorld(dt, v) {
  dist += v * dt;

  curveTimer -= dt;
  if (curveTimer <= 0) {
    curveTarget = pick([0, 0, 0.6, -0.6, 1.1, -1.1]);
    curveTimer = rand(5, 10);
  }
  curve += (curveTarget - curve) * Math.min(1, dt * 0.5);

  const off = dist % SPAN;
  for (let i = 0; i < SEG_N; i++) {
    const d = (((i * SEG_L - off) % SPAN) + SPAN) % SPAN - SEG_L * 2;
    const g = segs[i];
    g.position.set(curveX(d), 0, -d);
    g.rotation.y = -Math.atan(curveSlope(d));
  }

  for (const o of sideObjs) {
    o.d -= v * dt;
    if (o.d < -25) {
      o.d += 435;
      o.side = Math.random() < 0.5 ? -1 : 1;
      if (!o.isPole) o.off = rand(9.5, 45);
    }
    o.mesh.position.set(o.side * o.off + curveX(o.d), 0, -o.d);
    o.mesh.rotation.y = o.isPole && o.side > 0 ? PI : 0;
  }

  groundTex.offset.y += v * dt / 16;
}

function drawPlayer(dt) {
  const ud = playerMoto.userData;
  const g = effGrip();
  playerMoto.position.set(player.x, 0, 0);
  ud.lean.rotation.z = -steer * 0.5;
  playerMoto.rotation.y = -(vx / 11) * (0.12 + (1 - g) * 0.35);
  ud.lean.position.y = Math.sin(T * 45) * 0.012 * (speed / 100) * (offroad ? 5 : 1);
  for (const w of ud.wheels) w.rotation.x -= (speed / 3.6) * dt / 0.42;
  ud.flame.visible = nitroOn;
  if (nitroOn) ud.flame.scale.set(1, rand(0.7, 1.3), 1);
  playerMoto.visible = invuln <= 0 || Math.floor(T * 14) % 2 === 0;
}

function drawCamera(dt) {
  const sh = shake * 0.25;
  shake = Math.max(0, shake - dt * 2);
  camera.position.set(
    player.x * 0.75 + rand(-sh, sh),
    curBike().camY + rand(-sh, sh) * 0.5,
    7.4 - (nitroOn ? 0.7 : 0)
  );
  camera.lookAt(player.x * 0.55 + curveX(40) * 0.35, 1.4, -18);
  const targetFov = 66 + (speed / 310) * 16 + (nitroOn ? 7 : 0);
  camFov += (targetFov - camFov) * Math.min(1, dt * 3);
  camera.fov = camFov;
  camera.updateProjectionMatrix();
}

function drawGarage(dt) {
  const ud = playerMoto.userData;
  playerMoto.position.set(0, 0.12, 0);
  playerMoto.rotation.y = garageT * 0.6;
  ud.lean.rotation.z = 0;
  ud.lean.position.y = 0;
  ud.flame.visible = false;
  playerMoto.visible = true;

  camera.position.set(3.6, 2.5, 5.8);
  camera.lookAt(0, 0.55, 0);
  camFov += (48 - camFov) * Math.min(1, dt * 4);
  camera.fov = camFov;
  camera.updateProjectionMatrix();
}

/* ---------------------------------------------------------------------
   Lógica do jogo
   --------------------------------------------------------------------- */
function effGrip() {
  const sg = stageOf(curStageIdx).grip;
  return clamp(1 - (1 - sg) / curBike().grip, 0.3, 1);
}

function enterStage(idx, announce) {
  curStageIdx = idx;
  const st = stageOf(idx);
  setEnvTarget(st);
  const reached = Math.min(idx, STAGES.length - 1);
  if (reached > unlockedStage) {
    unlockedStage = reached;
    try { localStorage.setItem('moto_unlocked', String(unlockedStage)); } catch (err) { /* ignora */ }
  }
  if (announce) showBanner('FASE ' + (idx + 1), st.icon + ' ' + st.name.toUpperCase());
}

function crash(e) {
  lives--;
  speed *= 0.3;
  invuln = 2.2;
  shake = 1.2;
  e.hit = true;
  e.vx = (e.x >= player.x ? 1 : -1) * 12;
  crashSound();
  const f = $('flash');
  f.classList.add('on');
  setTimeout(() => f.classList.remove('on'), 80);
  toast(lives > 0 ? 'BATIDA!' : 'FIM DE JOGO');
  if (lives <= 0) gameOver();
}

function update(dt) {
  const B = curBike();
  const g = effGrip();

  offroad = Math.abs(player.x) > ROAD_W / 2 + 0.3;
  nitroOn = keys.nitro && nitro > 0 && speed > 30;
  if (nitroOn) nitro = Math.max(0, nitro - 32 * B.nUse * dt);
  else nitro = Math.min(100, nitro + 6 * B.nRec * dt);

  const maxS = offroad ? B.off : (nitroOn ? B.top + 65 : B.top);
  if (keys.up) speed += 62 * B.accel * (1 - speed / (maxS + 45)) * dt;
  else speed -= 12 * dt;
  if (nitroOn) speed += 90 * dt;
  if (keys.down) speed -= 140 * (0.55 + 0.45 * g) * B.brake * dt;
  if (speed > maxS) speed -= (offroad ? 160 : 50) * dt;
  speed = clamp(speed, 0, B.top + 75);

  // direção (com escorregada na chuva e na neve)
  const target = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
  steer += (target - steer) * Math.min(1, dt * 9);
  const gripSpd = clamp(0.35 + speed / 140, 0.35, 1);
  const wantVx = steer * 11 * gripSpd * B.handling;
  vx += (wantVx - vx) * Math.min(1, dt * 16 * g);
  player.x += vx * dt;
  player.x -= curve * (speed / 235) * 5.5 * (2 - g) * dt;   // força centrífuga
  player.x = clamp(player.x, -ROAD_W / 2 - 6, ROAD_W / 2 + 6);
  if (offroad && speed > 20) shake = Math.max(shake, B.off > 120 ? 0.12 : 0.3);

  updateWorld(dt, speed / 3.6);

  // progresso de fase
  const si = startStage + Math.floor(dist / STAGE_LEN);
  if (si !== curStageIdx) {
    enterStage(si, true);
    bonus += 500;
    if (lives < maxLives) { lives++; toast('FASE COMPLETA +500 · +1 VIDA'); }
    else toast('FASE COMPLETA +500');
  }

  // tráfego
  const lap = Math.floor(curStageIdx / STAGES.length);
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = rand(0.5, 1.2) * clamp(1.6 - dist / 6000, 0.55, 1.6) / (1 + lap * 0.25);
  }
  updateEnemies(dt, true);

  // colisão
  if (invuln > 0) invuln -= dt;
  else {
    for (const e of enemies) {
      if (e.hit) continue;
      if (Math.abs(e.d) < e.l / 2 + 1.1 && Math.abs(e.x - player.x) < e.w / 2 + 0.42) {
        crash(e);
        break;
      }
    }
  }

  drawPlayer(dt);
  drawCamera(dt);
  engineSound(speed, nitroOn, true);

  hudTimer -= dt;
  if (hudTimer <= 0) { updateHud(); hudTimer = 0.05; }
}

function resetGame() {
  clearEnemies();
  const B = curBike();
  maxLives = B.lives;
  lives = B.lives;
  speed = 40; steer = 0; vx = 0; nitro = 100; nitroOn = false;
  invuln = 0; shake = 0; bonus = 0; dist = 0;
  player.x = 1.75;
  curve = 0; curveTarget = 0; curveTimer = 7;
  spawnTimer = 1.5;
  startStage = sel.stage;
  enterStage(startStage, false);
}

function hideAllPanels() {
  for (const id of ['menu', 'over', 'pause', 'garage']) $(id).classList.add('hidden');
}

function startGame() {
  initAudio();
  applyBikeSound();
  saveSel();
  resetGame();
  hideAllPanels();
  $('hud').classList.remove('hidden');
  turntable.visible = false;
  state = 'play';
  updateHud();
  const st = stageOf(curStageIdx);
  showBanner('FASE ' + (curStageIdx + 1), st.icon + ' ' + st.name.toUpperCase());
}

async function gameOver() {
  state = 'over';
  $('hud').classList.add('hidden');
  engineSound(0, false, false);
  $('finalScore').textContent = getScore();
  $('finalDist').textContent = Math.floor(dist);
  $('finalStage').textContent = 'Fase ' + (curStageIdx + 1);
  $('saveBtn').disabled = false;
  let saved = null;
  try { saved = localStorage.getItem('moto_name'); } catch (err) { /* ignora */ }
  if (saved) $('nameInput').value = saved;
  $('over').classList.remove('hidden');
  renderRank($('rankOver'), await getScores());
}

function togglePause() {
  if (state === 'play') {
    state = 'pause';
    $('pause').classList.remove('hidden');
    engineSound(0, false, false);
  } else if (state === 'pause') {
    state = 'play';
    $('pause').classList.add('hidden');
  }
}

async function saveScore() {
  const name = ($('nameInput').value.trim() || 'Piloto').slice(0, 12);
  try { localStorage.setItem('moto_name', name); } catch (err) { /* ignora */ }
  $('saveBtn').disabled = true;
  const list = await postScore({ name, score: getScore(), bike: curBike().name, stage: curStageIdx + 1 });
  renderRank($('rankOver'), list);
}

/* ---------------------------------------------------------------------
   Garagem
   --------------------------------------------------------------------- */
const STAT_LABELS = ['VELOCIDADE', 'ACELERAÇÃO', 'CONTROLE', 'ADERÊNCIA', 'RESISTÊNCIA'];
const statRows = [];
const swatchEls = [];

function buildGarageUi() {
  const box = $('gStats');
  for (const label of STAT_LABELS) {
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = label;
    const pips = document.createElement('div');
    pips.className = 'pips';
    const list = [];
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('i');
      pips.appendChild(p);
      list.push(p);
    }
    row.append(name, pips);
    box.appendChild(row);
    statRows.push(list);
  }
  for (const c of COLORS) {
    const btn = document.createElement('button');
    btn.style.background = hex(c);
    btn.setAttribute('aria-label', 'Cor ' + hex(c));
    btn.addEventListener('click', () => {
      sel.colors[curBike().id] = c;
      buildPlayerMoto();
      refreshGarage();
      saveSel();
    });
    $('gColors').appendChild(btn);
    swatchEls.push({ el: btn, color: c });
  }
}

function refreshGarage() {
  const b = curBike();
  $('gName').textContent = b.name;
  $('gDesc').textContent = b.desc;
  statRows.forEach((pips, i) => pips.forEach((p, j) => p.classList.toggle('on', j < b.r[i])));
  const col = curColor();
  swatchEls.forEach(s => s.el.classList.toggle('active', s.color === col));
  const st = STAGES[sel.stage];
  $('sName').textContent = st.icon + ' ' + (sel.stage + 1) + '. ' + st.name;
  $('sPrev').disabled = sel.stage <= 0;
  $('sNext').disabled = sel.stage >= Math.min(unlockedStage, STAGES.length - 1);
  $('sHint').textContent = unlockedStage < STAGES.length - 1
    ? '🔒 Chegue à próxima fase em uma corrida para liberá-la.'
    : 'Todas as fases liberadas!';
}

function cycleBike(d) {
  sel.bike = (sel.bike + d + BIKES.length) % BIKES.length;
  buildPlayerMoto();
  refreshGarage();
  saveSel();
}
function cycleStage(d) {
  const ns = clamp(sel.stage + d, 0, Math.min(unlockedStage, STAGES.length - 1));
  if (ns === sel.stage) return;
  sel.stage = ns;
  setEnvTarget(STAGES[ns]);
  refreshGarage();
  saveSel();
}

function openGarage() {
  clearEnemies();
  state = 'garage';
  garageT = 0;
  speed = 0; steer = 0; vx = 0; nitroOn = false; offroad = false; invuln = 0;
  curve = 0; curveTarget = 0; curveTimer = 9999;
  engineSound(0, false, false);
  hideAllPanels();
  $('hud').classList.add('hidden');
  $('garage').classList.remove('hidden');
  turntable.visible = true;
  sel.stage = Math.min(sel.stage, unlockedStage);
  curStageIdx = sel.stage;
  setEnvTarget(STAGES[sel.stage]);
  refreshGarage();
}

function backToMenu() {
  state = 'menu';
  menuT = 0;
  hideAllPanels();
  $('menu').classList.remove('hidden');
  turntable.visible = false;
  curStageIdx = 0;
  curveTimer = 6;
  setEnvTarget(STAGES[0]);
  refreshMenuRank();
}

buildGarageUi();

$('startBtn').addEventListener('click', openGarage);
$('goBtn').addEventListener('click', startGame);
$('gBack').addEventListener('click', backToMenu);
$('gPrev').addEventListener('click', () => cycleBike(-1));
$('gNext').addEventListener('click', () => cycleBike(1));
$('sPrev').addEventListener('click', () => cycleStage(-1));
$('sNext').addEventListener('click', () => cycleStage(1));
$('retryBtn').addEventListener('click', startGame);
$('garageBtn').addEventListener('click', openGarage);
$('saveBtn').addEventListener('click', saveScore);
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveScore(); });

/* ---------------------------------------------------------------------
   Loop principal
   --------------------------------------------------------------------- */
function ambient(dt, v) {
  updateWeather(dt, v);
  updateEnv(dt);
  headlight.position.set(playerMoto.position.x, 1.4, -0.8);
  headlight.target.position.set(playerMoto.position.x * 0.9, 0, -32);
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state !== 'pause') T += dt;

  if (state === 'play') {
    update(dt);
    ambient(dt, speed / 3.6);
  } else if (state === 'menu') {
    menuT += dt;
    speed = 70;
    steer = Math.sin(menuT * 0.7) * 0.4;
    vx = Math.cos(menuT * 0.7) * 2.1;
    player.x = Math.sin(menuT * 0.7) * 3;
    offroad = false; nitroOn = false; invuln = 0;
    updateWorld(dt, speed / 3.6);
    drawPlayer(dt);
    drawCamera(dt);
    ambient(dt, speed / 3.6);
  } else if (state === 'garage') {
    garageT += dt;
    updateWorld(dt, 0);
    drawGarage(dt);
    ambient(dt, 0);
  } else if (state === 'over') {
    speed = Math.max(0, speed - 60 * dt);
    nitroOn = false;
    updateWorld(dt, speed / 3.6);
    updateEnemies(dt, false);
    drawPlayer(dt);
    drawCamera(dt);
    ambient(dt, speed / 3.6);
  }
  renderer.render(scene, camera);
}

refreshMenuRank();
applyEnv();
requestAnimationFrame(loop);

})();