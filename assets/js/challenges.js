// ===================================================================
//  Challenges: land the ball on the target. Ten levels, stars for
//  using fewer shots, hints, and saved progress.
// ===================================================================

const LEVELS = [
  { title: "First shot", tag: "Angle", story: "Your speed is fixed. Find an angle that lands on the target.",
    world: "Earth", drag: false, fixed: { speed: 20 }, free: ["angle"], target: { x: 30, w: 4 },
    tip: "Without air, range = v² sin 2θ / g. Two different angles give the same range: try a low one and a high one." },
  { title: "Find the speed", tag: "Speed", story: "The angle is locked at 45°. How fast do you need to throw?",
    world: "Earth", drag: false, fixed: { angle: 45 }, free: ["speed"], target: { x: 50, w: 4 },
    tip: "At 45° with no air, range = v² / g, so v = √(range × g)." },
  { title: "Over the wall", tag: "Wall", story: "A wall is in the way. Same speed for every shot: go over it, not through it.",
    world: "Earth", drag: false, fixed: { speed: 22 }, free: ["angle"], target: { x: 40, w: 4 }, wall: { x: 20, h: 8 },
    tip: "Both angles that reach 40 m exist, but only the steeper one clears an 8 m wall." },
  { title: "Off the cliff", tag: "Height", story: "You're on a 30 m cliff, throwing straight out flat. How hard?",
    world: "Earth", drag: false, height: 30, fixed: { angle: 0 }, free: ["speed"], target: { x: 25, w: 3 },
    tip: "Falling 30 m takes t = √(2h/g) ≈ 2.47 s whatever the speed. Then speed = distance ÷ time." },
  { title: "Moon golf", tag: "Moon", story: "Low gravity and no air. The target is a long way off.",
    world: "Moon", drag: false, object: "Golf ball", fixed: { speed: 15 }, free: ["angle"], target: { x: 100, w: 6 },
    tip: "On the Moon g is only 1.62 m/s², so throws go about six times farther than on Earth." },
  { title: "Into the wind", tag: "Wind", story: "A strong headwind and real air. Your speed is fixed.",
    world: "Earth", drag: true, wind: { speed: 8, dir: 180 }, object: "Baseball", fixed: { speed: 30 }, free: ["angle"], target: { x: 42, w: 4 },
    tip: "Into the wind, a lower angle spends less time being pushed back." },
  { title: "Uphill", tag: "Slope", story: "The target sits on a 15° slope. Choose the angle.",
    world: "Earth", drag: false, incline: 15, fixed: { speed: 25 }, free: ["angle"], target: { x: 35, w: 4 },
    tip: "On a slope the best angle tilts up by half the slope: about 45° + 7.5° for the farthest throw." },
  { title: "Ping-pong", tag: "Drag", story: "A light ball in real air. The angle is locked at 40°.",
    world: "Earth", drag: true, object: "Ping-pong", fixed: { angle: 40 }, free: ["speed"], target: { x: 8, w: 1.5 },
    tip: "Air slows a ping-pong ball a lot, so you'll need more speed than the no-air formula says." },
  { title: "Jupiter", tag: "Gravity", story: "Gravity is 2.5 times Earth's. Pick both speed and angle.",
    world: "Jupiter", drag: false, fixed: {}, free: ["speed", "angle"], target: { x: 30, w: 3 },
    tip: "Strong gravity pulls the ball down fast, so you need plenty of speed." },
  { title: "Sharpshooter", tag: "Expert", story: "Small target, real air, a golf ball, and a wall. Good luck.",
    world: "Earth", drag: true, object: "Golf ball", fixed: {}, free: ["speed", "angle"], target: { x: 60, w: 1.6 }, wall: { x: 35, h: 12 },
    tip: "Clear the wall first, then fine-tune. Type exact values into the boxes to make tiny changes." },
  { title: "Downhill", tag: "Slope", story: "The ground drops away at 15°. Find the angle.",
    world: "Earth", drag: false, incline: -15, fixed: { speed: 20 }, free: ["angle"], target: { x: 45, w: 3 },
    tip: "Downhill the ball keeps falling past where flat ground would be, so it goes farther. Lower angles help." },
  { title: "Mars", tag: "Mars", story: "Thin air and weak gravity. Speed locked at 12 m/s.",
    world: "Mars", drag: true, object: "Football", fixed: { speed: 12 }, free: ["angle"], target: { x: 35, w: 3 },
    tip: "Mars gravity is 3.71 m/s², about 38% of Earth's, so throws go about 2.6× as far." },
  { title: "Rooftop", tag: "Height", story: "Throw from a 20 m roof at a fixed 30°. How fast?",
    world: "Earth", drag: false, height: 20, fixed: { angle: 30 }, free: ["speed"], target: { x: 30, w: 2 },
    tip: "The extra height gives it more time in the air, so it needs less speed than on flat ground." },
  { title: "Castle wall", tag: "Wall", story: "A 25 m wall stands at 60 m. Cannonball, real air.",
    world: "Earth", drag: true, object: "Cannonball", fixed: {}, free: ["speed", "angle"], target: { x: 110, w: 6 }, wall: { x: 60, h: 25 },
    tip: "Go steep enough to clear 25 m, then adjust the speed to land at 110 m." },
  { title: "Moon feather", tag: "Moon", story: "A feather on the Moon. No air means it flies like anything else.",
    world: "Moon", drag: true, object: "Feather", fixed: { angle: 45 }, free: ["speed"], target: { x: 20, w: 1.5 },
    tip: "With no air, range = v²/g at 45°, using g = 1.62 m/s²." },
];

