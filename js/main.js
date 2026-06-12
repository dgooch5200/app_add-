/* ═══════════════════════════════════════════════════════════
   UNRIVAL — FIXTURE FILM 001 · "Concert Black"
   Three.js stage + GSAP master timeline · 152s seamless loop
   ═══════════════════════════════════════════════════════════ */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const BLUE = new THREE.Color(0x3f83f8);
const CYAN = new THREE.Color(0x6ee7f9);
const WHITE = new THREE.Color(0xdfe9ff);

/* ── scene timing (seconds, absolute) ─────────────────── */
const T = {
  intro: 0,
  fixture: 12,
  tap: 30,
  read: 48,
  edit: 68,
  write: 88,
  prep: 102,
  plot: 122,
  finale: 140,
  end: 152,
};

/* ═══════════════ RENDERER / SCENE ═════════════════════ */

const canvas = document.getElementById("gl");
// Perf knobs (URL-tunable for Pi/kiosk tuning):
//   ?aa=0   → disable MSAA (big win on fill-rate-bound GPUs like the Pi 4)
//   ?dpr=N  → force device-pixel-ratio / internal render scale (e.g. 0.75)
const _qp = new URLSearchParams(location.search);
const _AA = _qp.get("aa") !== "0";
const _DPR = parseFloat(_qp.get("dpr")) || Math.min(devicePixelRatio, 2);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: _AA });
renderer.setPixelRatio(_DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();

// ── retro-dusk sky — a subtle synthwave gradient instead of a flat color.
//    Stays dark so it never competes with the demo; just a hint of dusk. ──
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 8;
skyCanvas.height = 256;
{
  const x = skyCanvas.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#05060e"); // zenith — near black
  g.addColorStop(0.42, "#0b0a1e"); // deep indigo
  g.addColorStop(0.7, "#1d1233"); // violet
  g.addColorStop(0.86, "#341a3f"); // dusky magenta
  g.addColorStop(1.0, "#4a2145"); // muted rose at the horizon
  x.fillStyle = g;
  x.fillRect(0, 0, 8, 256);
}
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);

// studio environment so the metal fixture bodies pick up reflections —
// without this they crush to black (tradeshow screens need the lift)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 1.4, 10);
const camTarget = new THREE.Vector3(0, 1, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.55, 0.4);
bloom.enabled = false; // bloom OFF — composer skips this pass (strength tweens are inert)
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ═══════════════ LIGHTS ═══════════════════════════════ */

const hemi = new THREE.HemisphereLight(0x5a6f96, 0x161a24, 1.5);
scene.add(hemi);

const key = new THREE.SpotLight(0xbcd0ff, 0, 30, 0.6, 0.5, 1.2);
key.position.set(5, 7, 6);
scene.add(key, key.target);

const rim = new THREE.PointLight(0x3f83f8, 0, 25, 1.6);
rim.position.set(-5, 3, -5);
scene.add(rim);

const phoneLight = new THREE.PointLight(0x9db8ff, 0, 4, 2);
scene.add(phoneLight);

/* ═══════════════ STAGE ════════════════════════════════ */

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(60, 48),
  new THREE.MeshStandardMaterial({ color: 0x18202f, roughness: 0.85, metalness: 0.25, envMapIntensity: 0.4 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(60, 60, 0x3f86e0, 0x243a66); // neon-blue lines, retro nod
grid.material.transparent = true;
grid.material.opacity = 0.3;
grid.position.y = 0.002;
scene.add(grid);

// faint radial glow pool under the hero fixture
function radialTexture(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshBasicMaterial({
    map: radialTexture("rgba(63,131,248,0.16)", "rgba(63,131,248,0)"),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
);
pool.rotation.x = -Math.PI / 2;
pool.position.y = 0.01;
pool.material.opacity = 0;
scene.add(pool);

// ── distant synthwave sun, low on the horizon behind everything — warm/pink
//    glow with the classic scanline bands. Never fogged; kept subtle. ──
const sunCanvas = document.createElement("canvas");
sunCanvas.width = sunCanvas.height = 512;
{
  const x = sunCanvas.getContext("2d");
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0.0, "rgba(255,228,150,0.95)"); // warm core
  g.addColorStop(0.34, "rgba(255,150,120,0.85)");
  g.addColorStop(0.6, "rgba(255,86,150,0.55)"); // pink
  g.addColorStop(0.85, "rgba(150,44,130,0.12)");
  g.addColorStop(1.0, "rgba(150,44,130,0.0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  // erase horizontal bands across the lower half (gaps grow toward the bottom)
  x.globalCompositeOperation = "destination-out";
  x.fillStyle = "#000";
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    x.fillRect(0, 268 + t * t * 244, 512, 4 + i * 3);
  }
}
const sunTex = new THREE.CanvasTexture(sunCanvas);
sunTex.colorSpace = THREE.SRGBColorSpace;
const sun = new THREE.Mesh(
  new THREE.PlaneGeometry(62, 62),
  new THREE.MeshBasicMaterial({
    map: sunTex, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  })
);
sun.position.set(0, 9, -96);
scene.add(sun);

// distant brand mark — the square app icon floating deep upstage
const iconTex = new THREE.TextureLoader().load("assets/icon.png");
iconTex.colorSpace = THREE.SRGBColorSpace;
const brandIcon = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6),
  new THREE.MeshBasicMaterial({
    map: iconTex, transparent: true, opacity: 0,
    color: 0xffffff, depthWrite: false,
  })
);
brandIcon.position.set(0, 5.8, -34);
scene.add(brandIcon);

// real app screenshots wrap the stage on a wide arc — 16 planes from the 8
// captures placed by VIEWING ANGLE (bearing from stage center), not flat X.
// Even angular spacing → even on-screen spread in every camera, while radius
// and height still vary for depth. ±9° center corridor kept clear for the icon.
const SHOT_ASPECT = 1284 / 2778;
//                  left edge ⟵                    center gap                    ⟶ right edge
const SHOT_ANGLES = [-74, -63, -53, -43, -33, -24, -16, -9, 9, 16, 24, 33, 43, 53, 63, 74];
const SHOT_IMG    = [  0,   1,   2,   3,   4,   5,   6,  7, 3, 2,  1,  0,  7,  6,  5,  4]; // no twin adjacent
const SHOT_R      = [ 31,  40,  34,  43,  36,  42,  33, 38, 39, 33, 43, 35, 42, 34, 40, 30];
const SHOT_Y      = [6.6, 4.0, 7.4, 4.3, 5.7, 3.8, 6.4, 4.6, 4.4, 6.5, 3.9, 7.0, 4.2, 6.8, 4.1, 5.9];
const SHOT_H      = [4.7, 3.6, 5.1, 3.8, 4.5, 3.5, 4.9, 4.1, 4.0, 4.9, 3.6, 5.1, 3.8, 4.7, 3.6, 4.5];
const shotTexes = Array.from({ length: 8 }, (_, i) => {
  const tex = new THREE.TextureLoader().load(`assets/appshots/shot${i}.png`);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
});
const shotMats = [], SHOT_OPS = [];
const shots = SHOT_ANGLES.map((deg, i) => {
  const a = deg * Math.PI / 180, R = SHOT_R[i], h = SHOT_H[i];
  const x = R * Math.sin(a), z = -R * Math.cos(a), y = SHOT_Y[i];
  const op = +(0.85 - (R - 30) / 14 * 0.2).toFixed(2); // brighter; nearer cards a touch more
  SHOT_OPS.push(op);
  const m = new THREE.MeshBasicMaterial({
    map: shotTexes[SHOT_IMG[i]], transparent: true, opacity: 0,
    color: 0xffffff, depthWrite: false, fog: false, // solid cards (normal blend, true colors)
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * SHOT_ASPECT, h), m);
  mesh.position.set(x, y, z);
  mesh.lookAt(x * 0.25, y, 22); // turn gently toward front-of-house
  mesh.rotateZ((((i * 7) % 5) - 2) * 0.02); // tiny irregular roll
  mesh.userData.y0 = y;
  shotMats.push(m);
  scene.add(mesh);
  return mesh;
});

/* ═══════════════ BEAM SHADER ══════════════════════════ */

const beamVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float axial = pow(1.0 - vUv.y, 1.7);
    float soft  = smoothstep(0.0, 0.05, vUv.y);
    float edge  = pow(abs(dot(vNormal, vViewDir)), 1.35);
    float flick = 0.97 + 0.03 * sin(uTime * 21.0 + uSeed * 13.0) * sin(uTime * 6.7 + uSeed);
    float a = axial * soft * edge * uIntensity * flick;
    gl_FragColor = vec4(uColor, a);
  }
