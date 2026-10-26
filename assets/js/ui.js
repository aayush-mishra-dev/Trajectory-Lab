// ===================================================================
//  The app shell (menu, saving, toasts) and the Simulator page.
//  Everything runs in the browser, so nothing reloads when you change
//  a setting.
// ===================================================================

const STORE_KEY = "trajectory-lab-v4";   // v4: everything starts in ideal conditions

// gravity (m/s²) and air density (kg/m³) for each world
const PLANETS = {
  Earth: { g: 9.81, rho: 1.225, note: "Sea-level air." },
  Moon: { g: 1.62, rho: 0, note: "No air at all, so air resistance and wind do nothing." },
  Mars: { g: 3.71, rho: 0.02, note: "Very thin air: about 1/60 of Earth's." },
  Jupiter: { g: 24.79, rho: 0.16, note: "Gravity at the cloud tops; Jupiter has no solid surface." },
  Custom: null,
};
// name: [mass kg, drag coefficient, diameter cm]
const OBJECTS = {
  Baseball: [0.145, 0.35, 7.4], "Golf ball": [0.046, 0.25, 4.3], Football: [0.43, 0.25, 22],
  Basketball: [0.62, 0.47, 24], Cannonball: [5, 0.47, 12], "Shot put": [7.26, 0.47, 12],
  "Ping-pong": [0.0027, 0.5, 4], Feather: [0.003, 1.3, 6], Custom: null,
};
const MODES = { speed: "Speed & angle", comp: "Components", force: "Force" };

// one-tap starting points
const PRESETS = {
  football: { name: "Football kick", set: { mode: "speed", speed: 24, angle: 38, height: 0, incline: 0, azimuth: 0, object: "Football", planet: "Earth", drag: false, wind: false, bounce: false } },
  basketball: { name: "Basketball shot", set: { mode: "speed", speed: 7.6, angle: 52, height: 2, incline: 0, azimuth: 0, object: "Basketball", planet: "Earth", drag: false, wind: false, bounce: false } },
  golf: { name: "Golf drive", set: { mode: "speed", speed: 70, angle: 12, height: 0, incline: 0, azimuth: 0, object: "Golf ball", planet: "Earth", drag: false, wind: false, bounce: false } },
  cannon: { name: "Cannon", set: { mode: "speed", speed: 120, angle: 45, height: 0, incline: 0, azimuth: 0, object: "Cannonball", planet: "Earth", drag: false, wind: false, bounce: false } },
  cliff: { name: "Off a cliff", set: { mode: "speed", speed: 15, angle: 0, height: 50, incline: 0, azimuth: 0, object: "Baseball", planet: "Earth", drag: false, wind: false, bounce: false } },
  hill: { name: "Up a hill", set: { mode: "speed", speed: 25, angle: 50, height: 0, incline: 20, azimuth: 0, object: "Baseball", planet: "Earth", drag: false, wind: false, bounce: false } },
  moon: { name: "On the Moon", set: { mode: "speed", speed: 15, angle: 45, height: 0, incline: 0, azimuth: 0, object: "Golf ball", planet: "Moon", drag: false, wind: false, bounce: false } },
  pingpong: { name: "Ping-pong vs air", set: { mode: "speed", speed: 20, angle: 35, height: 0, incline: 0, azimuth: 0, object: "Ping-pong", planet: "Earth", drag: true, wind: false, bounce: false, show: { vacuum: true } } },
  galileo: { name: "Galileo's 45°", set: { mode: "speed", speed: 20, angle: 45, height: 0, incline: 0, azimuth: 0, object: "Cannonball", planet: "Earth", drag: false, wind: false, bounce: false } },
  apollo: { name: "Hammer & feather", set: { mode: "speed", speed: 0, angle: 0, height: 1.6, incline: 0, azimuth: 0, object: "Feather", planet: "Moon", drag: false, wind: false, bounce: false } },
};

const DEFAULTS = {
  mode: "speed", speed: 25, angle: 45, vx: 17.7, vy: 17.7, force: 360, ctime: 10,
  height: 0, incline: 0, azimuth: 0,
  planet: "Earth", g: 9.81, rho: 1.225, object: "Baseball", mass: 0.145, cd: 0.35, diam: 7.4,
  drag: false, wind: false, windSpeed: 5, windDir: 180, bounce: false, restitution: 0.6,
  show: { hmax: true, range: true, vmax: false, vmin: false, vectors: true, pinned: true, vacuum: false, dots: true },
  view: "2D", chart: "height", page: "sim", playback: 1, pinned: [], guide: true,
  open: { launch: true, start: false, world: false, air: false, bounce: false, show: false },
};

// slider definitions: [label, min, max, step, unit, decimals]
const SLIDERS = {
  speed: ["Speed", 0, 150, 0.5, "m/s", 1],
  angle: ["Launch angle", -90, 90, 0.5, "°", 1],
  vx: ["Horizontal speed vₓ", 0, 150, 0.5, "m/s", 1],
  vy: ["Vertical speed vᵧ", -150, 150, 0.5, "m/s", 1],
  force: ["Force", 0, 10000, 5, "N", 0],
  ctime: ["Contact time", 1, 200, 1, "ms", 0],
  height: ["Launch height", 0, 200, 0.5, "m", 1],
  incline: ["Ground slope", -40, 40, 1, "°", 0],
  azimuth: ["Aim sideways", -60, 60, 1, "°", 0],
  g: ["Gravity", 0.5, 30, 0.01, "m/s²", 2],
  rho: ["Air density", 0, 3, 0.005, "kg/m³", 3],
  mass: ["Mass", 0.001, 20, 0.001, "kg", 3],
  cd: ["Drag coefficient", 0, 1.5, 0.01, "", 2],
  diam: ["Diameter", 1, 50, 0.5, "cm", 1],
  windSpeed: ["Wind speed", 0, 30, 0.5, "m/s", 1],
  windDir: ["Wind direction", 0, 355, 5, "°", 0],
  restitution: ["Bounciness", 0, 1, 0.05, "", 2],
};