// Levels 16–50 were generated and checked to be winnable
LEVELS.push(...[{"fixed":{"speed":33},"free":["angle"],"world":"Earth","drag":false,"object":"Baseball","target":{"x":71,"w":3.5},"title":"Find the angle","tag":"Angle","story":"Speed is locked. Pick the angle.","tip":"Without air there are usually two angles that work: a low one and a high one."},{"fixed":{"angle":53},"free":["speed"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":45,"w":3.4},"title":"Find the speed","tag":"Speed","story":"Angle is locked. Pick the speed.","tip":"More speed means more distance. Adjust in small steps."},{"fixed":{"speed":31},"free":["angle"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":79,"w":3.4},"wall":{"x":38,"h":11},"title":"Over the wall","tag":"Wall","story":"Clear the wall and land on target.","tip":"Go steeper to clear the wall."},{"fixed":{"angle":0},"free":["speed"],"world":"Earth","drag":false,"object":"Basketball","height":51,"target":{"x":55,"w":3.3},"title":"Cliff throw","tag":"Height","story":"Throw from high up.","tip":"Extra height means extra time in the air."},{"fixed":{"speed":19},"free":["angle"],"world":"Earth","drag":false,"object":"Basketball","incline":8,"target":{"x":24,"w":3.2},"title":"Uphill","tag":"Slope","story":"The ground is tilted.","tip":"Uphill needs a steeper angle; downhill a flatter one."},{"fixed":{},"free":["speed","angle"],"world":"Earth","drag":false,"object":"Football","target":{"x":55,"w":3.2},"title":"Free shot","tag":"Expert","story":"Choose both speed and angle.","tip":"Start near 40° and adjust the speed."},{"fixed":{"speed":33},"free":["angle"],"world":"Earth","drag":true,"object":"Cannonball","wind":{"speed":5,"dir":180},"target":{"x":81,"w":3.1},"title":"Headwind","tag":"Wind","story":"The wind is blowing.","tip":"Headwind: aim lower. Tailwind: aim a little higher."},{"fixed":{"angle":57},"free":["speed"],"world":"Mars","drag":false,"object":"Basketball","target":{"x":105,"w":3},"title":"Mars shot","tag":"Mars","story":"Different gravity on Mars.","tip":"Weaker gravity means longer flights."},{"fixed":{"speed":32},"free":["angle"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":68,"w":3},"title":"Find the angle","tag":"Angle","story":"Speed is locked. Pick the angle.","tip":"Without air there are usually two angles that work: a low one and a high one."},{"fixed":{"angle":33},"free":["speed"],"world":"Earth","drag":false,"object":"Baseball","target":{"x":41,"w":2.9},"title":"Find the speed","tag":"Speed","story":"Angle is locked. Pick the speed.","tip":"More speed means more distance. Adjust in small steps."},{"fixed":{"speed":34},"free":["angle"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":86,"w":2.8},"wall":{"x":46,"h":13},"title":"Over the wall","tag":"Wall","story":"Clear the wall and land on target.","tip":"Go steeper to clear the wall."},{"fixed":{"angle":10},"free":["speed"],"world":"Earth","drag":true,"object":"Golf ball","height":38,"target":{"x":49,"w":2.7},"title":"Cliff throw","tag":"Height","story":"Throw from high up.","tip":"Extra height means extra time in the air."},{"fixed":{"speed":23},"free":["angle"],"world":"Earth","drag":true,"object":"Cannonball","incline":-18,"target":{"x":48,"w":2.7},"title":"Downhill","tag":"Slope","story":"The ground is tilted.","tip":"Uphill needs a steeper angle; downhill a flatter one."},{"fixed":{},"free":["speed","angle"],"world":"Earth","drag":false,"object":"Cannonball","target":{"x":46,"w":2.6},"title":"Free shot","tag":"Expert","story":"Choose both speed and angle.","tip":"Start near 40° and adjust the speed."},{"fixed":{"speed":27},"free":["angle"],"world":"Earth","drag":true,"object":"Football","wind":{"speed":6,"dir":180},"target":{"x":23,"w":2.5},"title":"Headwind","tag":"Wind","story":"The wind is blowing.","tip":"Headwind: aim lower. Tailwind: aim a little higher."},{"fixed":{"angle":41},"free":["speed"],"world":"Moon","drag":false,"object":"Basketball","target":{"x":326,"w":2.5},"title":"Moon shot","tag":"Moon","story":"Different gravity on Moon.","tip":"Weaker gravity means longer flights."},{"fixed":{"speed":25},"free":["angle"],"world":"Earth","drag":false,"object":"Basketball","target":{"x":46,"w":2.4},"title":"Find the angle","tag":"Angle","story":"Speed is locked. Pick the angle.","tip":"Without air there are usually two angles that work: a low one and a high one."},{"fixed":{"angle":38},"free":["speed"],"world":"Earth","drag":false,"object":"Cannonball","target":{"x":49,"w":2.3},"title":"Find the speed","tag":"Speed","story":"Angle is locked. Pick the speed.","tip":"More speed means more distance. Adjust in small steps."},{"fixed":{"speed":25},"free":["angle"],"world":"Earth","drag":true,"object":"Football","target":{"x":27,"w":2.3},"wall":{"x":12,"h":12},"title":"Over the wall","tag":"Wall","story":"Clear the wall and land on target.","tip":"Go steeper to clear the wall."},{"fixed":{"angle":-7},"free":["speed"],"world":"Earth","drag":false,"object":"Baseball","height":51,"target":{"x":50,"w":2.2},"title":"Cliff throw","tag":"Height","story":"Throw from high up.","tip":"Extra height means extra time in the air."},{"fixed":{"speed":21},"free":["angle"],"world":"Earth","drag":true,"object":"Baseball","incline":20,"target":{"x":17,"w":2.1},"title":"Uphill","tag":"Slope","story":"The ground is tilted.","tip":"Uphill needs a steeper angle; downhill a flatter one."},{"fixed":{},"free":["speed","angle"],"world":"Earth","drag":true,"object":"Football","target":{"x":30,"w":2.1},"title":"Free shot","tag":"Expert","story":"Choose both speed and angle.","tip":"Start near 40° and adjust the speed."},{"fixed":{"speed":33},"free":["angle"],"world":"Earth","drag":true,"object":"Cannonball","wind":{"speed":11,"dir":180},"target":{"x":87,"w":2},"title":"Headwind","tag":"Wind","story":"The wind is blowing.","tip":"Headwind: aim lower. Tailwind: aim a little higher."},{"fixed":{"speed":11},"free":["angle"],"world":"Moon","drag":false,"object":"Golf ball","target":{"x":40,"w":1.9},"title":"Moon shot","tag":"Moon","story":"Different gravity on Moon.","tip":"Weaker gravity means longer flights."},{"fixed":{"speed":30},"free":["angle"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":65,"w":1.9},"title":"Find the angle","tag":"Angle","story":"Speed is locked. Pick the angle.","tip":"Without air there are usually two angles that work: a low one and a high one."},{"fixed":{"angle":60},"free":["speed"],"world":"Earth","drag":false,"object":"Golf ball","target":{"x":35,"w":1.8},"title":"Find the speed","tag":"Speed","story":"Angle is locked. Pick the speed.","tip":"More speed means more distance. Adjust in small steps."},{"fixed":{"speed":22},"free":["angle"],"world":"Earth","drag":true,"object":"Cannonball","target":{"x":34,"w":1.7},"wall":{"x":12,"h":13},"title":"Over the wall","tag":"Wall","story":"Clear the wall and land on target.","tip":"Go steeper to clear the wall."},{"fixed":{"angle":26},"free":["speed"],"world":"Earth","drag":false,"object":"Cannonball","height":11,"target":{"x":41,"w":1.6},"title":"Cliff throw","tag":"Height","story":"Throw from high up.","tip":"Extra height means extra time in the air."},{"fixed":{"speed":22},"free":["angle"],"world":"Earth","drag":false,"object":"Football","incline":7,"target":{"x":26,"w":1.6},"title":"Uphill","tag":"Slope","story":"The ground is tilted.","tip":"Uphill needs a steeper angle; downhill a flatter one."},{"fixed":{},"free":["speed","angle"],"world":"Earth","drag":true,"object":"Football","target":{"x":23,"w":1.5},"title":"Free shot","tag":"Expert","story":"Choose both speed and angle.","tip":"Start near 40° and adjust the speed."},{"fixed":{"speed":22},"free":["angle"],"world":"Earth","drag":true,"object":"Basketball","wind":{"speed":10,"dir":180},"target":{"x":9,"w":1.4},"title":"Headwind","tag":"Wind","story":"The wind is blowing.","tip":"Headwind: aim lower. Tailwind: aim a little higher."},{"fixed":{"angle":26},"free":["speed"],"world":"Jupiter","drag":false,"object":"Baseball","target":{"x":17,"w":1.4},"title":"Jupiter shot","tag":"Jupiter","story":"Different gravity on Jupiter.","tip":"Weaker gravity means longer flights."},{"fixed":{"speed":34},"free":["angle"],"world":"Earth","drag":false,"object":"Cannonball","target":{"x":95,"w":1.3},"title":"Find the angle","tag":"Angle","story":"Speed is locked. Pick the angle.","tip":"Without air there are usually two angles that work: a low one and a high one."},{"fixed":{"angle":53},"free":["speed"],"world":"Earth","drag":true,"object":"Golf ball","target":{"x":42,"w":1.2},"title":"Find the speed","tag":"Speed","story":"Angle is locked. Pick the speed.","tip":"More speed means more distance. Adjust in small steps."},{"fixed":{"speed":26},"free":["angle"],"world":"Earth","drag":true,"object":"Golf ball","target":{"x":47,"w":1.2},"wall":{"x":23,"h":8},"title":"Over the wall","tag":"Wall","story":"Clear the wall and land on target.","tip":"Go steeper to clear the wall."}]);

const CH_SLIDERS = {
  speed: ["Speed", 0, 60, 0.1, "m/s", 1],
  angle: ["Launch angle", -10, 89, 0.1, "°", 1],
};

function levelParams(L, vals) {
  const w = PLANETS[L.world];
  const obj = OBJECTS[L.object || "Baseball"];
  return {
    speed: L.fixed.speed ?? vals.speed, angle: L.fixed.angle ?? vals.angle, azimuth: 0,
    height: L.height || 0, incline: L.incline || 0, g: w.g, rho: w.rho,
    mass: obj[0], cd: obj[1], diameter: obj[2] / 100,
    drag: L.drag && w.rho > 0, wind: !!L.wind, windSpeed: L.wind?.speed || 0, windDir: L.wind?.dir || 0,
    bounce: false, restitution: 0.5,
  };
}

// Runs the shot, stopping it at the wall if it hits it
function levelShot(L, vals, steps = 1200) {
  const p = levelParams(L, vals);
  const tr = simulate(p, steps);
  let blocked = false;
  if (L.wall) {
    const tanA = Math.tan(p.incline * RAD), wx = L.wall.x;
    for (let i = 1; i < tr.x.length; i++) {
      if (tr.x[i - 1] < wx && tr.x[i] >= wx) {
        const f = (wx - tr.x[i - 1]) / (tr.x[i] - tr.x[i - 1]);
        const z = tr.z[i - 1] + f * (tr.z[i] - tr.z[i - 1]);
        if (z < wx * tanA + L.wall.h) {
          blocked = true;
          for (const k of ["t", "x", "y", "z", "vx", "vy", "vz"]) {
            const a = tr[k], v = a[i - 1] + f * (a[i] - a[i - 1]);
            a.length = i; a.push(v);
          }
          tr.impacts = [tr.t.length - 1];
          tr.s = summarize(p, tr);
        }
        break;
      }
    }
  }
  const landX = tr.x[tr.s.iImpact];
  const hit = !blocked && Math.abs(landX - L.target.x) <= L.target.w / 2;
  return { p, tr, blocked, landX, hit };
}

// A working solution, for hints (and to check every level can be won)
function levelSolution(L) {
  const quick = (vals) => levelShot(L, vals, 300);
  const angles = L.free.includes("angle") ? [...Array(190)].map((_, i) => -5 + i * 0.5) : [L.fixed.angle];
  let best = null;
  for (const a of angles) {
    let s;
    if (L.free.includes("speed")) {
      // more speed lands farther, so home in on the right speed by halving the gap
      let lo = 0.5, hi = 60;
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2, r = quick({ speed: mid, angle: a });
        if (r.blocked || r.landX < L.target.x) lo = mid; else hi = mid;
      }
      s = (lo + hi) / 2;
    } else s = L.fixed.speed;
    const r = levelShot(L, { speed: s, angle: a });
    if (r.hit) {
      const err = Math.abs(r.landX - L.target.x);
      if (!best || err < best.err) best = { speed: s, angle: a, err };
    }
  }
  return best;
}

function initChallenges(app, el) {
  const saved = app.store.get("challenges", { stars: {}, level: 0 });
  let level = saved.level || 0, shots = 0, ghosts = [], shot = null, t = 0, anim = false, hintsShown = 0;
  let vals = { speed: 20, angle: 30 };
  let lastNow = 0;

  el.innerHTML = `
    <div class="sec-bar">
      <div class="card-sub">Land on the target in as few shots as you can. Three stars for a first-shot hit.</div>
      <div class="score-chip" id="ch-total"></div>
    </div>
    <div class="lp" id="ch-levels"></div>
    <div class="layout ch-layout">
      <section class="card stage-card">
        <div class="head">
          <div><div class="card-title" id="ch-title"></div><div class="card-sub" id="ch-story"></div></div>
          <div class="shots" id="ch-shots"></div>
        </div>
        <div class="stage-wrap"><canvas id="ch-stage"></canvas><div class="banner" id="ch-banner"></div></div>
      </section>
      <aside class="card controls">
        <div class="mission" id="ch-mission"></div>
        <div id="ch-ctl"></div>
        <button class="btn primary big" id="ch-fire">${ICON.play}Fire</button>
        <div class="btnrow">
          <button class="btn" id="ch-hint">${ICON.info}Hint</button>
          <button class="btn ghost" id="ch-reset">${ICON.reset}Restart level</button>
        </div>
        <div id="ch-hintbox"></div>
        ${funFact("games", "Pro tip")}
      </aside>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const cv = $("#ch-stage");

  function persist() { app.store.set("challenges", { stars: saved.stars, level }); }

  // ---- level picker: prev / current level / next, plus a drop-down grouped in tiers of ten
  const TIERS = [["Beginner", "#16A34A"], ["Explorer", "#0284C7"], ["Skilled", "#7C3AED"], ["Expert", "#EA580C"], ["Master", "#DC2626"]];
  let pickerOpen = false, pickerTier = 0;
  const starStr = (n) => `<span class="lp-stars">${"★".repeat(n)}<i>${"★".repeat(3 - n)}</i></span>`;
  const tierOf = (i) => Math.min(TIERS.length - 1, Math.floor(i / 10));
  const tierStars = (k) => LEVELS.slice(k * 10, k * 10 + 10).reduce((a, _, j) => a + (saved.stars[k * 10 + j] || 0), 0);

  function renderLevels() {
    const L = LEVELS[level], total = Object.values(saved.stars).reduce((a, b) => a + b, 0);
    const cleared = Object.values(saved.stars).filter((v) => v > 0).length, [tName, tCol] = TIERS[tierOf(level)];
    $("#ch-total").innerHTML = `★ ${total} / ${LEVELS.length * 3}`;
    $("#ch-levels").innerHTML = `
      <div class="lp-bar">
        <button class="lp-arrow" data-lvl-step="-1" ${level === 0 ? "disabled" : ""} aria-label="Previous level">‹</button>
        <button class="lp-current${pickerOpen ? " open" : ""}" id="lp-toggle" aria-expanded="${pickerOpen}" style="--tc:${tCol}">
          <span class="lp-num">${level + 1}</span>
          <span class="lp-info"><b>${L.title}</b><small><span class="lp-tier">${tName}</span> · ${L.tag} · ${starStr(saved.stars[level] || 0)}</small></span>
          <span class="lp-chev">▾</span>
        </button>
        <button class="lp-arrow" data-lvl-step="1" ${level === LEVELS.length - 1 ? "disabled" : ""} aria-label="Next level">›</button>
      </div>
      <div class="lp-progress"><div class="lp-track"><span style="width:${(cleared / LEVELS.length) * 100}%"></span></div><small>${cleared} of ${LEVELS.length} levels cleared</small></div>
      ${pickerOpen ? pickerHTML() : ""}`;
  }

  function pickerHTML() {
    const k = pickerTier, [, col] = TIERS[k];
    const tabs = TIERS.map(([n, c], j) => `<button data-tier="${j}" class="${j === k ? "on" : ""}" style="--tc:${c}"><b>${n}</b><small>${j * 10 + 1}–${Math.min(LEVELS.length, j * 10 + 10)} · ★${tierStars(j)}/30</small></button>`).join("");
    const cards = LEVELS.slice(k * 10, k * 10 + 10).map((L, j) => {
      const i = k * 10 + j, st = saved.stars[i] || 0;
      return `<button class="lp-card${i === level ? " on" : ""}${st ? " done" : ""}" data-lvl="${i}" style="--tc:${col};animation-delay:${j * 25}ms">
        <span class="lp-cn">${i + 1}</span><span class="lp-ct">${L.title}</span><span class="lp-cg">${L.tag}</span>${starStr(st)}</button>`;
    }).join("");
    return `<div class="lp-panel" role="dialog" aria-label="Choose a level"><div class="lp-tabs">${tabs}</div><div class="lp-grid">${cards}</div></div>`;
  }

  function togglePicker(open = !pickerOpen) { pickerOpen = open; if (open) pickerTier = tierOf(level); renderLevels(); }

  function loadLevel(i) {
    pickerOpen = false;
    level = i; shots = 0; ghosts = []; shot = null; t = 0; anim = false; hintsShown = 0;
    const L = LEVELS[i];
    vals = { speed: L.fixed.speed ?? 20, angle: L.fixed.angle ?? 30 };
    $("#ch-title").textContent = `${i + 1}. ${L.title}`;
    $("#ch-story").textContent = L.story;
    const facts = [`${L.world}${L.drag && PLANETS[L.world].rho > 0 ? ", with air" : ", no air"}`];
    if (L.object) facts.push(L.object);
    if (L.wind) facts.push(`${L.wind.speed} m/s headwind`);
    if (L.height) facts.push(`launch ${L.height} m up`);
    if (L.incline) facts.push(`${L.incline}° slope`);
    if (L.wall) facts.push(`${L.wall.h} m wall at ${L.wall.x} m`);
    const fixed = Object.entries(L.fixed).map(([k, v]) => `${k === "speed" ? "Speed" : "Angle"} locked at <b>${v}${k === "speed" ? " m/s" : "°"}</b>`);
    $("#ch-mission").innerHTML = `<div class="mission-row"><span class="tag">${L.tag}</span>Target at <b>${L.target.x} m</b> (±${L.target.w / 2} m)</div>
      <div class="mission-facts">${facts.join(" · ")}</div>${fixed.length ? `<div class="mission-facts">${fixed.join(" · ")}</div>` : ""}`;
    $("#ch-ctl").innerHTML = L.free.map((k) => sliderBox(k, vals[k], CH_SLIDERS[k])).join("");
    el.querySelectorAll("#ch-ctl input[type=range]").forEach(setPct);
    $("#ch-hintbox").innerHTML = "";
    $("#ch-banner").className = "banner";
    renderLevels(); updateShots(); persist(); draw();
  }

  function updateShots() {
    $("#ch-shots").innerHTML = `<b>${shots}</b> shot${shots === 1 ? "" : "s"}`;
  }

  function aimTrajectory() { return levelShot(LEVELS[level], vals); }

  function draw() {
    const L = LEVELS[level];
    const cur = shot || aimTrajectory();
    const tt = shot ? t : 0;
    let top = Math.max(L.target.x * 0.45, (L.height || 0) + 5, L.wall ? L.wall.h * 1.4 : 0);
    for (const q of [shot?.tr, ...ghosts.map((g) => g.tr)]) if (q) top = Math.max(top, q.s.maxHeight * 1.12);
    const view = [0, Math.max(L.target.x * 1.25, L.target.x + 8), top];
    draw2D(cv, {
      tr: cur.tr, p: cur.p, t: tt, cur: stateAt(cur.tr, tt), pinned: ghosts,
      show: { hmax: false, range: false, vmax: false, vmin: false, vectors: !shot, pinned: true },
      extra: { target: { ...L.target, hit: shot && shot.hit && !anim }, wall: L.wall, hidePath: true, view },
    });
  }

  function loop(now) {
    if (!anim) return;
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 0;
    lastNow = now;
    t += dt * 1.5;
    if (t >= shot.tr.s.endTime) { t = shot.tr.s.endTime; anim = false; finish(); }
    draw();
    if (anim) requestAnimationFrame(loop);
  }

  function fire() {
    if (anim) return;
    if (shot) ghosts = [...ghosts, { tr: shot.tr }].slice(-4);
    shot = aimTrajectory(); shots++; t = 0; anim = true; lastNow = 0;
    $("#ch-banner").className = "banner";
    updateShots();
    requestAnimationFrame(loop);
  }

  function finish() {
    const L = LEVELS[level], b = $("#ch-banner");
    if (shot.hit) {
      const stars = shots <= 1 ? 3 : shots <= 3 ? 2 : 1;
      saved.stars[level] = Math.max(saved.stars[level] || 0, stars);
      persist(); renderLevels();
      b.innerHTML = `<div class="b-big">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div><div><b>Bullseye!</b> Landed at ${shot.landX.toFixed(2)} m in ${shots} shot${shots > 1 ? "s" : ""}.</div>
        ${level < LEVELS.length - 1 ? `<button class="btn primary" data-next>Next level →</button>` : `<div>You've finished every level!</div>`}
        <div class="b-fact">💡 ${pick(TRIVIA.general)}</div>`;
      b.className = "banner show good";
      confetti(el.querySelector(".stage-wrap"));
    } else if (shot.blocked) {
      b.innerHTML = `<div><b>Hit the wall.</b> Go higher to clear ${L.wall.h} m.</div>`;
      b.className = "banner show bad";
    } else {
      const d = shot.landX - L.target.x;
      b.innerHTML = `<div><b>${d < 0 ? "Too short" : "Too far"}</b> by ${Math.abs(d).toFixed(2)} m. Landed at ${shot.landX.toFixed(2)} m.</div>`;
      b.className = "banner show bad";
    }
  }

  function hint() {
    const L = LEVELS[level], box = $("#ch-hintbox");
    hintsShown++;
    let h = `<div class="note">${L.tip}</div>`;
    if (hintsShown >= 2) {
      const sol = levelSolution(L);
      if (sol) {
        const parts = L.free.map((k) => k === "speed" ? `a speed near <b>${Math.round(sol.speed)} m/s</b>` : `an angle near <b>${Math.round(sol.angle)}°</b>`);
        h += `<div class="note warm">Bigger hint: try ${parts.join(" and ")}, then fine-tune.</div>`;
      }
    } else h += `<button class="btn ghost" id="ch-hint2">Still stuck? Show a bigger hint</button>`;
    box.innerHTML = h;
  }

  bindSliders($("#ch-ctl"), CH_SLIDERS, (k, v) => { vals[k] = v; if (!anim) { shot = null; draw(); } },
    { speed: [0, 500, ""], angle: [-10, 89, "angles here go from −10° to 89°"] });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.lvl) return loadLevel(+b.dataset.lvl);
    if (b.dataset.lvlStep) return loadLevel(Math.max(0, Math.min(LEVELS.length - 1, level + +b.dataset.lvlStep)));
    if (b.id === "lp-toggle") return togglePicker();
    if (b.dataset.tier) { pickerTier = +b.dataset.tier; return renderLevels(); }
    if (b.hasAttribute("data-next")) return loadLevel(level + 1);
    if (b.id === "ch-fire") return fire();
    if (b.id === "ch-hint" || b.id === "ch-hint2") return hint();
    if (b.id === "ch-reset") return loadLevel(level);
  });
  // close the level list when tapping elsewhere or pressing Escape
  el.ownerDocument.addEventListener("pointerdown", (e) => {
    if (pickerOpen && !e.composedPath().includes($("#ch-levels"))) togglePicker(false);
  });
  el.addEventListener("keydown", (e) => { if (e.key === "Escape" && pickerOpen) togglePicker(false); });
  new ResizeObserver(() => { if (!anim) draw(); }).observe(cv);

  loadLevel(level);
  return { show() { draw(); } };
}