`;

function makeBeamMaterial(seed) {
  return new THREE.ShaderMaterial({
    vertexShader: beamVert,
    fragmentShader: beamFrag,
    uniforms: {
      uColor: { value: BLUE.clone() },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
      uSeed: { value: seed },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

// beam cone geometry: apex (narrow) at local origin, opens along +Y
function beamGeometry(len, radius) {
  const g = new THREE.CylinderGeometry(radius, 0.07, len, 28, 1, true);
  g.translate(0, len / 2, 0);
  return g;
}
const beamGeoOuter = beamGeometry(15, 1.7);
const beamGeoInner = beamGeometry(15, 0.55);

// Global beam-output ceiling — locked to the look at the 10-second mark
// (the soft single intro beam: outer 0.22, no inner core). Enforced as a hard
// clamp in the render loop so no light in any scene ever goes brighter.
const BEAM_CAP_OUTER = 0.22;
const BEAM_CAP_CORE = 0.0;

const glowTex = radialTexture("rgba(190,215,255,0.9)", "rgba(190,215,255,0)");

/* ═══════════════ FIXTURE DISPLAY (shared LCD texture) ═ */

const displayCanvas = document.createElement("canvas");
displayCanvas.width = 320;
displayCanvas.height = 105;
const dc = displayCanvas.getContext("2d");
const displayTex = new THREE.CanvasTexture(displayCanvas);
displayTex.colorSpace = THREE.SRGBColorSpace;

function drawNfcGlyph(ctx, x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.lineCap = "round";
  for (let k = 1; k <= 3; k++) {
    ctx.beginPath();
    ctx.arc(x, y, r * k * 0.33, -0.85, 0.85);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.14, y, Math.max(2, r * 0.12), 0, Math.PI * 2);
  ctx.fill();
}

function drawFixtureDisplay(addr, mode) {
  const w = 320, h = 105;
  dc.fillStyle = "#060a12";
  dc.fillRect(0, 0, w, h);
  dc.strokeStyle = "rgba(63,131,248,0.55)";
  dc.lineWidth = 3;
  dc.strokeRect(3, 3, w - 6, h - 6);
  // NFC glyph at the LEFT-MIDDLE of the screen — the tap point
  drawNfcGlyph(dc, 42, h / 2, 30, "#7FA8FA");
  dc.fillStyle = "#9DB8FA";
  dc.font = "600 21px monospace";
  dc.fillText("MAVERICK STORM 1 FLEX", 88, 38);
  dc.fillStyle = "#3F83F8";
  dc.font = "700 27px monospace";
  dc.fillText(`DMX ${addr}`, 88, 78);
  dc.fillStyle = "rgba(255,255,255,0.7)";
  dc.font = "600 19px monospace";
  dc.fillText(mode, 218, 78);
  displayTex.needsUpdate = true;
}
drawFixtureDisplay("001", "16-CH");

/* ═══════════════ FIXTURE BUILDER ══════════════════════ */

const matBody = new THREE.MeshStandardMaterial({ color: 0x252b36, metalness: 0.7, roughness: 0.42, envMapIntensity: 0.7 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x171b22, metalness: 0.6, roughness: 0.55, envMapIntensity: 0.5 });
const matCase = new THREE.MeshStandardMaterial({ color: 0x191d25, metalness: 0.4, roughness: 0.65, envMapIntensity: 0.45 });
const matTrim = new THREE.MeshStandardMaterial({ color: 0x4a5466, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.8 });

// real Maverick Storm 1 Flex geometry — the medium-detail set from the
// Rev 1.0.1 GDTF (models/gltf_low: clean low-poly that reads well flat-shaded)
let storm = null;
try {
  const gltfLoader = new GLTFLoader();
  const [b, y, h] = await Promise.all(
    ["Base", "Yoke", "Head"].map((p) => gltfLoader.loadAsync(`assets/storm1flex/${p}.glb`))
  );
  storm = { base: b.scene, yoke: y.scene, head: h.scene };
  // the GDTF meshes ship without normal attributes — flat shading derives
  // face normals in-shader, so lighting stays finite (and suits the low-poly cut)
  const matBodyFlat = matBody.clone();
  matBodyFlat.flatShading = true;
  Object.values(storm).forEach((s) =>
    s.traverse((o) => { if (o.isMesh) o.material = matBodyFlat; })
  );
} catch (e) {
  console.warn("Storm 1 Flex GLB failed to load — fixtures render without bodies", e);
}

const fixtures = [];

function makeFixture(x, z, seed) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // road case under the fixture (slimmer than the base depth, so the
  // display face and NFC tap point sit proud of the case edge)
  const cs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.22), matCase);
  cs.position.y = 0.23;
  g.add(cs);
  [0.18, -0.18].forEach((tx) => {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.46, 0.22), matTrim);
    trim.position.set(tx, 0.23, 0);
    g.add(trim);
  });

  const Y0 = 0.46; // top of case

  // GDTF pivots from the Storm 1 Flex file: yoke axis 0.0777 above the base
  // mount, head axis 0.2623 above that, beam exits 0.1726 from the head pivot
  const YOKE_Y = 0.0777, HEAD_Y = 0.2623, LENS_Z = 0.1726;

  // base — real GLB, flipped from GDTF hanging pose to standing
  const baseAl = new THREE.Group();
  baseAl.rotation.z = Math.PI;
  baseAl.position.y = Y0 + 0.002;
  if (storm) baseAl.add(storm.base.clone());
  g.add(baseAl);

  // base display — the real fixture's LCD; this is the NFC tap point
  // (NFC glyph sits at the left-middle of the screen)
  const dispMat = new THREE.MeshBasicMaterial({ map: displayTex, toneMapped: false, transparent: true, opacity: 0.0 });
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.066), dispMat);
  disp.position.set(0, Y0 + 0.039, 0.092);
  g.add(disp);

  // yoke (pan)
  const yoke = new THREE.Group();
  yoke.position.y = Y0 + YOKE_Y;
  g.add(yoke);
  const yokeAl = new THREE.Group();
  yokeAl.rotation.z = Math.PI;
  if (storm) yokeAl.add(storm.yoke.clone());
  yoke.add(yokeAl);

  // head (tilt) — aligned so rotation.x = 0 fires the beam along +Z
  const head = new THREE.Group();
  head.position.y = HEAD_Y;
  yoke.add(head);
  const headAl = new THREE.Group();
  headAl.rotation.x = -Math.PI / 2;
  if (storm) headAl.add(storm.head.clone());
  head.add(headAl);

  // lens (real beam radius from the GDTF: 0.055)
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x0a1020, toneMapped: false });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), lensMat);
  lens.position.z = LENS_Z + 0.004;
  head.add(lens);

  // beams (apex at lens, firing along head +Z)
  const beamMat = makeBeamMaterial(seed);
  const beamCoreMat = makeBeamMaterial(seed + 5);
  beamCoreMat.uniforms.uColor.value = WHITE.clone();
  const beamOuter = new THREE.Mesh(beamGeoOuter, beamMat);
  const beamInner = new THREE.Mesh(beamGeoInner, beamCoreMat);
  [beamOuter, beamInner].forEach((b) => {
    b.rotation.x = Math.PI / 2;
    b.position.z = LENS_Z + 0.01;
    b.renderOrder = 5;
    head.add(b);
  });

  scene.add(g);
  const fx = { group: g, yoke, head, beamMat, beamCoreMat, lensMat, dispMat };
  fixtures.push(fx);
  return fx;
}

// 9 fixtures in a prep line — hero is the centre unit
for (let i = 0; i < 9; i++) makeFixture((i - 4) * 2.1, 0, i * 3.7);
const hero = fixtures[4];

// aim helper: given a fixture and world target → {pan, tilt}
function aimAngles(fx, target) {
  const headWorld = new THREE.Vector3();
  fx.head.getWorldPosition(headWorld);
  const d = target.clone().sub(headWorld).normalize();
  return { pan: Math.atan2(d.x, d.z), tilt: -Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) };
}

/* ═══════════════ PHONE ════════════════════════════════ */

const phone = new THREE.Group();
const phoneBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.84, 0.04),
  new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.85, roughness: 0.3 })
);
phone.add(phoneBody);

const screenCanvas = document.createElement("canvas");
screenCanvas.width = 720; // 2× backing store — draw code stays in 360×760 space
screenCanvas.height = 1520;
const sc = screenCanvas.getContext("2d");
sc.scale(2, 2);
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;

/* ── phone UI — faithful recreation of the real UNRIVAL app ──
   Tokens, strings, and layout lifted from the app source:
   surfaces #1C1C1E / #0A0C10, hairline rgba(255,255,255,0.10),
   accent electricBlue rgb(63,131,248), header band
   #131325 → rgb(33,101,218) → #131325, tabs Home / Templates /
   Patch List / More, strings "Scan a Fixture", "Scanning for
   tag...", "Settings to Apply", "Waiting for Tap",
   "{n} Applied Fixtures". Sans-serif type like the RN app.    */

const UI = {
  page: "#1C1C1E", card: "#0A0C10", nested: "#0F1115",
  chip: "rgba(255,255,255,0.06)",
  accent: "rgb(63,131,248)", nfcBlue: "#1A4BFF",
  txt: "#FFFFFF", txt2: "rgba(255,255,255,0.85)", mute: "rgba(255,255,255,0.55)",
  hairline: "rgba(255,255,255,0.10)",
  spinner: "#FF9F0A", ok: "#4ADE80",
  logoGray: "#E6EDF7",
};
const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

function uiStatusBar() {
  sc.fillStyle = UI.txt2;
  sc.font = `600 14px ${SANS}`;
  sc.textAlign = "left";
  sc.fillText("9:41", 26, 30);
  sc.fillStyle = UI.mute;
  sc.fillRect(294, 20, 20, 10);
  sc.fillRect(316, 22, 2, 6);
  sc.fillRect(272, 20, 14, 10);
}

function uiHeaderBand(y = 40) {
  // 3-stop band exactly like the app: #131325 → darkened accent → #131325
  const g = sc.createLinearGradient(0, 0, 360, 0);
  g.addColorStop(0, "#131325");
  g.addColorStop(0.5, "rgb(33,101,218)");
  g.addColorStop(1, "#131325");
  sc.fillStyle = g;
  sc.fillRect(0, y, 360, 4);
}

function uiTabBar(active) {
  const h = 760, w = 360, top = h - 95;
  sc.fillStyle = UI.card;
  sc.fillRect(0, top, w, 95);
  sc.strokeStyle = UI.hairline;
  sc.lineWidth = 1;
  sc.beginPath(); sc.moveTo(0, top); sc.lineTo(w, top); sc.stroke();
  const tabs = ["Home", "Templates", "Patch List", "More"];
  tabs.forEach((t, i) => {
    const cx = 45 + i * 90;
    const on = t === active;
    sc.strokeStyle = on ? UI.accent : UI.mute;
    sc.fillStyle = on ? UI.accent : UI.mute;
    sc.lineWidth = on ? 3 : 1.5;
    const iy = top + 28;
    sc.beginPath();
    if (i === 0) { // home
      sc.moveTo(cx - 11, iy + 2); sc.lineTo(cx, iy - 9); sc.lineTo(cx + 11, iy + 2);
      sc.moveTo(cx - 8, iy); sc.lineTo(cx - 8, iy + 10); sc.lineTo(cx + 8, iy + 10); sc.lineTo(cx + 8, iy);
      sc.stroke();
    } else if (i === 1) { // bookmark
      sc.moveTo(cx - 8, iy - 9); sc.lineTo(cx + 8, iy - 9); sc.lineTo(cx + 8, iy + 11);
      sc.lineTo(cx, iy + 4); sc.lineTo(cx - 8, iy + 11); sc.closePath();
      sc.stroke();
    } else if (i === 2) { // patch list
      for (let r = 0; r < 3; r++) {
        sc.moveTo(cx - 9, iy - 7 + r * 8); sc.lineTo(cx + 9, iy - 7 + r * 8);
      }
      sc.stroke();
    } else { // ellipsis
      for (let d = -1; d <= 1; d++) {
        sc.moveTo(cx + d * 8 + 2, iy + 1);
        sc.arc(cx + d * 8, iy + 1, 2, 0, Math.PI * 2);
      }
      sc.fill();
    }
    sc.font = `400 12px ${SANS}`;
    sc.textAlign = "center";
    sc.fillText(t, cx, top + 62);
  });
  sc.textAlign = "left";
}

// sheet/modal header: × left, bold centered title (as in the app's modals)
function uiModalHeader(title) {
  sc.fillStyle = UI.txt;
  sc.font = `700 22px ${SANS}`;
  sc.fillText("×", 24, 78);
  sc.font = `700 18px ${SANS}`;
  sc.textAlign = "center";
  sc.fillText(title, 180, 77);
  sc.textAlign = "left";
  sc.strokeStyle = UI.hairline;
  sc.beginPath(); sc.moveTo(0, 96); sc.lineTo(360, 96); sc.stroke();
}

function uiSectionTitle(text, y) {
  sc.fillStyle = UI.mute;
  sc.font = `600 13px ${SANS}`;
  sc.fillText(text.toUpperCase(), 28, y);
}

// tag-editor style row: label left (white), value right (muted/accent)
function uiRow(label, value, y, valueColor = UI.mute) {
  sc.fillStyle = UI.txt2;
  sc.font = `400 15px ${SANS}`;
  sc.fillText(label, 28, y);
  sc.fillStyle = valueColor;
  sc.font = `500 15px ${SANS}`;
  sc.textAlign = "right";
  sc.fillText(value, 332, y);
  sc.textAlign = "left";
  sc.strokeStyle = "rgba(255,255,255,0.08)";
  sc.lineWidth = 1;
  sc.beginPath(); sc.moveTo(20, y + 14); sc.lineTo(340, y + 14); sc.stroke();
}

function uiCard(x, y, w, h, fill = UI.card) {
  sc.fillStyle = fill;
  sc.beginPath(); sc.roundRect(x, y, w, h, 10); sc.fill();
  sc.strokeStyle = UI.hairline;
  sc.lineWidth = 1;
  sc.stroke();
}

// the big bottom action button (ScanFixtureButton — height 120 in app)
function uiScanButton(label, enabled = true) {
  const y = 760 - 95 - 130;
  uiCard(20, y, 320, 110, enabled ? UI.nested : "#0a0a0c");
  drawNfcGlyph(sc, 120, y + 55, 22, enabled ? UI.txt2 : UI.mute);
  sc.fillStyle = enabled ? UI.txt : UI.mute;
  sc.font = `600 18px ${SANS}`;
  sc.fillText(label, 156, y + 62);
}

function uiSpinner(cx, cy, r) {
  sc.strokeStyle = UI.spinner;
  sc.lineWidth = 4;
  sc.lineCap = "round";
  sc.beginPath(); sc.arc(cx, cy, r, -0.4, Math.PI * 1.25); sc.stroke();
}

function drawPhoneScreen(state) {
  const w = 360, h = 760;
  sc.fillStyle = UI.page;
  sc.fillRect(0, 0, w, h);
  uiStatusBar();

  switch (state) {
    /* HOME — Chauvet logo header, "Scan a Fixture", "Explore Fixtures" */
    case "idle": {
      uiHeaderBand();
      sc.fillStyle = UI.logoGray;
      sc.font = `700 30px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("CHAUVET", w / 2, 122);
      sc.font = `500 11px ${SANS}`;
      sc.fillText("P R O F E S S I O N A L", w / 2, 142);
      sc.textAlign = "left";

      // Scan a Fixture (primary, height 200)
      uiCard(24, 186, 312, 200, UI.card);
      drawNfcGlyph(sc, w / 2, 262, 34, UI.txt2);
      sc.fillStyle = UI.txt;
      sc.font = `600 20px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("Scan a Fixture", w / 2, 348);

      // Explore Fixtures (gradient #0E1726 → #1B2332)
      const g2 = sc.createLinearGradient(24, 410, 336, 610);
      g2.addColorStop(0, "#0E1726");
      g2.addColorStop(1, "#1B2332");
      sc.fillStyle = g2;
      sc.beginPath(); sc.roundRect(24, 410, 312, 200, 10); sc.fill();
      sc.strokeStyle = UI.hairline; sc.stroke();
      sc.strokeStyle = UI.txt2; sc.lineWidth = 2.5;
      for (let r = 0; r < 3; r++) {
        sc.beginPath();
        sc.moveTo(w / 2 - 22, 472 + r * 12); sc.lineTo(w / 2 + 22, 472 + r * 12);
        sc.stroke();
      }
      sc.fillStyle = UI.txt;
      sc.font = `600 20px ${SANS}`;
      sc.fillText("Explore Fixtures", w / 2, 572);
      sc.textAlign = "left";
      uiTabBar("Home");
      break;
    }

    /* SCAN PREVIEW — "Scanning for tag..." with the orange spinner */
    case "read": {
      uiModalHeader("Scan Fixture");
      uiSpinner(w / 2, 300, 44);
      sc.fillStyle = UI.txt;
      sc.font = `600 19px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("Scanning for tag...", w / 2, 396);
      sc.fillStyle = UI.mute;
      sc.font = `400 14px ${SANS}`;
      sc.fillText("Hold phone near the fixture display", w / 2, 426);
      sc.textAlign = "left";
      uiScanButton("Waiting for Tap", false);
      break;
    }

    /* TAG EDITOR — Info + Diagnostics sections, real field labels */
    case "data": {
      uiModalHeader("Tag Editor");
      uiSectionTitle("Info", 132);
      uiCard(20, 146, 320, 196);
      uiRow("Manufacturer Label", "CHAUVET", 178);
      uiRow("Device Model Desc.", "MAV STORM 1 FLEX", 216);
      uiRow("Software Version Label", "1.4.2", 254);
      uiRow("Serial Number", "MAV22310847", 292);
      uiRow("RDM UID", "1A4F:00C8D2E1", 330);
      uiSectionTitle("Diagnostics", 386);
      uiCard(20, 400, 320, 120);
      uiRow("Device Hours", "1,247", 432);
      uiRow("Device Power Cycles", "318", 470);
      uiRow("Device Error Count", "0", 508, UI.ok);
      uiTabBar("Home");
      break;
    }

    /* TAG EDITOR — Main section, edited values in accent */
    case "edit": {
      uiModalHeader("Tag Editor");
      uiSectionTitle("Main", 132);
      uiCard(20, 146, 320, 158);
      uiRow("Device Unit Number", "001", 178);
      uiRow("Factory Reset", "Off", 216);
      uiRow("Personality", "22-CH Extended", 254, UI.accent);
      uiRow("Start Address", "042", 292, UI.accent);
      uiSectionTitle("Settings to Apply", 360);
      uiCard(20, 374, 320, 96, UI.nested);
      sc.fillStyle = UI.accent;
      sc.font = `500 14px ${SANS}`;
      sc.fillText("Start Address  →  042", 36, 408);
      sc.fillText("Personality  →  22-CH Extended", 36, 440);
      uiScanButton("Scan a Fixture", true);
      break;
    }

    /* SCAN PREVIEW — applying changes, "Waiting for Tap" */
    case "write": {
      uiModalHeader("Scan Fixture");
      uiSectionTitle("Settings to Apply", 132);
      uiCard(20, 146, 320, 96, UI.nested);
      sc.fillStyle = UI.accent;
      sc.font = `500 14px ${SANS}`;
      sc.fillText("Start Address  →  042", 36, 180);
      sc.fillText("Personality  →  22-CH Extended", 36, 212);
      uiSpinner(w / 2, 340, 40);
      sc.fillStyle = UI.txt;
      sc.font = `600 18px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("Writing settings...", w / 2, 424);
      sc.textAlign = "left";
      uiScanButton("Waiting for Tap", false);
      break;
    }

    /* completion — "1 Applied Fixture" */
    case "done": {
      uiModalHeader("Scan Fixture");
      sc.strokeStyle = UI.ok;
      sc.lineWidth = 6;
      sc.beginPath(); sc.arc(w / 2, 290, 52, 0, Math.PI * 2); sc.stroke();
      sc.beginPath();
      sc.moveTo(w / 2 - 22, 290); sc.lineTo(w / 2 - 5, 309); sc.lineTo(w / 2 + 26, 268);
      sc.stroke();
      sc.fillStyle = UI.txt;
      sc.font = `700 20px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("1 Applied Fixture", w / 2, 392);
      sc.fillStyle = UI.mute;
      sc.font = `400 14px ${SANS}`;
      sc.fillText("MAV22310847  ·  Start Address 042", w / 2, 422);
      sc.textAlign = "left";
      uiScanButton("Scan a Fixture", true);
      break;
    }

    /* AUTO PREP WIZARD — gradient header, title, "{n} Applied Fixtures" */
    case "prep": {
      const g3 = sc.createLinearGradient(0, 40, 0, 190);
      g3.addColorStop(0, "rgba(255,255,255,0.15)");
      g3.addColorStop(1, "#1C1C1E");
      sc.fillStyle = g3;
      sc.fillRect(0, 40, w, 150);
      sc.fillStyle = UI.txt;
      sc.font = `700 22px ${SANS}`;
      sc.fillText("×", 24, 84);
      sc.font = `700 24px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("FOH Wash A", w / 2, 86);
      sc.fillStyle = UI.mute;
      sc.font = `400 14px ${SANS}`;
      sc.fillText("Auto Prep", w / 2, 114);
      sc.textAlign = "left";

      uiSectionTitle("Template", 218);
      uiCard(20, 232, 320, 120);
      uiRow("Personality", "22-CH Extended", 264);
      uiRow("Start Address", "Auto-increment", 302);
      uiRow("Device Unit Number", "Auto-increment", 340);

      uiCard(20, 386, 320, 84, UI.nested);
      sc.fillStyle = UI.txt;
      sc.font = `700 24px ${SANS}`;
      sc.textAlign = "center";
      sc.fillText("8 Applied Fixtures", w / 2, 436);
      sc.textAlign = "left";

      uiScanButton("Waiting for Tap", false);
      break;
    }
  }
  screenTex.needsUpdate = true;
}

drawPhoneScreen("idle");

const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(0.36, 0.76),
  new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
);
screen.position.z = 0.022;
phone.add(screen);
const PHONE_SCALE = 0.62; // big enough to read the screen on a show-floor display
phone.position.set(4.5, 0.4, 2.6);
phone.rotation.set(-0.1, 0.55, 0);
phone.scale.setScalar(PHONE_SCALE);
phone.visible = true;
scene.add(phone);

/* phone screen state derived from timeline time (seek-safe) */
let phoneState = "idle";
function phoneStateFor(t) {
  if (t < T.tap + 6) return "idle";
  if (t < T.read + 2) return "read";
  if (t < T.edit + 2) return "data";
  if (t < T.write + 3) return "edit";
  if (t < T.write + 6.4) return "write";
  if (t < T.prep) return "done";
  if (t < T.plot) return "prep";
  return "idle";
}

/* ═══════════════ NFC RIPPLES ══════════════════════════ */

const TAG_WORLD = new THREE.Vector3(-0.074, 0.5, 0.1); // NFC glyph, left-middle of hero's base display
const ripples = [];
for (let i = 0; i < 3; i++) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(0.96, 1, 40),
    new THREE.MeshBasicMaterial({ color: 0x3f83f8, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })
  );
  r.position.copy(TAG_WORLD);
  r.position.z += 0.02;
  r.scale.setScalar(0.001);
  scene.add(r);
  ripples.push(r);
}

/* ═══════════════ DATA STREAM (tag ⇄ phone) ════════════ */

const PHONE_HOLD = new THREE.Vector3(-0.3, 0.5, 0.38);
const streamCurve = new THREE.QuadraticBezierCurve3(
  TAG_WORLD.clone(),
  new THREE.Vector3(-0.4, 0.78, 0.3),
  PHONE_HOLD.clone()
);
const STREAM_N = 90;
const streamGeo = new THREE.BufferGeometry();
streamGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(STREAM_N * 3), 3));
streamGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(STREAM_N * 3), 3));
const streamMat = new THREE.PointsMaterial({
  map: glowTex, size: 0.055, vertexColors: true, transparent: true,
  depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
});
const streamPts = new THREE.Points(streamGeo, streamMat);
streamPts.frustumCulled = false;
scene.add(streamPts);
const stream = { active: 0, dir: 1 }; // tweened by timeline

function updateStream(t) {
  const pos = streamGeo.attributes.position.array;
  const col = streamGeo.attributes.color.array;
  for (let i = 0; i < STREAM_N; i++) {
    let p = (t * 0.32 + i / STREAM_N) % 1;
    if (stream.dir < 0) p = 1 - p;
    const v = streamCurve.getPoint(p);
    // slight per-particle jitter, deterministic
    const j = 0.035;
    pos[i * 3] = v.x + Math.sin(i * 12.9898) * j;
    pos[i * 3 + 1] = v.y + Math.cos(i * 78.233) * j;
    pos[i * 3 + 2] = v.z + Math.sin(i * 39.425) * j;
    const env = Math.sin(p * Math.PI) * stream.active;
    col[i * 3] = 0.35 * env + 0.18 * env;
    col[i * 3 + 1] = 0.55 * env;
    col[i * 3 + 2] = 1.0 * env;
  }
  streamGeo.attributes.position.needsUpdate = true;
  streamGeo.attributes.color.needsUpdate = true;
}

/* ═══════════════ PLOT MARKERS (scene 7) ═══════════════ */

const plotRings = [];
const PLOT_COLORS = [BLUE, BLUE, BLUE, WHITE, WHITE, WHITE, CYAN, CYAN, CYAN];
fixtures.forEach((fx, i) => {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.62, 36),
    new THREE.MeshBasicMaterial({ color: PLOT_COLORS[i].clone(), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(fx.group.position.x, 0.015, fx.group.position.z);
  scene.add(ring);
  plotRings.push(ring);
});

/* ═══════════════ DOM REFS / HELPERS ═══════════════════ */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&<>/";
function scramble(tl, el, text, at, dur = 0.8) {
  const obj = { p: 0 };
  tl.fromTo(obj, { p: 0 }, {
    p: 1, duration: dur, ease: "none",
    onUpdate: () => {
      const n = Math.floor(obj.p * text.length);
      let s = text.slice(0, n);
      for (let i = n; i < text.length; i++) {
        s += text[i] === " " ? " " : SCRAMBLE_CHARS[(i * 7 + Math.floor(obj.p * 80)) % SCRAMBLE_CHARS.length];
      }
      el.textContent = s;
    },
  }, at);
}

// build the rolling digit strips (digits 0-9 twice for multi-spin)
["strip-h", "strip-t", "strip-o"].forEach((id) => {
  const el = document.getElementById(id);
  for (let k = 0; k < 20; k++) {
    const d = document.createElement("div");
    d.textContent = k % 10;
    el.appendChild(d);
  }
});

// prep cells
const prepCellsEl = $("#prep-cells");
for (let i = 0; i < 9; i++) prepCellsEl.appendChild(document.createElement("i"));
const prepCells = $$("#prep-cells i");

// prep log lines — Auto Prep shows the start address as each unit is scanned
const PREP_SERIALS = ["0848", "0849", "0850", "0851", "0852", "0853", "0854", "0855"];
const prepLogEl = $("#prep-log");
PREP_SERIALS.forEach((s, i) => {
  const addr = String(64 + i * 22).padStart(3, "0");
  const d = document.createElement("div");
  d.innerHTML = `MAV2231${s} &rarr; ADDR ${addr} &nbsp;<b>&#10003; 0.4s</b>`;
  prepLogEl.appendChild(d);
});