const ICON = {
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg>`,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r1 = (v) => Math.round(v * 10) / 10;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// A slider with a box you can type into, used on every page.
// The slider covers the everyday range; you can TYPE values beyond it (up to the limits passed
// to bindSliders), and the slider stretches to fit.
function sliderBox(key, value, [label, min, max, step, unit, dec], extra = "") {
  const lo = Math.min(min, +value), hi = Math.max(max, +value);
  return `<div class="ctl"><div class="ctl-top"><label>${label}${extra}</label>
    <span class="numwrap"><button class="nudge" data-nudge="${key}" data-dir="-1" aria-label="Decrease">−</button><span class="num"><input type="number" inputmode="decimal" data-num="${key}" value="${(+value).toFixed(dec)}"
      step="${step}" aria-label="${label}">${unit ? `<span class="unit">${unit}</span>` : ""}</span><button class="nudge" data-nudge="${key}" data-dir="1" aria-label="Increase">+</button></span></div>
    <input type="range" data-key="${key}" min="${lo}" max="${hi}" step="${step}" value="${value}" aria-label="${label}"></div>`;
}

// Keeps a slider and its number box in step. onSet(key, value) is called with the new value.
// limits[key] = [lowest, highest, reason] is how far typing may go; without it, the slider's range.
function bindSliders(container, defs, onSet, limits = {}) {
  const range = (key) => { const d = defs[key], l = limits[key]; return l ? [l[0], l[1], l[2]] : [d[1], d[2], ""]; };
  const fmt = (v, dec) => (+v).toFixed(dec);
  function note(el, text) {
    const ctl = el.closest(".ctl"); if (!ctl) return;
    let n = ctl.querySelector(".clamp-note");
    if (!n) { n = document.createElement("div"); n.className = "clamp-note"; ctl.appendChild(n); }
    n.textContent = text; clearTimeout(n._t); n._t = setTimeout(() => n.remove(), 3500);
  }
  // stretch the slider when a typed value goes past its ends (and shrink back when it returns)
  function fitSlider(r, key, v) {
    const [, min, max] = defs[key];
    r.min = Math.min(min, v); r.max = Math.max(max, v); r.value = v; setPct(r);
  }
  container.addEventListener("input", (e) => {
    const el = e.target, key = el.dataset.key || el.dataset.num;
    if (!key || !defs[key]) return;
    const dec = defs[key][5];
    if (el.type === "range") {
      const v = parseFloat(el.value);
      const box = container.querySelector(`[data-num="${key}"]`);
      if (box) box.value = fmt(v, dec);
      setPct(el); onSet(key, v);
    } else {
      const v = parseFloat(el.value);
      if (!isFinite(v)) return;            // half-typed: wait
      const [lo, hi] = range(key), c = clamp(v, lo, hi);
      const r = container.querySelector(`input[type=range][data-key="${key}"]`);
      if (r) fitSlider(r, key, c);
      onSet(key, c);
    }
  });
  container.addEventListener("change", (e) => {
    const el = e.target, key = el.dataset.num;
    if (!key || !defs[key]) return;
    const dec = defs[key][5], unit = defs[key][4], [lo, hi, why] = range(key);
    let v = parseFloat(el.value);
    if (!isFinite(v)) v = parseFloat(container.querySelector(`input[type=range][data-key="${key}"]`)?.value || lo);
    const c = clamp(v, lo, hi);
    el.value = fmt(c, dec);
    if (c !== v) {
      el.classList.add("clamped"); setTimeout(() => el.classList.remove("clamped"), 900);
      note(el, `${v > hi ? "Highest" : "Lowest"} is ${fmt(v > hi ? hi : lo, dec)}${unit ? " " + unit : ""}${why ? `: ${why}` : "."}`);
    }
  });
  container.addEventListener("focusin", (e) => { if (e.target.dataset.num) e.target.select(); });
  container.addEventListener("click", (e) => {
    const b = e.target.closest("[data-nudge]"); if (!b) return;
    const key = b.dataset.nudge, [, , , step, , dec] = defs[key], [lo, hi] = range(key);
    const r = container.querySelector(`input[type=range][data-key="${key}"]`);
    const v = clamp(Math.round((parseFloat(r.value) + step * +b.dataset.dir) / step) * step, lo, hi);
    fitSlider(r, key, v);
    const box = container.querySelector(`[data-num="${key}"]`); if (box) box.value = fmt(v, dec);
    onSet(key, v);
  });
}

// How far you can type past each simulator slider
const SIM_LIMITS = {
  speed: [0, 3000, "that's already about 9 times the speed of sound"], vx: [0, 3000, "that's already about 9 times the speed of sound"],
  vy: [-3000, 3000, "that's already about 9 times the speed of sound"],
  angle: [-90, 90, "angles are measured from flat (0°) to straight up (90°)"],
  force: [0, 1e6, ""], ctime: [1, 5000, ""], height: [0, 1e5, "100 km up is where space begins"],
  incline: [-80, 80, "any steeper and it's a wall, not a slope"], azimuth: [-90, 90, "past 90° you'd be throwing backwards"],
  g: [0.01, 300, ""], rho: [0, 100, ""], mass: [0.0001, 1e5, ""], cd: [0, 5, ""], diam: [0.1, 1000, ""],
  windSpeed: [0, 150, "that's already a strong hurricane"], windDir: [0, 359, "directions go round from 0° to 359°"],
  restitution: [0, 1, "above 1 the ball would gain energy from nowhere"],
};

export default function (component) {
  const root = component.parentElement;
  if (root.__trajectoryLab) return;  // already running
  root.__trajectoryLab = true;
  bindFunFacts(root);

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  // ---------- saving ----------
  let S;
  try { S = { ...structuredClone(DEFAULTS), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; }
  catch { S = structuredClone(DEFAULTS); }
  S.show = { ...DEFAULTS.show, ...S.show };
  S.open = { ...DEFAULTS.open, ...S.open };
  S.windDir = ((Math.round(S.windDir / 5) * 5) % 360 + 360) % 360;   // older saves used −180…180
  if (!S.drag) S.wind = false;
  const save = debounce(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch {} }, 300);
  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem("trajectory-lab-" + key)); return v ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem("trajectory-lab-" + key, JSON.stringify(value)); } catch {} },
  };

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.innerHTML = msg; el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  // ---------- simulator state ----------
  const cam = { ...CAM_DEFAULT };
  let p, tr, vac = null, cmp = {}, pinned = [], sweepCache = null, bestCache = null;
  let t = 0, playing = false, lastFrame = 0, frameQueued = false;

  const planet = () => (S.planet === "Custom" ? { g: S.g, rho: S.rho } : PLANETS[S.planet]);
  const mass = () => (S.object === "Custom" ? S.mass : OBJECTS[S.object][0]);
  function launch() {
    if (S.mode === "comp") return [Math.hypot(S.vx, S.vy), Math.atan2(S.vy, S.vx) / RAD];
    if (S.mode === "force") return [S.force * S.ctime / 1000 / mass(), S.angle];
    return [S.speed, S.angle];
  }
  function params() {
    const [speed, angle] = launch();
    const obj = S.object === "Custom" ? [S.mass, S.cd, S.diam] : OBJECTS[S.object];
    const w = planet();
    return {
      speed, angle, azimuth: S.azimuth, height: S.height, incline: S.incline, g: w.g, rho: w.rho,
      mass: obj[0], cd: obj[1], diameter: obj[2] / 100,
      drag: S.drag && w.rho > 0, wind: S.wind && S.drag && w.rho > 0,
      windSpeed: S.windSpeed, windDir: S.windDir, bounce: S.bounce, restitution: S.restitution,
    };
  }

  function recompute() {
    p = params();
    tr = simulate(p);
    vac = S.show.vacuum && p.drag ? simulate({ ...p, drag: false, wind: false }) : null;
    // for the Air section: how far it would go with no air, and with air but no wind
    cmp = {
      ideal: p.drag ? simulate({ ...p, drag: false, wind: false }, 500) : null,
      calm: p.wind ? simulate({ ...p, wind: false }, 500) : null,
    };
    sweepCache = bestCache = null;
    t = 0; playing = false;
    updateStats();
    updateLaunchSummary(); updateSummaries();
    if ($("#drop-maths").open) $("#maths").innerHTML = mathsHTML(p, tr);
    updateInsight(); updateLegend(); updateTip();
    save();
    queue();
  }
  const PIN_COLORS = ["#7C3AED", "#0891B2", "#DB2777", "#65A30D", "#B45309"];
  const rebuildPinned = () => { pinned = S.pinned.map((q, i) => ({ label: q.label, tr: simulate(q.p), color: PIN_COLORS[i % 5] })); updateLegend(); };
  function updateLegend() {
    const el = $("#legend"); if (!el || !tr) return;
    let h = `<span class="lg"><i style="background:${COL.path}"></i>This throw</span>`;
    if (vac) h += `<span class="lg"><i class="dash" style="--c:#94A3B8"></i>No air</span>`;
    pinned.forEach((q, i) => { h += `<span class="lg pin"><i class="dash" style="--c:${q.color}"></i>Pinned ${i + 1}: ${q.label}<button data-unpin="${i}" aria-label="Remove">✕</button></span>`; });
    if (pinned.length && !S.show.pinned) h += `<span class="lg hint-lg">Pinned paths are hidden (see "Show on the graph").</span>`;
    el.innerHTML = h;
  }

  // ---------- drawing loop ----------
  function queue() { if (!frameQueued) { frameQueued = true; requestAnimationFrame(frame); } }
  function frame(now) {
    frameQueued = false;
    if (playing) {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      t += dt * S.playback;
      if (t >= tr.s.endTime) { t = tr.s.endTime; playing = false; }
    }
    lastFrame = playing ? now : 0;
    render();
    if (playing) queue();
  }
  function render() {
    if (S.page !== "sim") return;
    const sc = { tr, p, show: S.show, pinned, t, cur: stateAt(tr, t), cam, vac };
    (S.view === "3D" ? draw3D : draw2D)($("#stage"), sc);
    const end = tr.s.endTime;
    $("#scrub").value = end > 0 ? Math.round(t / end * 1000) : 0;
    setPct($("#scrub"));
    $("#time").textContent = `${t.toFixed(2)} / ${end.toFixed(2)} s`;
    $("#play").classList.toggle("playing", playing);
    $("#play").setAttribute("aria-label", playing ? "Pause" : "Play");
    drawAnalysis();
  }

  // ---------- results ----------
  function updateStats() {
    const s = tr.s;
    const tile = (lbl, val, unit, c) =>
      `<div class="stat" style="--c:${c}"><div class="lbl">${lbl}</div><div class="val">${val}<small>${unit}</small></div></div>`;
    $("#stats").innerHTML =
      tile("Range", s.range.toFixed(2), "m", COL.range) +
      tile("Max height", s.maxHeight.toFixed(2), "m", COL.height) +
      tile("Flight time", s.flightTime.toFixed(2), "s", "#7C3AED") +
      tile("Impact speed", s.impactSpeed.toFixed(2), "m/s", COL.vmax);
    const rows = [
      ["Launch", `${p.speed.toFixed(2)} m/s at ${p.angle.toFixed(1)}°`],
      ["Range along the ground", `${s.rangeSlope.toFixed(2)} m`],
      ["Sideways drift", `${s.drift.toFixed(2)} m`],
      ["Time to max height", `${s.apexTime.toFixed(2)} s`],
      ["Max speed", `${s.vMax.toFixed(2)} m/s`],
      ["Min speed", `${s.vMin.toFixed(2)} m/s`],
      ["Impact angle", `${s.impactAngle.toFixed(1)}° below horizontal`],
      ["Energy lost to the air", `${s.energyLost.toFixed(1)} %`],
    ];
    if (vac) rows.push(["Range with no air", `${vac.s.range.toFixed(2)} m`]);
    if (p.bounce) rows.push(["Bounces", `${s.bounces}`], ["Comes to rest at", `${s.restX.toFixed(2)} m`]);
    $("#more").innerHTML = `<table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table>`;
    const bits = [S.object === "Custom" ? "Custom object" : S.object, S.planet === "Custom" ? `g = ${p.g}` : S.planet,
                  p.drag ? "with air" : "no air"];
    if (p.wind) bits.push("wind");
    if (p.bounce) bits.push("bouncing");
    $("#stage-sub").textContent = bits.join(" · ");
  }

  // ---------- analysis ----------
  const EXPLAIN = {
    height: "Without air the curve is a perfect parabola. With air it climbs faster than it falls, so the way down is steeper.",
    velocity: "Horizontal speed stays constant without air. Vertical speed drops steadily, passes zero at the top, then turns negative.",
    energy: "Without air the total is a flat line: kinetic turns into potential and back. With air, the total slopes down as energy is lost.",
  };
  function drawAnalysis() {
    const cv = $("#chart"), kind = S.chart;
    if (kind === "angle") return drawAngle(cv);
    const T = tr.t, n = T.length;
    const sp = new Array(n), series = [];
    for (let i = 0; i < n; i++) sp[i] = Math.hypot(tr.vx[i], tr.vy[i], tr.vz[i]);
    let yLabel;
    if (kind === "height") {
      if (vac) series.push({ x: vac.t, y: vac.z, color: "#94A3B8", dash: [5, 5], name: "No air", width: 2 });
      series.push({ x: T, y: tr.z, color: COL.height, name: "Height" }); yLabel = "Height (m)";
    } else if (kind === "velocity") {
      series.push({ x: T, y: sp, color: COL.v, name: "Speed", width: 3 },
                  { x: T, y: tr.vx.map((v, i) => Math.hypot(v, tr.vy[i])), color: COL.vx, name: "Horizontal" },
                  { x: T, y: tr.vz, color: COL.vz, name: "Vertical" });
      yLabel = "Velocity (m/s)";
    } else {
      const ke = sp.map((v) => 0.5 * p.mass * v * v), pe = tr.z.map((z) => p.mass * p.g * z);
      series.push({ x: T, y: ke, color: COL.vmax, name: "Kinetic" },
                  { x: T, y: pe, color: COL.height, name: "Potential" },
                  { x: T, y: ke.map((v, i) => v + pe[i]), color: COL.v, name: "Total", width: 3 });
      yLabel = "Energy (J)";
    }
    drawChart(cv, { series, xLabel: "Time (s)", yLabel, vlines: tr.impacts.slice(0, -1).map((i) => T[i]),
                    cursor: t, legend: true });
  }
  function angleData() {
    if (!sweepCache) {
      sweepCache = { air: angleSweep(p), vac: p.drag ? angleSweep({ ...p, drag: false, wind: false }) : null };
      bestCache = bestAngle(p);
    }
    return sweepCache;
  }
  function drawAngle(cv) {
    const d = angleData(), b = bestCache, series = [];
    if (d.vac) series.push({ x: d.vac.angle, y: d.vac.range, color: COL.ghost, dash: [6, 5], name: "No air", width: 2 });
    series.push({ x: d.air.angle, y: d.air.range, color: COL.blue, name: p.drag ? "With air" : "Range", width: 3 });
    drawChart(cv, {
      series, xLabel: "Launch angle (°)", yLabel: "Range (m)", yFromZero: true, legend: true,
      mark: { x: p.angle, color: COL.orange, label: "your angle" },
      point: { x: b.angle, y: b.range, color: COL.height, label: `Farthest: ${b.angle.toFixed(1)}° → ${b.range.toFixed(1)} m` },
    });
  }
  function updateInsight() {
    const box = $("#insight");
    if (S.chart !== "angle") {
      $("#chart-sub").textContent = "How the throw changes from launch to landing";
      box.innerHTML = `<div class="note">${EXPLAIN[S.chart]}${tr.impacts.length > 1 ? " Dotted lines mark the bounces." : ""}</div>`;
      return;
    }
    angleData();
    const b = bestCache;
    $("#chart-sub").textContent = "Your throw tried at every angle from 0° to 90°";
    let msg;
    if (!p.drag && p.incline === 0 && p.height === 0)
      msg = "Without air, from flat ground, the best angle is exactly <b>45°</b>. Angles that add up to 90° (like 30° and 60°) land in the same spot.";
    else if (p.drag)
      msg = `Air resistance pulls the best angle down to <b>${b.angle.toFixed(1)}°</b>: a lower, faster throw spends less time fighting the air.`;
    else
      msg = `From here the best angle is <b>${b.angle.toFixed(1)}°</b>. Higher launches or downhill slopes favour flatter throws; uphill favours steeper ones.`;
    box.innerHTML = `<div class="note"><b>How to read this:</b> we threw your ball at every angle, keeping your speed the same, and plotted how far each one lands. The <b style="color:#059669">green dot</b> is the angle that lands farthest; the <b style="color:#E4572E">orange line</b> is your angle.</div>
      <div class="note" style="margin-top:8px">${msg}</div>
      <button class="btn primary" data-act="best">${ICON.target}Use the farthest angle (${b.angle.toFixed(1)}°)</button>`;
  }

  // ---------- tips that react to the current throw ----------
  let tips = [], tipI = 0;
  function updateTip() {
    tips = simTips(S, p, tr); tipI = 0; showTip(false);
  }
  function showTip(anim = true) {
    const box = $("#sim-tip"); if (!box || !tips.length) return;
    const n = tips.length;
    box.innerHTML = `<span class="ff-ic" aria-hidden="true">💡</span><span class="ff-body"><b>Tip</b> <span class="ff-t${anim ? " ff-in" : ""}">${tips[tipI % n]}</span></span>
      <button class="ff-next" data-tip-next title="Another tip" aria-label="Another tip">↻</button>`;
  }

  // ---------- controls ----------
  // The panel is a stack of sections. Each one holds a setting AND everything that belongs to it,
  // so you never switch something on in one place and adjust it somewhere else.
  const slider = (key, extra = "") => sliderBox(key, S[key], SLIDERS[key], extra);
  const segHTML = (key, opts) => `<div class="seg" data-key="${key}">${Object.entries(opts)
    .map(([v, l]) => `<button data-val="${v}" class="${S[key] === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const pillsHTML = (key, opts) => `<div class="pills" data-key="${key}">${opts
    .map((v) => `<button data-val="${v}" class="${S[key] === v ? "on" : ""}">${v}</button>`).join("")}</div>`;
  const switchHTML = (key, label, sub, disabled = false) =>
    `<label class="switch${disabled ? " disabled" : ""}"><span>${label}${sub ? `<small>${sub}</small>` : ""}</span><input type="checkbox" data-key="${key}" ${S[key] ? "checked" : ""} ${disabled ? "disabled" : ""}><span class="track"></span></label>`;
  const section = (id, icon, color, title, body) =>
    `<details class="sec" data-sec="${id}" style="--sc:${color}" ${S.open[id] ? "open" : ""}>
      <summary><span class="sec-ic">${icon}</span><span class="sec-t"><b>${title}</b><small id="sum-${id}"></small></span><span class="sec-chev"></span></summary>
      <div class="sec-body">${body}</div></details>`;
  const hint = (html) => `<div class="hint">${html}</div>`;

  const WIND_QUICK = [[180, "Headwind", "blows in your face"], [0, "Tailwind", "blows from behind"],
                      [270, "From the left", "pushes it right"], [90, "From the right", "pushes it left"]];
  // What a wind direction means in words. 0° blows the way you throw, 180° blows back at you.
  function windWords(dir) {
    const names = ["Tailwind", "Tailwind, from the right", "Crosswind from the right", "Headwind, from the right",
                   "Headwind", "Headwind, from the left", "Crosswind from the left", "Tailwind, from the left"];
    return names[Math.round((((dir % 360) + 360) % 360) / 45) % 8];
  }
  // Top-down compass: you face up the dial, the arrow shows where the wind blows
  function windDial() {
    const R = 46, c = 64, d = S.windDir * RAD;
    const ux = -Math.sin(d), uy = -Math.cos(d);            // wind direction on screen (forward = up, left = left)
    const x0 = c - ux * R * 0.78, y0 = c - uy * R * 0.78, x1 = c + ux * R * 0.78, y1 = c + uy * R * 0.78;
    const ah = 12, ang = Math.atan2(uy, ux);
    const head = `${x1},${y1} ${x1 - ah * Math.cos(ang - 0.45)},${y1 - ah * Math.sin(ang - 0.45)} ${x1 - ah * Math.cos(ang + 0.45)},${y1 - ah * Math.sin(ang + 0.45)}`;
    const ticks = [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<line x1="${c + Math.sin(a) * (R - 6)}" y1="${c - Math.cos(a) * (R - 6)}" x2="${c + Math.sin(a) * R}" y2="${c - Math.cos(a) * R}"/>`; }).join("");
    return `<div class="wind-dial-wrap">
      <svg class="wind-dial" id="wind-dial" viewBox="0 0 128 128" role="slider" aria-label="Wind direction" aria-valuenow="${S.windDir}" tabindex="0">
        <circle cx="${c}" cy="${c}" r="${R}" class="wd-face"/><g class="wd-ticks">${ticks}</g>
        <text x="${c}" y="9" class="wd-l">ahead</text><text x="${c}" y="126" class="wd-l">behind</text>
        <text x="4" y="${c + 3}" class="wd-l" text-anchor="start">left</text><text x="124" y="${c + 3}" class="wd-l" text-anchor="end">right</text>
        <path d="M${c} ${c + 10} L${c} ${c - 16}" class="wd-throw"/><polygon points="${c},${c - 22} ${c - 5},${c - 13} ${c + 5},${c - 13}" class="wd-throw-h"/>
        <circle cx="${c}" cy="${c + 12}" r="4" class="wd-you"/>
        <line x1="${x0}" y1="${y0}" x2="${x1 - ux * 6}" y2="${y1 - uy * 6}" class="wd-arrow"/><polygon points="${head}" class="wd-arrow-h"/>
      </svg>
      <div class="wind-read"><b id="wind-name">${windWords(S.windDir)}</b><small>Drag the arrow, or pick:</small>
        <div class="wind-quick">${WIND_QUICK.map(([v, n, sub]) => `<button data-wind="${v}" class="${S.windDir === v ? "on" : ""}" title="${sub}">${n}</button>`).join("")}</div></div>
    </div>`;
  }

  function renderControls() {
    const noAir = planet().rho === 0;
    let h = `<details class="mini-drop" ${S.guide ? "open" : ""}><summary>✨ Not sure where to start? Try a ready-made throw</summary><div class="presets">${Object.entries(PRESETS)
      .map(([id, pr]) => `<button data-preset="${id}">${pr.name}</button>`).join("")}</div></details>`;

    // 1. the throw itself: how hard, how steep, and which way, with its x, y, z parts right underneath
    let b = segHTML("mode", MODES);
    if (S.mode === "comp") b += slider("vx") + slider("vy");
    else if (S.mode === "force") b += slider("force") + slider("ctime") + slider("angle");
    else b += slider("speed") + slider("angle");
    b += slider("azimuth") + hint("0° throws straight ahead. Positive aims left, negative aims right: switch to <b>3D</b> to see it.");
    b += `<div id="launch-sum"></div>`;
    b += `<div class="btnrow"><button class="btn" data-act="best">${ICON.target}Farthest angle</button><button class="btn" data-act="pin">${ICON.pin}Pin path</button></div>`;
    if (S.pinned.length) b += `<div class="btnrow"><button class="btn ghost" data-act="clearpins">Clear ${S.pinned.length} pinned path${S.pinned.length > 1 ? "s" : ""}</button></div>`;
    h += section("launch", "🎯", "#1D4ED8", "The throw", b);

    // 2. where it starts
    h += section("start", "⛰️", "#0D9488", "Starting point",
      slider("height") + slider("incline") + hint("Positive slope goes uphill, negative goes downhill."));

    // 3. planet and object
    b = `<div class="group-label">Where are you?</div>` + pillsHTML("planet", Object.keys(PLANETS));
    if (S.planet === "Custom") b += slider("g") + slider("rho");
    else { const w = PLANETS[S.planet]; b += hint(`g = <b>${w.g} m/s²</b> · air density <b>${w.rho} kg/m³</b>. ${w.note}`); }
    b += `<div class="group-label">What are you throwing?</div>` + pillsHTML("object", Object.keys(OBJECTS));
    if (S.object === "Custom") b += slider("mass") + slider("cd") + slider("diam");
    else { const [m, cd, d] = OBJECTS[S.object]; b += hint(`${m} kg · ${d} cm across · drag coefficient ${cd}. Size and mass only matter when air resistance is on.`); }
    h += section("world", "🌍", "#7C3AED", "World & object", b);

    // 4. air and wind, together: wind only exists if there is air to move
    b = `<div class="air-intro">${noAir
      ? `There is <b>no air on the ${S.planet === "Custom" ? "planet you made" : S.planet}</b>, so nothing slows the ball and there is no wind. Pick Earth, Mars or Jupiter, or give your custom planet some air density.`
      : `Off means an <b>ideal world</b>: nothing pushes on the ball except gravity, so the path is a perfect parabola. Turn air on to see what real air does.`}</div>`;
    b += switchHTML("drag", "Air resistance", noAir ? "no air here" : "Air pushes back against the ball's motion", noAir);
    if (S.drag && !noAir) {
      b += `<div class="effect" id="air-effect"></div>`;
      b += `<label class="check inline"><input type="checkbox" data-show="vacuum" ${S.show.vacuum ? "checked" : ""}><span class="dot" style="background:#94A3B8"></span>Also draw the no-air path, to compare</label>`;
      b += `<div class="subsec">` + switchHTML("wind", "Wind", "Moving air: it can help or hold back the ball");
      if (S.wind) {
        b += windDial() + slider("windSpeed") + slider("windDir") +
          hint("0° blows the way you throw (helps), 180° blows straight back at you (holds it back), 90° and 270° blow across.");
        b += `<div class="effect" id="wind-effect"></div>`;
      }
      b += `</div>`;
    }
    h += section("air", "💨", "#0891B2", "Air & wind", b);

    // 5. bouncing
    b = switchHTML("bounce", "Bounce when it lands", "Keeps going until it stops bouncing");
    if (S.bounce) b += slider("restitution") + hint("Bounciness 1 bounces back to full speed; 0 doesn't bounce at all.");
    h += section("bounce", "🏀", "#EA580C", "Bouncing", b);

    // 6. what's drawn on the graph
    const items = [["hmax", "Max height", COL.height], ["range", "Range", COL.range], ["vmax", "Max speed", COL.vmax],
                   ["vmin", "Min speed", COL.vmin], ["vectors", "Velocity arrows", COL.v], ["pinned", "Pinned paths", COL.ghost],
                   ["vacuum", "No-air path", "#94A3B8"], ["dots", "Time dots", COL.orange]];
    b = `<div class="checks">${items.map(([k, l, c]) =>
      `<label class="check"><input type="checkbox" data-show="${k}" ${S.show[k] ? "checked" : ""}><span class="dot" style="background:${c}"></span>${l}</label>`).join("")}</div>`;
    b += hint("<b>Time dots</b> mark equal time steps: they spread out where the ball is fast. <b>No-air path</b> only shows when air resistance is on.");
    b += `<div class="btnrow"><button class="btn ghost" data-act="guide">${ICON.info}Show tips</button><button class="btn ghost" data-act="reset">${ICON.reset}Reset everything</button></div>`;
    h += section("show", "👁️", "#475569", "Show on the graph", b);

    $("#ctl").innerHTML = h;
    $$("#ctl input[type=range]").forEach(setPct);
    updateLaunchSummary(); updateSummaries();
  }

  // the one-line summary on each section header, and the "what it does" boxes
  function updateSummaries() {
    const set = (id, txt) => { const e = $(`#sum-${id}`); if (e) e.innerHTML = txt; };
    if (!p) return;
    const az = S.azimuth ? `, ${Math.abs(S.azimuth)}° ${S.azimuth > 0 ? "left" : "right"}` : "";
    set("launch", `${p.speed.toFixed(1)} m/s at ${p.angle.toFixed(1)}°${az}`);
    set("start", `${S.height ? `${S.height} m up` : "From the ground"} · ${S.incline ? `${Math.abs(S.incline)}° ${S.incline > 0 ? "uphill" : "downhill"}` : "flat ground"}`);
    set("world", `${S.planet === "Custom" ? `g = ${p.g}` : S.planet} · ${S.object}`);
    set("air", !p.drag ? `<span class="off">Off</span> ideal, no air` :
      `<span class="on">On</span>${p.wind ? ` · ${windWords(S.windDir).toLowerCase()} ${S.windSpeed} m/s` : " · no wind"}`);
    set("bounce", p.bounce ? `<span class="on">On</span> bounciness ${S.restitution}` : `<span class="off">Off</span>`);
    set("show", `${Object.values(S.show).filter(Boolean).length} things shown`);
    const pct = (a, b) => b ? `${a >= b ? "+" : "−"}${Math.abs((a - b) / b * 100).toFixed(0)}%` : "";
    const ae = $("#air-effect");
    if (ae && cmp.ideal) {
      const base = (cmp.calm || tr).s.range, ideal = cmp.ideal.s.range;
      ae.innerHTML = `Air ${p.wind ? "(without the wind) " : ""}shortens the range from <b>${ideal.toFixed(1)} m</b> to <b>${base.toFixed(1)} m</b> (${pct(base, ideal)}) and the top drops from ${cmp.ideal.s.maxHeight.toFixed(1)} m to ${(cmp.calm || tr).s.maxHeight.toFixed(1)} m.`;
    }
    const we = $("#wind-effect");
    if (we && cmp.calm) {
      const a = tr.s.range, c = cmp.calm.s.range, drift = tr.s.drift;
      const verb = a > c + 0.05 ? "carries it farther" : a < c - 0.05 ? "holds it back" : "barely changes the range";
      we.innerHTML = `This wind ${verb}: <b>${c.toFixed(1)} m → ${a.toFixed(1)} m</b> (${pct(a, c)})${Math.abs(drift) > 0.05 ? `, and pushes it <b>${Math.abs(drift).toFixed(1)} m ${drift > 0 ? "left" : "right"}</b>` : ""}. Compared with no air at all: ${cmp.ideal.s.range.toFixed(1)} m.`;
    }
    const wn = $("#wind-name"); if (wn) wn.textContent = windWords(S.windDir);
  }

  function updateLaunchSummary() {
    const box = $("#launch-sum");
    if (!box) return;
    const [v, a] = launch(), hz = v * Math.cos(a * RAD);
    const comp = (lbl, sub, val, c) => `<div class="comp" style="--c:${c}"><span>${lbl}<small>${sub}</small></span><b>${val.toFixed(2)}</b><em>m/s</em></div>`;
    let txt = `<div class="group-label">Its three parts</div><div class="comps">${comp("v<sub>x</sub>", "forward", hz * Math.cos(S.azimuth * RAD), COL.vx)}${comp("v<sub>y</sub>", "up", v * Math.sin(a * RAD), COL.vz)}${comp("v<sub>z</sub>", "sideways", hz * Math.sin(S.azimuth * RAD), "#0891B2")}</div>`;
    txt += `<div class="comp-total">Total speed <b>${v.toFixed(2)} m/s</b> = √(v<sub>x</sub>² + v<sub>y</sub>² + v<sub>z</sub>²)</div>`;
    if (S.mode === "force") txt = `<div class="comp-total">Impulse F·Δt = m·v → v = ${S.force} × ${(S.ctime / 1000).toFixed(3)} ÷ ${mass()} = <b>${v.toFixed(1)} m/s</b></div>` + txt;
    box.innerHTML = txt;
  }

  function switchMode(mode) {
    const [v, a] = launch();
    S.mode = mode;
    if (mode === "comp") { S.vx = r1(clamp(v * Math.cos(a * RAD), 0, 150)); S.vy = r1(clamp(v * Math.sin(a * RAD), -150, 150)); }
    else if (mode === "force") { S.force = Math.round(clamp(mass() * v / (S.ctime / 1000), 0, 10000) / 5) * 5; S.angle = r1(a); }
    else { S.speed = r1(clamp(v, 0, 150)); S.angle = r1(a); }
  }

  function applyPreset(id) {
    const pr = PRESETS[id]; if (!pr) return;
    const { show, ...rest } = pr.set;
    Object.assign(S, rest);
    if (show) Object.assign(S.show, show);
    if (S.object !== "Custom") [S.mass, S.cd, S.diam] = OBJECTS[S.object];
    renderControls(); recompute(); applyStatic();
    toast(`Loaded <b>${pr.name}</b>. Press ▶ to launch`);
  }

  function act(name) {
    if (name === "best") {
      const b = bestAngle(p);
      if (S.mode === "comp") switchMode("speed");
      S.angle = r1(b.angle);
      renderControls(); recompute();
      toast(`At <b>${b.angle.toFixed(1)}°</b> your throw goes farthest: <b>${b.range.toFixed(2)} m</b>`);
    } else if (name === "pin") {
      const label = `${p.speed.toFixed(1)} m/s · ${p.angle.toFixed(1)}°`;
      S.pinned = [...S.pinned, { label, p }].slice(-5);
      rebuildPinned(); renderControls(); save(); queue();
      toast(`Pinned <b>${label}</b>: it stays on the graph as a coloured dashed line`);
    } else if (name === "clearpins") {
      S.pinned = []; rebuildPinned(); renderControls(); save(); queue();
    } else if (name === "reset") {
      const keep = { page: S.page, open: S.open };
      S = { ...structuredClone(DEFAULTS), ...keep };
      Object.assign(cam, CAM_DEFAULT);
      rebuildPinned(); renderControls(); recompute(); applyStatic();
      toast("Everything is back to the start");
    } else if (name === "hideguide") {
      S.guide = false; $("#guide").hidden = true; save();
    } else if (name === "guide") {
      S.guide = true; $("#guide").hidden = false; save();
    }
  }

  // ---------- simulator events ----------
  const sim = $("#page-sim");
  bindSliders($("#ctl"), SLIDERS, (key, v) => { S[key] = v; recompute(); if (key === "windDir") refreshDial(); }, SIM_LIMITS);
  // remember which sections are open
  $("#ctl").addEventListener("toggle", (e) => {
    const d = e.target; if (!d.dataset || !d.dataset.sec) return;
    S.open[d.dataset.sec] = d.open; save();
  }, true);
  // wind dial: drag (or tap) to point the wind
  function refreshDial() {
    const old = $("#wind-dial"); if (!old) return;
    const tmp = document.createElement("div"); tmp.innerHTML = windDial();
    old.replaceWith(tmp.querySelector("svg"));
    $$("[data-wind]").forEach((b) => b.classList.toggle("on", +b.dataset.wind === S.windDir));
    const r = $(`input[type=range][data-key="windDir"]`), n = $(`[data-num="windDir"]`);
    if (r) { r.value = S.windDir; setPct(r); } if (n) n.value = S.windDir;
  }
  function setWindDir(v) { S.windDir = ((Math.round(v / 5) * 5) % 360 + 360) % 360; recompute(); refreshDial(); }
  let dialDrag = false;
  const dialAngle = (e) => {
    const r = $("#wind-dial").getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return Math.atan2(-dx, -dy) / RAD;                      // screen → wind direction (forward = up, left = left)
  };
  $("#ctl").addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#wind-dial")) return;
    dialDrag = true; e.preventDefault(); setWindDir(dialAngle(e));
  });
  root.addEventListener("pointermove", (e) => { if (dialDrag && $("#wind-dial")) setWindDir(dialAngle(e)); });
  const endDial = () => { dialDrag = false; };
  root.addEventListener("pointerup", endDial); root.addEventListener("pointercancel", endDial);
  $("#ctl").addEventListener("keydown", (e) => {
    if (!e.target.closest || !e.target.closest("#wind-dial")) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setWindDir(S.windDir + (e.key === "ArrowRight" ? -5 : 5)); $("#wind-dial").focus(); }
  });
  sim.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.show) {
      S.show[el.dataset.show] = el.checked;
      $$(`[data-show="${el.dataset.show}"]`).forEach((c) => { c.checked = el.checked; });   // it appears in two places
      if (el.dataset.show === "vacuum") recompute(); else { save(); queue(); updateSummaries(); }
      return;
    }
    if (el.type === "checkbox" && el.dataset.key) {
      S[el.dataset.key] = el.checked;
      if (el.dataset.key === "drag" && !el.checked) S.wind = false;      // no air, no wind
      renderControls(); recompute();
    }
  });
  sim.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.act) return act(btn.dataset.act);
    if (btn.hasAttribute("data-tip-next")) { tipI++; return showTip(); }
    if (btn.dataset.unpin) { S.pinned.splice(+btn.dataset.unpin, 1); rebuildPinned(); renderControls(); save(); queue(); return; }
    if (btn.dataset.preset) return applyPreset(btn.dataset.preset);
    if (btn.dataset.wind !== undefined) return setWindDir(+btn.dataset.wind);
    const group = btn.parentElement && btn.parentElement.dataset.key;
    if (!group || btn.dataset.val === undefined) return;
    const val = btn.dataset.val;
    if (group === "mode") { if (val !== S.mode) switchMode(val); renderControls(); recompute(); return; }
    if (group === "object") {
      S.object = val;
      if (val !== "Custom") [S.mass, S.cd, S.diam] = OBJECTS[val];
      renderControls(); recompute(); return;
    }
    if (group === "planet") {
      S.planet = val;
      if (val !== "Custom") { S.g = PLANETS[val].g; S.rho = PLANETS[val].rho; }
      if (planet().rho === 0) S.wind = false;
      renderControls(); recompute(); return;
    }
    if (group === "view" || group === "chart") { S[group] = val; applyStatic(); save(); updateInsight(); queue(); }
  });

  $("#play").addEventListener("click", () => {
    if (playing) playing = false;
    else { if (t >= tr.s.endTime - 1e-9) t = 0; playing = true; lastFrame = 0; }
    queue();
  });
  $("#back5").addEventListener("click", () => { t = Math.max(0, t - 5); queue(); });
  $("#fwd5").addEventListener("click", () => {
    t = Math.min(tr.s.endTime, t + 5);
    if (t >= tr.s.endTime) playing = false;
    queue();
  });
  $("#scrub").addEventListener("input", (e) => { playing = false; t = (+e.target.value / 1000) * tr.s.endTime; queue(); });
  $("#pspeed").addEventListener("input", (e) => {
    S.playback = +e.target.value; setPct(e.target);
    $("#pspeedv").textContent = `${S.playback.toFixed(1)}×`; save();
  });
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || S.page !== "sim") return;
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    const r = $("#stage").getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    e.preventDefault(); $("#play").click();
  });
  $("#drop-maths").addEventListener("toggle", (e) => { if (e.target.open) $("#maths").innerHTML = mathsHTML(p, tr); });
  $("#drop-analysis").addEventListener("toggle", () => queue());
  attachOrbit($("#stage"), () => cam, queue, () => S.view === "3D");
  new ResizeObserver(() => queue()).observe($("#stage"));
  new ResizeObserver(() => queue()).observe($("#chart"));

  // ---------- pages ----------
  const app = {
    root, $, $$, store, toast,
    go(page) { S.page = page; applyStatic(); save(); root.querySelector(".nav").scrollIntoView({ block: "nearest" }); },
    tryPreset(id) { S.page = "sim"; applyStatic(); applyPreset(id); },
    openTool(tool) { S.page = "tools"; applyStatic(); sections.tools?.open(tool); },
  };
  app.data = component.data || {};
  const makers = { relative: initRelative, play: initPlay, tools: initInstruments, history: initHistory, visitors: initVisitors };
  const sections = {};

  root.querySelector(".nav").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-page]");
    if (b) app.go(b.dataset.page);
  });

  function applyStatic() {
    $$(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.page === S.page));
    if (!["sim", "relative", "play", "tools", "history", "visitors"].includes(S.page)) S.page = "sim";
    for (const pg of ["sim", "relative", "play", "tools", "history", "visitors"]) $(`#page-${pg}`).hidden = S.page !== pg;
    if (makers[S.page]) {
      if (!sections[S.page]) sections[S.page] = makers[S.page](app, $(`#page-${S.page}`));
      sections[S.page].show?.();
    }

    $$('[data-key="view"] button').forEach((b) => b.classList.toggle("on", b.dataset.val === S.view));
    $$('[data-key="chart"] button').forEach((b) => b.classList.toggle("on", b.dataset.val === S.chart));
    $("#stage").classList.toggle("orbit", S.view === "3D");
    $("#pspeed").value = S.playback; setPct($("#pspeed"));
    $("#pspeedv").textContent = `${(+S.playback).toFixed(1)}×`;
    $("#guide").hidden = !S.guide;
    queue();
  }

  // ---------- start ----------
  rebuildPinned();
  renderControls();
  recompute();
  applyStatic();
}

function setPct(el) {
  const min = +el.min, max = +el.max;
  el.style.setProperty("--pct", `${((+el.value - min) / (max - min)) * 100}%`);
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