// OVATION E2 360° turntable (KeyShotXR frames pulled from the app's assets)
const SPIN_N = 18;
const spinFrames = [];
for (let i = 0; i < SPIN_N; i++) {
  const im = new Image();
  im.src = `assets/ovation360/f${i}.png`;
  spinFrames.push(im);
}
const spinCanvas = document.getElementById("spin360");
const spinCtx = spinCanvas.getContext("2d");
let lastSpinFrame = -1;
function drawSpinFrame(fr) {
  spinCtx.fillStyle = "#E9EDF3";
  spinCtx.beginPath();
  spinCtx.roundRect(0, 0, 300, 300, 10);
  spinCtx.fill();
  const im = spinFrames[fr];
  if (im.complete && im.naturalWidth) spinCtx.drawImage(im, 10, 10, 280, 280);
}

const chapterBtns = $$("#chapters button");
const progressFill = $("#progress-fill");
const timecodeEl = $("#timecode");

/* ═══════════════ MASTER TIMELINE ══════════════════════ */

const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut" } });
window.__tl = tl; // exposed for dev-tools verification

const camP = camera.position;

/* ---------- t=0 hard reset (runs every loop) ---------- */
tl.set(camP, { x: 0, y: 1.5, z: 11.5 }, 0);
tl.set(camTarget, { x: 0, y: 1.6, z: 0 }, 0);
tl.set(phone.position, { x: 4.5, y: 0.4, z: 2.6 }, 0);
tl.set(phone.rotation, { x: -0.1, y: 0.55, z: 0 }, 0);
tl.set(phone.scale, { x: PHONE_SCALE, y: PHONE_SCALE, z: PHONE_SCALE }, 0);
tl.set(stream, { active: 0, dir: 1 }, 0);
tl.set(key, { intensity: 0 }, 0);
tl.set(rim, { intensity: 0 }, 0);
tl.set(phoneLight, { intensity: 0 }, 0);
tl.set(pool.material, { opacity: 0 }, 0);
tl.set(grid.material, { opacity: 0.3 }, 0);
tl.set(bloom, { strength: 0.7 }, 0);
tl.set(".pchk", { autoAlpha: 0 }, 0);
tl.set(".nfcdot", { clearProps: "backgroundColor,boxShadow" }, 0);

// the distant app icon only lives in the middle chapters — never alongside
// the foreground wordmark (intro + finale)
tl.set(brandIcon.material, { opacity: 0 }, 0);
tl.to(brandIcon.material, { opacity: 1, duration: 2.5 }, T.fixture + 1);
tl.to(brandIcon.material, { opacity: 0, duration: 1.6 }, T.finale - 2.6);
// the retro sun rides the same envelope — atmosphere behind the demo body,
// cleared for the clean intro/finale wordmarks so it never washes the title
tl.set(sun.material, { opacity: 0 }, 0);
tl.to(sun.material, { opacity: 0.12, duration: 2.5 }, T.fixture + 1);
tl.to(sun.material, { opacity: 0, duration: 1.6 }, T.finale - 2.6);
shotMats.forEach((m) => tl.set(m, { opacity: 0 }, 0));
tl.to(shotMats, { opacity: 1, duration: 2.5, stagger: 0.11 }, T.fixture + 1.3);
// backdrop clears completely before the finale fan builds — keeps the end clean
tl.to(shotMats, { opacity: 0, duration: 1.2, stagger: 0.04 }, T.finale - 2.6);
fixtures.forEach((fx, i) => {
  tl.set(fx.beamMat.uniforms.uIntensity, { value: 0 }, 0);
  tl.set(fx.beamCoreMat.uniforms.uIntensity, { value: 0 }, 0);
  tl.set(fx.beamMat.uniforms.uColor.value, { r: BLUE.r, g: BLUE.g, b: BLUE.b }, 0);
  tl.set(fx.yoke.rotation, { y: 0 }, 0);
  tl.set(fx.head.rotation, { x: -0.3 }, 0);
  tl.set(fx.dispMat, { opacity: 0 }, 0);
  tl.set(plotRings[i].material, { opacity: 0 }, 0);
  tl.set(plotRings[i].scale, { x: 1, y: 1, z: 1 }, 0);
});

/* ════ SCENE 0 — INTRO (0–12s) ════ */
{
  const s = T.intro;
  // a lone silhouette beam sweeps behind the title
  tl.fromTo(hero.beamMat.uniforms.uIntensity, { value: 0 }, { value: 0.22, duration: 2.5, ease: "power2.in" }, s + 1);
  tl.fromTo(hero.head.rotation, { x: -1.9 }, { x: -1.1, duration: 9, ease: "sine.inOut" }, s + 1);
  tl.fromTo(hero.yoke.rotation, { y: -0.7 }, { y: 0.7, duration: 10, ease: "sine.inOut" }, s + 1);
  tl.to(hero.beamMat.uniforms.uIntensity, { value: 0, duration: 1.2 }, s + 10.3);

  tl.fromTo("#ch-intro", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, s + 1.5);
  tl.fromTo("#intro-kicker", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1 }, s + 1.8);
  tl.fromTo("#intro-logo",
    { autoAlpha: 0, scale: 0.92, y: 26 },
    { autoAlpha: 1, scale: 1, y: 0, duration: 1.6, ease: "expo.out" }, s + 3);
  tl.fromTo("#intro-sub", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, s + 4.6);
  tl.fromTo("#hint", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, s + 5);
  tl.to("#hint", { autoAlpha: 0, duration: 0.8 }, s + 9);
  tl.to("#ch-intro", { autoAlpha: 0, duration: 1, ease: "power2.in" }, s + 10.4);
  // slow push-in through the dark
  tl.to(camP, { z: 9.5, duration: 11, ease: "none" }, s);
}

/* ════ SCENE 1 — THE FIXTURE (12–30s) ════ */
{
  const s = T.fixture;
  tl.to(camP, { x: 3.6, y: 1.1, z: 4.8, duration: 5, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0, y: 0.7, z: 0, duration: 5, ease: "power3.inOut" }, s);
  tl.to(key, { intensity: 85, duration: 2.2, ease: "power2.out" }, s + 0.8);
  tl.to(rim, { intensity: 32, duration: 2.5 }, s + 1);
  tl.to(pool.material, { opacity: 1, duration: 3 }, s + 1);
  tl.fromTo(hero.dispMat, { opacity: 0 }, { opacity: 0.95, duration: 0.4, ease: "steps(3)" }, s + 2);

  // beam show-off — capped below full output so bloom doesn't flicker
  tl.fromTo(hero.beamMat.uniforms.uIntensity, { value: 0 }, { value: 0.6, duration: 0.5, ease: "power4.in" }, s + 4.5);
  tl.fromTo(hero.beamCoreMat.uniforms.uIntensity, { value: 0 }, { value: 0.24, duration: 0.5, ease: "power4.in" }, s + 4.5);
  tl.fromTo(hero.head.rotation, { x: -0.3 }, { x: -1.45, duration: 2.2, ease: "power3.inOut" }, s + 4.5);
  tl.to(hero.yoke.rotation, { y: -0.9, duration: 2.6, ease: "sine.inOut" }, s + 6.5);
  tl.to(hero.yoke.rotation, { y: 0.9, duration: 3.4, ease: "sine.inOut" }, s + 9.1);
  tl.to(hero.yoke.rotation, { y: 0, duration: 2.2, ease: "sine.inOut" }, s + 12.5);
  tl.to(hero.head.rotation, { x: -0.9, duration: 2.2, ease: "sine.inOut" }, s + 12.5);

  // slow orbit while it performs
  tl.to(camP, { x: -3.0, y: 1.0, z: 4.5, duration: 9, ease: "sine.inOut" }, s + 6);

  tl.fromTo("#ch-fixture", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 2.2);
  tl.fromTo("#ch-fixture .headline", { clipPath: "inset(0 0 100% 0)", y: 30 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1.2, ease: "expo.out" }, s + 2.4);
  tl.fromTo("#ch-fixture .body", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, s + 3.4);

  tl.set("#spec-ticks", { visibility: "visible" }, s + 5);
  tl.fromTo(".tick", { autoAlpha: 0, x: (i) => (i % 2 ? 30 : -30) }, { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.3 }, s + 5.2);
  tl.to(".tick", { autoAlpha: 0, duration: 0.6 }, s + 13.5);
  tl.set("#spec-ticks", { visibility: "hidden" }, s + 14.2);
  tl.to("#ch-fixture", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 14);

  // power down — back in the shop
  tl.to(hero.beamMat.uniforms.uIntensity, { value: 0, duration: 0.35, ease: "power4.out" }, s + 15.5);
  tl.to(hero.beamCoreMat.uniforms.uIntensity, { value: 0, duration: 0.35 }, s + 15.5);
  tl.to(hero.dispMat, { opacity: 0, duration: 0.3 }, s + 15.6);
  tl.to(hero.head.rotation, { x: -0.3, duration: 1.6 }, s + 15.8);
  tl.to(key, { intensity: 40, duration: 2 }, s + 15.5);
}

/* ════ SCENE 2 — TAP (30–48s) ════ */
{
  const s = T.tap;
  tl.to(camP, { x: 1.55, y: 0.72, z: 3.3, duration: 4.5, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: -0.08, y: 0.5, z: 0.15, duration: 4.5, ease: "power3.inOut" }, s);

  tl.fromTo("#ch-tap", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 1.5);
  tl.fromTo("#ch-tap .headline", { clipPath: "inset(0 0 100% 0)", y: 30 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1.1, ease: "expo.out" }, s + 1.7);
  tl.fromTo("#ch-tap .body", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, s + 2.7);

  // phone enters from screen-left and settles beside the base display
  tl.set(phone.position, { x: -3.2, y: 0.3, z: 1.3 }, s + 1.9);
  tl.set(phone.rotation, { x: -0.08, y: 1.5, z: 0.06 }, s + 1.9);
  tl.to(phone.position, { x: PHONE_HOLD.x, y: PHONE_HOLD.y, z: PHONE_HOLD.z, duration: 3.2, ease: "power3.inOut" }, s + 2);
  tl.to(phone.rotation, { x: -0.06, y: 1.02, z: 0, duration: 3.2, ease: "power3.inOut" }, s + 2);
  tl.to(phoneLight, { intensity: 1.1, duration: 1.5 }, s + 3);
  tl.set(phoneLight.position, { x: PHONE_HOLD.x, y: PHONE_HOLD.y, z: PHONE_HOLD.z + 0.2 }, s + 3);

  // NFC ripples at contact
  ripples.forEach((r, i) => {
    tl.fromTo(r.scale, { x: 0.03, y: 0.03, z: 0.03 }, { x: 0.22, y: 0.22, z: 0.22, duration: 1.4, ease: "power1.out", repeat: 4, repeatDelay: 0.25 }, s + 6 + i * 0.45);
    tl.fromTo(r.material, { opacity: 0.85 }, { opacity: 0, duration: 1.4, ease: "power1.out", repeat: 4, repeatDelay: 0.25 }, s + 6 + i * 0.45);
  });

  // read stream: tag → phone
  tl.set(stream, { dir: 1 }, s + 8);
  tl.fromTo(stream, { active: 0 }, { active: 1, duration: 0.8 }, s + 8);
  tl.to(stream, { active: 0, duration: 0.8 }, s + 15);

  tl.to("#ch-tap", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 15.8);
}

/* ════ SCENE 3 — READ (48–68s) ════ */
{
  const s = T.read;
  tl.to(camP, { x: -1.55, y: 0.8, z: 2.9, duration: 5, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0.3, y: 0.6, z: 0.3, duration: 5, ease: "power3.inOut" }, s);

  // the tech pulls the phone back to review what the tag returned
  tl.to(phone.position, { x: -0.66, y: 0.6, z: 0.98, duration: 2.5, ease: "power3.inOut" }, s + 1.2);
  tl.to(phone.rotation, { x: -0.13, y: -0.45, z: 0.02, duration: 2.5, ease: "power3.inOut" }, s + 1.2);
  tl.to(phoneLight.position, { x: -0.66, y: 0.6, z: 1.18, duration: 2.5 }, s + 1.2);

  tl.fromTo("#ch-read", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 0.8);
  tl.fromTo("#ch-read .headline", { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "expo.out" }, s + 1);

  // four NDEF record chips decode
  const chipLabels = { CO: "CONFIG", FI: "IDENTITY", LO: "LOGS", RE: "RENTAL" };
  $$("#record-chips .chip").forEach((chip, i) => {
    tl.fromTo(chip, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "back.out(2)" }, s + 2 + i * 0.35);
    scramble(tl, chip.querySelector(".chip-label"), chipLabels[chip.dataset.rec], s + 2.1 + i * 0.35, 0.7);
  });

  // identity card types itself out
  tl.fromTo("#identity-card", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, s + 4.2);
  scramble(tl, $("#id-model"), "MAVERICK STORM 1 FLEX", s + 4.8, 0.9);
  scramble(tl, $("#id-serial"), "MAV22310847", s + 5.3, 0.8);
  scramble(tl, $("#id-uid"), "1A4F:00C8D2E1", s + 5.8, 0.8);
  scramble(tl, $("#id-fw"), "V1.4.2", s + 6.3, 0.6);
  scramble(tl, $("#id-hours"), "1,247 H", s + 6.7, 0.6);
  scramble(tl, $("#id-status"), "OK  ✓", s + 7.1, 0.6);

  // gentle parallax drift while reading
  tl.to(camP, { x: -1.0, duration: 12, ease: "none" }, s + 5.5);

  tl.to("#ch-read", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 18.4);
}

/* ════ SCENE 4 — EDIT (68–88s) ════ */
{
  const s = T.edit;
  tl.to(camP, { x: -2.0, y: 0.85, z: 3.3, duration: 4, ease: "power3.inOut" }, s);

  tl.fromTo("#ch-edit", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 0.6);
  tl.fromTo("#ch-edit .headline", { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "expo.out" }, s + 0.8);

  // DMX address rolls 001 → 042
  tl.set("#strip-h", { yPercent: 0 }, s);       // 0
  tl.set("#strip-t", { yPercent: 0 }, s);       // 0
  tl.set("#strip-o", { yPercent: -5 }, s);      // 1
  tl.fromTo("#dmx-block", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, s + 1.6);
  tl.to("#strip-t", { yPercent: -70, duration: 1.9, ease: "expo.inOut" }, s + 3.2);  // → 4 (second pass)
  tl.to("#strip-o", { yPercent: -60, duration: 2.2, ease: "expo.inOut" }, s + 3.4);  // → 2 (second pass)
  tl.fromTo("#uni-fill", { left: "0.2%" }, { left: "8.2%", duration: 1.8, ease: "expo.inOut" }, s + 3.4);

  // personality slot-rolls to 22-CH EXTENDED
  tl.fromTo("#mode-card", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, s + 6.4);
  tl.fromTo("#mode-strip", { yPercent: 0 }, { yPercent: -66.667, duration: 1.4, ease: "back.inOut(1.2)" }, s + 7.6);
  scramble(tl, $("#mode-foot"), "CH 042 – 063", s + 9, 0.7);

  // RDM-style identify blink acknowledges the new address (display flashes)
  tl.fromTo(hero.dispMat, { opacity: 0 }, { opacity: 0.95, duration: 0.12, repeat: 5, yoyo: true, ease: "none" }, s + 11.5);
  tl.set(hero.dispMat, { opacity: 0 }, s + 13.2);

  tl.to("#ch-edit", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 18.4);
}

/* ════ SCENE 5 — WRITE (88–102s) ════ */
{
  const s = T.write;
  tl.to(camP, { x: 1.95, y: 0.8, z: 3.3, duration: 4, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0, y: 0.52, z: 0.15, duration: 4, ease: "power3.inOut" }, s);

  tl.fromTo("#ch-write", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 0.5);
  tl.fromTo("#ch-write .headline", { clipPath: "inset(0 0 100% 0)", y: 28 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "expo.out" }, s + 0.7);

  // second tap — the phone comes back to the tag to apply the settings
  tl.to(phone.position, { x: PHONE_HOLD.x, y: PHONE_HOLD.y, z: PHONE_HOLD.z, duration: 2.4, ease: "power3.inOut" }, s + 0.4);
  tl.to(phone.rotation, { x: -0.06, y: 1.02, z: 0, duration: 2.4, ease: "power3.inOut" }, s + 0.4);
  tl.to(phoneLight.position, { x: PHONE_HOLD.x, y: PHONE_HOLD.y, z: PHONE_HOLD.z + 0.2, duration: 2.4 }, s + 0.4);

  // write stream: phone → tag
  tl.set(stream, { dir: -1 }, s + 3);
  tl.fromTo(stream, { active: 0 }, { active: 1, duration: 0.5 }, s + 3);
  tl.to(stream, { active: 0, duration: 0.5 }, s + 5.6);

  // progress ring + check
  tl.fromTo("#write-ring", { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, s + 2.9);
  tl.fromTo("#ring-fg", { strokeDashoffset: 326.7 }, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut" }, s + 3.2);
  tl.fromTo("#ring-check", { strokeDashoffset: 80 }, { strokeDashoffset: 0, duration: 0.5, ease: "power3.out" }, s + 5.9);
  tl.fromTo("#write-stamp", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6 }, s + 6.3);

  // payoff: the fixture powers up and confirms
  tl.fromTo(hero.dispMat, { opacity: 0 }, { opacity: 0.95, duration: 0.3 }, s + 6.4);
  tl.fromTo(hero.beamMat.uniforms.uIntensity, { value: 0 }, { value: 0.6, duration: 0.4, ease: "power4.in" }, s + 7);
  tl.fromTo(hero.beamCoreMat.uniforms.uIntensity, { value: 0 }, { value: 0.22, duration: 0.4, ease: "power4.in" }, s + 7);
  tl.to(hero.head.rotation, { x: -1.5, duration: 1.6, ease: "power3.inOut" }, s + 7.1);
  // double identify-pulse
  tl.to(hero.beamMat.uniforms.uIntensity, { value: 0.25, duration: 0.16, repeat: 3, yoyo: true, ease: "none" }, s + 9);

  // phone exits while camera is busy — drops out of frame and scales away
  tl.to(phone.position, { x: 2.4, y: -1.2, z: 2.4, duration: 1.6, ease: "power3.in" }, s + 11.4);
  tl.to(phone.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3 }, s + 12.9);
  tl.to(phoneLight, { intensity: 0, duration: 1 }, s + 11.4);

  tl.to("#ch-write", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 12.6);
}

/* ════ SCENE 6 — AUTO-PREP (102–122s) ════ */
{
  const s = T.prep;
  tl.to(camP, { x: 0, y: 4.2, z: 23.5, duration: 5.5, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0, y: 1.5, z: 0, duration: 5.5, ease: "power3.inOut" }, s);
  tl.to(key, { intensity: 95, duration: 3 }, s + 1);
  tl.to(rim, { intensity: 42, duration: 3 }, s + 1);

  // hero settles to fleet level
  tl.to(hero.beamMat.uniforms.uIntensity, { value: 0.55, duration: 2 }, s + 1);
  tl.to(hero.beamCoreMat.uniforms.uIntensity, { value: 0.2, duration: 2 }, s + 1);

  tl.fromTo("#ch-prep", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 1);
  tl.fromTo("#ch-prep .headline", { clipPath: "inset(0 0 100% 0)", y: 28 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "expo.out" }, s + 1.2);
  tl.fromTo("#prep-meter", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8 }, s + 2);

  // hero is already done — cell 5 (index 4) lights first
  tl.set(prepCells[4], { className: "on" }, s + 2.4);
  const counter = { n: 1 };
  tl.set("#prep-n", { textContent: "1" }, s + 2.4);

  // each fixture in the line gets written + ignites
  const order = [3, 5, 2, 6, 1, 7, 0, 8]; // ripple outward from hero
  order.forEach((fi, k) => {
    const at = s + 3.6 + k * 1.55;
    const fx = fixtures[fi];
    const fan = (fi - 4) * 0.16;
    tl.fromTo(fx.dispMat, { opacity: 0 }, { opacity: 0.95, duration: 0.2 }, at);
    tl.fromTo(fx.beamMat.uniforms.uIntensity, { value: 0 }, { value: 0.55, duration: 0.3, ease: "power4.in" }, at + 0.25);
    tl.fromTo(fx.beamCoreMat.uniforms.uIntensity, { value: 0 }, { value: 0.2, duration: 0.3, ease: "power4.in" }, at + 0.25);
    tl.fromTo(fx.head.rotation, { x: -0.3 }, { x: -1.5, duration: 1.1, ease: "power3.inOut" }, at + 0.3);
    tl.fromTo(fx.yoke.rotation, { y: 0 }, { y: fan, duration: 1.1, ease: "power3.inOut" }, at + 0.3);
    tl.set(prepCells[fi], { className: "on" }, at + 0.35);
    tl.to(counter, {
      n: k + 2, duration: 0.01,
      onUpdate: () => { $("#prep-n").textContent = Math.round(counter.n); },
    }, at + 0.35);
    if (k < 8) {
      tl.fromTo(prepLogEl.children[k], { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.4 }, at + 0.4);
    }
  });

  // the full fan breathes once, together
  fixtures.forEach((fx, i) => {
    tl.to(fx.head.rotation, { x: -1.15, duration: 1.6, ease: "sine.inOut" }, s + 17.2 + i * 0.06);
  });

  tl.to("#prep-log div", { autoAlpha: 0, duration: 0.5 }, s + 18);
  tl.to("#ch-prep", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 18.6);
}

/* ════ SCENE 7 — PLOT (122–140s) ════ */
{
  const s = T.plot;
  tl.to(camP, { x: 0, y: 8.5, z: 20, duration: 6, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0, y: 2.6, z: -2, duration: 6, ease: "power3.inOut" }, s);
  tl.to(grid.material, { opacity: 0.5, duration: 3 }, s + 1);
  tl.to(bloom, { strength: 0.8, duration: 4 }, s + 2);

  tl.fromTo("#ch-plot", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, s + 1.2);
  tl.fromTo("#ch-plot .headline", { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "expo.out" }, s + 1.4);

  // import the patch — ChamSys CSV / QR / MVR chips, brief load, stamp
  tl.fromTo(".ichip", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.22, ease: "back.out(2)" }, s + 1.9);
  tl.fromTo("#import-spin", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, s + 2.9);
  tl.to("#import-spin", { autoAlpha: 0, duration: 0.25 }, s + 4.3);
  tl.fromTo("#import-stamp", { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.4 }, s + 4.4);

  // the list lands, then gets worked through — checks tick off one by one
  tl.fromTo("#patch-card", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, s + 4.7);
  tl.fromTo(".prow", { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12 }, s + 5);
  $$("#patch-card .prow").forEach((row, i) => {
    const at = s + 6.6 + i * 0.85;
    // the status icon goes green on patch (blue = NFC tap, white = manual check)
    tl.to(row.querySelector(".nfcdot"), { backgroundColor: "#4ADE80", boxShadow: "0 0 8px #4ADE80", duration: 0.25 }, at);
    tl.fromTo(row.querySelector(".pchk"), { autoAlpha: 0, scale: 1.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, at);
    // the matching unit identify-blinks its LCD as it's checked off
    if (fixtures[i]) {
      tl.to(fixtures[i].dispMat, { opacity: 0.15, duration: 0.1, repeat: 5, yoyo: true, ease: "none" }, at);
    }
  });

  // real fixture, real 360 — the library turntable from the app assets
  tl.fromTo("#fix360", { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: "expo.out" }, s + 3.4);

  // plot rings bloom under each unit; beams lean upstage and take their colours
  fixtures.forEach((fx, i) => {
    tl.fromTo(plotRings[i].material, { opacity: 0 }, { opacity: 0.75, duration: 0.5 }, s + 2 + i * 0.12);
    tl.fromTo(plotRings[i].scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(2)" }, s + 2 + i * 0.12);
    const c = PLOT_COLORS[i];
    tl.to(fx.beamMat.uniforms.uColor.value, { r: c.r, g: c.g, b: c.b, duration: 1.2 }, s + 2.2 + i * 0.12);
    tl.to(fx.beamMat.uniforms.uIntensity, { value: 0.5, duration: 1.2 }, s + 2.2 + i * 0.12);
    tl.to(fx.beamCoreMat.uniforms.uIntensity, { value: 0.16, duration: 1.2 }, s + 2.2 + i * 0.12);
    tl.to(fx.head.rotation, { x: -2.1, duration: 1.4, ease: "power3.inOut" }, s + 2.2 + i * 0.12);
    tl.to(fx.yoke.rotation, { y: 0, duration: 1.4 }, s + 2.2 + i * 0.12);
  });

  // a wave chase rolls across the rig — twice
  fixtures.forEach((fx, i) => {
    tl.to(fx.head.rotation, { x: -1.65, duration: 0.9, ease: "sine.inOut", repeat: 3, yoyo: true }, s + 6.5 + i * 0.22);
  });

  tl.to("#ch-plot", { autoAlpha: 0, duration: 0.8, ease: "power2.in" }, s + 16.4);
}

/* ════ SCENE 8 — FINALE (140–152s) ════ */
{
  const s = T.finale;
  tl.to(camP, { x: 0, y: 2.4, z: 16, duration: 5, ease: "power3.inOut" }, s);
  tl.to(camTarget, { x: 0, y: 3.6, z: 0, duration: 5, ease: "power3.inOut" }, s);
  tl.to(grid.material, { opacity: 0.22, duration: 3 }, s);

  // every beam converges above the stage — each aims just off the apex so
  // the crossing reads as a soft braid, not a blown-out needle point
  const APEX = new THREE.Vector3(0, 7.5, 0.5);
  fixtures.forEach((fx, i) => {
    const aim = APEX.clone();
    aim.x += ((i % 3) - 1) * 0.55;
    aim.y += (i % 2 ? 1 : -1) * 0.4;
    const { pan, tilt } = aimAngles(fx, aim);
    tl.to(fx.yoke.rotation, { y: pan, duration: 2.6, ease: "power3.inOut" }, s + 0.5 + i * 0.07);
    tl.to(fx.head.rotation, { x: tilt, duration: 2.6, ease: "power3.inOut" }, s + 0.5 + i * 0.07);
    tl.to(fx.beamMat.uniforms.uColor.value, { r: BLUE.r, g: BLUE.g, b: BLUE.b, duration: 2 }, s + 0.5);
    tl.to(plotRings[i].material, { opacity: 0, duration: 1.5 }, s + 0.5);
  });
  tl.to(bloom, { strength: 0.88, duration: 3, ease: "power2.in" }, s + 2);

  tl.fromTo("#ch-finale", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, s + 3.4);
  tl.fromTo("#finale-logo", { autoAlpha: 0, scale: 0.94, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.6, ease: "expo.out" }, s + 3.4);
  tl.fromTo("#finale-tag", { autoAlpha: 0, letterSpacing: "0.8em" }, { autoAlpha: 1, letterSpacing: "0.42em", duration: 1.6, ease: "power3.out" }, s + 4);
  tl.fromTo("#finale-credit", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, s + 5);

  // blackout — every beam dies together, UI fades, loop closes clean
  fixtures.forEach((fx) => {
    tl.to(fx.beamMat.uniforms.uIntensity, { value: 0, duration: 0.5, ease: "power4.out" }, s + 9.2);
    tl.to(fx.beamCoreMat.uniforms.uIntensity, { value: 0, duration: 0.5 }, s + 9.2);
    tl.to(fx.dispMat, { opacity: 0, duration: 0.5 }, s + 9.2);
  });
  tl.to(key, { intensity: 0, duration: 1.6 }, s + 9.2);
  tl.to(rim, { intensity: 0, duration: 1.6 }, s + 9.2);
  tl.to(pool.material, { opacity: 0, duration: 1.5 }, s + 9.2);
  tl.to(bloom, { strength: 0.7, duration: 1.5 }, s + 9.2);
  tl.to("#ch-finale", { autoAlpha: 0, duration: 1.4, ease: "power2.in" }, s + 10.2);

  // pad the timeline to exactly T.end
  tl.set({}, {}, T.end);
}

/* ═══════════════ RENDER LOOP ══════════════════════════ */

const clock = new THREE.Clock();
let elapsed = 0;

function chapterFor(t) {
  if (t < T.fixture) return null;
  if (t < T.tap) return "fixture";
  if (t < T.read) return "tap";
  if (t < T.edit) return "read";
  if (t < T.write) return "edit";
  if (t < T.prep) return "write";
  if (t < T.plot) return "prep";
  if (t < T.finale) return "plot";
  return null;
}
let liveChapter = "";
let dispState = "001";

/* ── optional on-screen FPS meter (?fps) — for Pi/kiosk perf checks ── */
const SHOW_FPS = new URLSearchParams(location.search).has("fps");
let _fpsEl = null, _fpsFrames = 0, _fpsT0 = performance.now();
if (SHOW_FPS) {
  _fpsEl = document.createElement("div");
  _fpsEl.style.cssText =
    "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:9999;" +
    "font:700 22px/1 monospace;color:#6ee7f9;background:rgba(0,0,0,.6);" +
    "padding:6px 12px;border-radius:6px;pointer-events:none";
  _fpsEl.textContent = "-- fps";
  document.body.appendChild(_fpsEl);
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // beam shader time + lens glow follows beam intensity
  fixtures.forEach((fx) => {
    fx.beamMat.uniforms.uTime.value = elapsed;
    fx.beamCoreMat.uniforms.uTime.value = elapsed;
    // HARD CEILING — no light ever exceeds its look at the 10s mark
    // (soft single beam: outer 0.22, no inner core). Clamping here, after the
    // timeline sets the uniforms, guarantees it for every scene incl. the finale.
    if (fx.beamMat.uniforms.uIntensity.value > BEAM_CAP_OUTER)
      fx.beamMat.uniforms.uIntensity.value = BEAM_CAP_OUTER;
    if (fx.beamCoreMat.uniforms.uIntensity.value > BEAM_CAP_CORE)
      fx.beamCoreMat.uniforms.uIntensity.value = BEAM_CAP_CORE;
    const k = fx.beamMat.uniforms.uIntensity.value;
    fx.lensMat.color.copy(fx.beamMat.uniforms.uColor.value).multiplyScalar(0.06 + k * 1.4);
  });

  if (stream.active > 0.001) updateStream(elapsed);
  else streamPts.visible = false;
  if (stream.active > 0.001) streamPts.visible = true;

  camera.lookAt(camTarget);

  // screen stays locked to the camera so the app UI is always readable
  phone.lookAt(camera.position);

  // upstage screenshots float on a slow swell
  shots.forEach((s, i) => {
    s.position.y = s.userData.y0 + Math.sin(elapsed * 0.25 + i * 1.7) * 0.18;
  });

  // DOM chrome driven by timeline state (seek-safe)
  const t = tl.time();
  progressFill.style.width = `${(t / T.end) * 100}%`;
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  const ff = String(Math.floor((t % 1) * 24)).padStart(2, "0");
  timecodeEl.textContent = `${mm}:${ss}:${ff}`;

  const ch = chapterFor(t);
  if (ch !== liveChapter) {
    liveChapter = ch;
    chapterBtns.forEach((b) => b.classList.toggle("live", b.dataset.t === ch));
  }

  const ps = phoneStateFor(t);
  if (ps !== phoneState) {
    phoneState = ps;
    drawPhoneScreen(ps);
  }

  // OVATION 360 turntable spins while the patch section is up (seek-safe)
  if (t > T.plot && t < T.finale) {
    const fr = Math.floor((t - T.plot) * 2.4) % SPIN_N;
    if (fr !== lastSpinFrame) {
      lastSpinFrame = fr;
      drawSpinFrame(fr);
    }
  }

  // fixture LCD shows the new config once the write lands
  const ds = t > T.write + 5 && t < T.end - 2 ? "042" : "001";
  if (ds !== dispState) {
    dispState = ds;
    drawFixtureDisplay(ds, ds === "042" ? "22-CH" : "16-CH");
  }

  if (SHOW_FPS) {
    _fpsFrames++;
    const now = performance.now();
    if (now - _fpsT0 >= 500) {
      _fpsEl.textContent = Math.round((_fpsFrames * 1000) / (now - _fpsT0)) + " fps";
      _fpsFrames = 0; _fpsT0 = now;
    }
  }

  // Bloom is disabled, so skip the EffectComposer's HalfFloat render target +
  // OutputPass blit (heavy on the Pi 4 GPU) and render straight to screen —
  // the renderer applies the same ACES tone mapping + sRGB output. If bloom is
  // ever re-enabled, fall back to the composer so the pass chain runs.
  if (bloom.enabled) composer.render();
  else renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
window.__frame = frame; // manual tick for dev-tools verification in hidden windows
window.__dev = { scene, camera, renderer, composer, fixtures, THREE };

/* ═══════════════ INTERACTION ══════════════════════════ */

// Kiosk mode (?kiosk): hide all dev chrome + disable click/key interaction so
// the Pi installation plays as a clean, untouchable loop. Dev build is unaffected.
const KIOSK = new URLSearchParams(location.search).has("kiosk");
if (KIOSK) document.documentElement.classList.add("kiosk");

if (!KIOSK) {
  chapterBtns.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      tl.seek(T[b.dataset.t], false); // fire callbacks so scrambled text settles
      tl.play();
      gsap.to("#paused-badge", { autoAlpha: 0, duration: 0.2 });
    });
  });

  document.body.addEventListener("click", () => {
    if (tl.paused()) {
      tl.play();
      gsap.to("#paused-badge", { autoAlpha: 0, duration: 0.25 });
    } else {
      tl.pause();
      gsap.to("#paused-badge", { autoAlpha: 1, duration: 0.25 });
    }
  });

  addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      document.body.click();
    }
  });
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
