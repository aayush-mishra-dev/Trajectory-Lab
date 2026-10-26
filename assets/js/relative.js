// ===================================================================
//  Relative motion
//  River & boat: upstream/downstream, fastest crossing, shortest path.
//  Rain & umbrella: how rain looks to someone walking, and how to tilt.
// ===================================================================

const RIVER_DEFS = {
  width: ["River width", 20, 300, 5, "m", 0],
  flow: ["River speed", 0, 8, 0.1, "m/s", 1],
  boat: ["Boat speed in still water", 0.5, 12, 0.1, "m/s", 1],
  head: ["Boat heading", -80, 80, 1, "°", 0],
  dist: ["Distance along the river", 50, 1500, 10, "m", 0],
};
const RAIN_DEFS = {
  rain: ["Rain speed", 2, 20, 0.5, "m/s", 1],
  slant: ["Rain slant from wind", -45, 45, 1, "°", 0],
  walk: ["Your walking speed", 0, 8, 0.1, "m/s", 1],
};
// how far you can type past each slider
const REL_LIMITS = {
  width: [1, 100000, ""], flow: [0, 100, "that's faster than any river on Earth"], boat: [0.1, 300, ""],
  dist: [1, 100000, ""], head: [-89, 89, "at 90° the boat would point straight along the river"],
  rain: [0.5, 100, ""], slant: [-80, 80, "any more and the rain would be falling sideways"], walk: [0, 50, "that's already faster than a car in town"],
};
const RIVER_MODES = {
  updown: ["Upstream & downstream", "A trip along the river and back"],
  fast: ["Cross in the least time", "Point straight across"],
  short: ["Cross by the shortest path", "Land exactly opposite"],
  custom: ["Pick your own angle", "Try any heading"],
};
const RAIN_MODES = {
  stand: ["Standing still", "Rain as it really falls"],
  walk: ["Walking", "Rain seems to slant at you"],
  vertical: ["Make it look vertical", "Walk with the wind"],
};
const RV = { boat: "#F97316", river: "#0369A1", actual: "#CA8A04", down: "#0284C7", up: "#7C3AED", rain: "#2563EB", you: "#EA580C", feel: "#7C3AED" };

// small seeded random numbers, so scenery looks the same every time
function seeded(n) { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
const hash01 = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Text label in a white rounded box, centred on (x, y)
function tag(ctx, text, x, y, color, size = 12) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + 12, h = size + 9;
  ctx.fillStyle = "rgba(255,255,255,0.95)"; roundRect(ctx, x - w / 2, y - h / 2, w, h, 7); ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y + 0.5);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  return { x: x - w / 2, y: y - h / 2, w, h };
}
// Places labels at arrow tips, nudging any that would overlap
function tipTags(ctx, items) {
  const boxes = [];
  for (const it of items) {
    const a = Math.atan2(it.y1 - it.y0, it.x1 - it.x0);
    let x = it.x1 + Math.cos(a) * 22, y = it.y1 + Math.sin(a) * 16;
    ctx.font = `700 12px ${FONT}`;
    const w = ctx.measureText(it.text).width + 12;
    for (let k = 0; k < 6; k++) {
      const hit = boxes.find((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 2 && Math.abs(b.y - y) < 23);
      if (!hit) break;
      y = hit.y + (y >= hit.y ? 24 : -24);
    }
    boxes.push({ x, y, w });
    tag(ctx, it.text, x, y, it.color);
  }
}

function initRelative(app, el) {
  const st = app.store.get("relative2", {
    tab: "river",
    river: { mode: "fast", width: 120, flow: 2.5, boat: 4, head: 20, dist: 400 },
    rain: { mode: "walk", rain: 8, slant: 0, walk: 3, view: "ground", hold: "tilt" },
  });
  const save = () => app.store.set("relative2", st);
  let playing = true, ended = false, simT = 0, last = 0, raf = null;
  let wake = [], wakeClock = 0, drops = [], splashes = [], wetAvg = 0, tilt = null, walkPhase = 0, manX = null;

  el.innerHTML = `
    <div class="page-intro"><div><div class="page-title">Relative motion</div>
      <div class="card-sub">The same motion looks different depending on who's watching. See it with a boat on a river and a walk in the rain.</div></div></div>
    <div class="subnav" id="rl-tabs">
      <button data-rtab="river"><b>🚤 River & boat</b><small>Upstream, downstream and crossing</small></button>
      <button data-rtab="rain"><b>☔ Rain & umbrella</b><small>How rain looks while you walk</small></button>
    </div>
    ${funFact("relative")}
    <div class="layout tool-layout">
      <section class="card stage-card">
        <div class="head"><div><div class="card-title" id="rl-title"></div><div class="card-sub" id="rl-sub"></div></div></div>
        <div class="stage-wrap"><canvas id="rl-canvas" class="rel-canvas"></canvas></div>
        <div class="transport">
          <button class="ibtn" id="rl-restart" title="Start again" aria-label="Start again">${ICON.reset}</button>
          <button class="ibtn play playing" id="rl-play" aria-label="Play or pause">
            <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z"/></svg>
            <svg class="i-pause" viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>
          </button>
          <div class="rl-time" id="rl-time"></div>
        </div>
        <div class="stats" id="rl-stats"></div>
      </section>
      <aside class="card controls" id="rl-side"></aside>
    </div>
    <details class="drop rl-maths" id="rl-maths" open>
      <summary><span class="drop-ic" style="--c:#DB2777">∑</span><span><b>How it's worked out</b><small id="rl-maths-sub">Step-by-step working</small></span></summary>
      <div class="drop-body"><div id="rl-work" class="working rl-working"></div></div>
    </details>`;
  const $ = (s) => el.querySelector(s), cv = $("#rl-canvas");

  const step = (n, a, b) => `<div class="wstep"><span class="wn">${n}</span><div><b>${a}</b><div>${b}</div></div></div>`;
  const tile = (lbl, val, unit, c) => `<div class="stat" style="--c:${c}"><div class="lbl">${lbl}</div><div class="val">${val}<small>${unit}</small></div></div>`;
  const modeCards = (modes, cur, attr) => `<div class="mode-cards">${Object.entries(modes).map(([k, [t, s]]) =>
    `<button ${attr}="${k}" class="${cur === k ? "on" : ""}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>`;
  const group = (n, title, sub, body) => `<div class="pgroup"><div class="pg-head"><span class="pg-n">${n}</span><div><b>${title}</b><small>${sub}</small></div></div>${body}</div>`;

  // play each scene in about 8 seconds, however long it really takes
  const speedUp = (T) => Math.max(1, T / 8);
  const speedNote = (T) => speedUp(T) < 1.5 ? "Shown in real time" : `Shown ${speedUp(T).toFixed(0)}× faster than real life`;

  // =====================================================================
  //  RIVER & BOAT: the numbers
  // =====================================================================
  function river() {
    const r = st.river;
    let th = r.head;                                 // degrees, + = pointing upstream
    if (r.mode === "fast") th = 0;
    if (r.mode === "short") th = r.boat > r.flow ? Math.asin(r.flow / r.boat) / RAD : null;
    if (th == null) return { impossible: true };
    const across = r.boat * Math.cos(th * RAD), along = r.flow - r.boat * Math.sin(th * RAD);
    const T = r.width / across;
    return { th, across, along, T, drift: along * T, speed: Math.hypot(across, along) };
  }
  function updown() {
    const r = st.river, down = r.boat + r.flow, up = r.boat - r.flow;
    const tDown = r.dist / down, tUp = up > 1e-9 ? r.dist / up : Infinity;
    return { down, up, tDown, tUp, total: tDown + tUp, still: 2 * r.dist / r.boat };
  }
  function riverEnd() {
    if (st.river.mode === "updown") { const u = updown(); return isFinite(u.total) ? Math.max(u.total, u.still) : u.still * 1.6; }
    const c = river(); return c.impossible ? 1 : c.T;
  }

  function riverSide() {
    const r = st.river, ud = r.mode === "updown";
    let h = `<div class="group-label">What do you want to see?</div>` + modeCards(RIVER_MODES, r.mode, "data-rmode");
    h += group(1, "The river and the boat", "Speeds measured from the bank", sliderBox("flow", r.flow, RIVER_DEFS.flow) + sliderBox("boat", r.boat, RIVER_DEFS.boat));
    h += group(2, ud ? "The trip" : "The crossing", ud ? "From A downstream to B, then back" : "Straight across, bank to bank",
      (ud ? sliderBox("dist", r.dist, RIVER_DEFS.dist) : sliderBox("width", r.width, RIVER_DEFS.width)) +
      (r.mode === "custom" ? sliderBox("head", r.head, RIVER_DEFS.head) + `<div class="hint">Measured from straight across. Positive points upstream, negative downstream.</div>` : ""));
    $("#rl-side").innerHTML = h;
    el.querySelectorAll("#rl-side input[type=range]").forEach(setPct);
    riverOut();
  }

  function riverOut() {
    const r = st.river;
    let work = "", stats = "";
    if (r.mode === "updown") {
      const u = updown();
      work = step(1, "Going downstream", `The river helps: ${r.boat} + ${r.flow} = <b>${u.down.toFixed(1)} m/s</b>, so A → B takes ${r.dist} ÷ ${u.down.toFixed(1)} = <b>${u.tDown.toFixed(1)} s</b>`) +
        step(2, "Coming back upstream", u.up > 0 ? `The river holds you back: ${r.boat} − ${r.flow} = <b>${u.up.toFixed(1)} m/s</b>, so B → A takes <b>${u.tUp.toFixed(1)} s</b>` :
          `The boat (${r.boat} m/s) is no faster than the river (${r.flow} m/s), so it <b>can never get back</b>.`) +
        (u.up > 0 ? step(3, "Compare with still water", `Round trip <b>${u.total.toFixed(1)} s</b> here vs <b>${u.still.toFixed(1)} s</b> in still water. You spend longer on the slow leg, so a current always makes a round trip slower.`) : "");
      stats = tile("Downstream", u.down.toFixed(1), "m/s", RV.down) + tile("Upstream", Math.max(u.up, 0).toFixed(1), "m/s", RV.up) +
        tile("Round trip", isFinite(u.total) ? u.total.toFixed(0) : "never", isFinite(u.total) ? "s" : "", "#EA580C") + tile("Still water", u.still.toFixed(0), "s", "#059669");
    } else {
      const c = river();
      if (c.impossible) {
        work = `<div class="feedback bad"><b>Not possible here.</b> The boat (${r.boat} m/s) isn't faster than the river (${r.flow} m/s). However it points, the river wins, so it can never land straight opposite. Make the boat faster or the river slower.</div>`;
        stats = tile("Shortest path", "—", "", "#DC2626") + tile("Boat", r.boat.toFixed(1), "m/s", RV.boat) + tile("River", r.flow.toFixed(1), "m/s", RV.river) + tile("Needs boat >", r.flow.toFixed(1), "m/s", "#059669");
      } else {
        const why = r.mode === "fast" ? "Point <b>straight across</b>. Then all of the boat's speed goes into crossing, and the river pushing sideways can't slow that down." :
          r.mode === "short" ? `Point upstream so the boat's upstream part cancels the river: sin θ = ${r.flow} ÷ ${r.boat}, so <b>θ = ${c.th.toFixed(1)}°</b>.` :
          c.th === 0 ? "You pointed the boat <b>straight across</b>." : `You pointed the boat <b>${Math.abs(c.th)}° ${c.th > 0 ? "upstream" : "downstream"}</b>.`;
        work = step(1, "Which way to point", why) +
          step(2, "Speed across the river", `${r.boat} × cos ${c.th.toFixed(1)}° = <b>${c.across.toFixed(2)} m/s</b>`) +
          step(3, "Time to cross", `${r.width} m ÷ ${c.across.toFixed(2)} m/s = <b>${c.T.toFixed(1)} s</b>`) +
          step(4, "Carried along the river", `(${r.flow} − ${r.boat} × sin ${c.th.toFixed(1)}°) × ${c.T.toFixed(1)} = <b>${Math.abs(c.drift).toFixed(1)} m ${Math.abs(c.drift) < 0.05 ? "(none!)" : c.drift > 0 ? "downstream" : "upstream"}</b>`) +
          step(5, "Speed seen from the bank", `√(${c.across.toFixed(2)}² + ${c.along.toFixed(2)}²) = <b>${c.speed.toFixed(2)} m/s</b>`) +
          `<div class="note">${r.mode === "fast" ? "This is the <b>fastest</b> way over, but you land downstream." : r.mode === "short" ? "This is the <b>shortest</b> path, but it takes longer than pointing straight across." : "Try 0° for the fastest crossing, or the angle from “shortest path” to land opposite."}</div>`;
        const dr = Math.abs(c.drift) < 0.05 ? ["0", "m"] : [Math.abs(c.drift).toFixed(1), `m ${c.drift > 0 ? "down" : "up"}`];
        stats = tile("Time to cross", c.T.toFixed(1), "s", RV.down) + tile("Lands", dr[0], dr[1], "#EA580C") +
          tile("Points", Math.abs(c.th).toFixed(1), `° ${c.th > 0.05 ? "up" : c.th < -0.05 ? "down" : ""}`, RV.up) + tile("Real speed", c.speed.toFixed(2), "m/s", "#059669");
      }
    }
    $("#rl-work").innerHTML = work;
    $("#rl-stats").innerHTML = stats;
  }

  // =====================================================================
  //  RIVER & BOAT: the picture
  // =====================================================================
  const tufts = (() => { const R = seeded(3); return Array.from({ length: 90 }, () => ({ x: R(), y: R(), s: 1.5 + R() * 3, d: R() })); })();
  const ripples = (() => { const R = seeded(8); return Array.from({ length: 60 }, () => ({ x: R(), y: R(), l: 12 + R() * 26 })); })();
  const trees = (() => { const R = seeded(11); return Array.from({ length: 16 }, () => ({ x: R(), s: 0.7 + R() * 0.6, top: R() < 0.5 })); })();

  function scenery(ctx, W, H, top, bot, s, flowSpeed) {
    // grass with darker speckles, sandy edges, a few trees
    ctx.fillStyle = "#8BCB7C"; ctx.fillRect(0, 0, W, H);
    for (const t of tufts) {
      const y = t.y < 0.5 ? t.y * 2 * (top - 8) : bot + 8 + (t.y - 0.5) * 2 * (H - bot - 8);
      ctx.fillStyle = t.d < 0.5 ? "#76B867" : "#9FD68F";
      ctx.beginPath(); ctx.arc(t.x * W, y, t.s, 0, 7); ctx.fill();
    }
    for (const t of trees) {
      const bandH = t.top ? top - 6 : H - bot - 6;
      if (bandH < 30) continue;
      const x = t.x * W, y = t.top ? bandH * 0.45 : bot + 6 + bandH * 0.55, r = Math.min(bandH * 0.32, 13) * t.s;
      ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.beginPath(); ctx.arc(x + 3, y + 3, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#4F9A45"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#63B157"; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, 7); ctx.fill();
    }
    ctx.fillStyle = "#EAD9A8"; ctx.fillRect(0, top - 7, W, 7); ctx.fillRect(0, bot, W, 7);
    // water
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "#4FB3E8"); g.addColorStop(0.5, "#1D8AD0"); g.addColorStop(1, "#4FB3E8");
    ctx.fillStyle = g; ctx.fillRect(0, top, W, bot - top);
    // ripples drift with the current: this is what tells you the water is moving
    const flowPx = flowSpeed * s, span = W + 80;
    ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    for (const q of ripples) {
      const x = ((q.x * span + simT * flowPx) % span) - 40, y = top + 8 + q.y * (bot - top - 16);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + q.l / 2, y - 3, x + q.l, y); ctx.stroke();
    }
    // current indicator
    ctx.font = `700 12px ${FONT}`;
    const label = flowSpeed > 0 ? `Current ${flowSpeed.toFixed(1)} m/s →` : "Still water";
    tag(ctx, label, 12 + ctx.measureText(label).width / 2 + 6, top + 16, RV.river);
  }

  function drawRiver(dt, real) {
    const { ctx, w: W, h: H } = prepCanvas(cv), r = st.river, phone = W < 560;
    if (r.mode === "updown") return drawUpdown(ctx, W, H, phone);
    const c = river();
    const bank = phone ? 46 : 58, margin = phone ? 40 : 70;
    if (c.impossible) {
      scenery(ctx, W, H, bank, H - bank, 10, r.flow);
      boat(ctx, W / 2 + Math.sin(simT) * 3, H / 2, -Math.PI / 2, phone ? 1 : 1.3);
      tag(ctx, "Boat slower than the river: it can't land opposite", W / 2, H / 2 - 56, "#DC2626", 13);
      $("#rl-time").innerHTML = `<b>Not possible</b><small>Make the boat faster than the river</small>`;
      return;
    }
    // fit the river width and the drift on screen
    const maxWater = H - 2 * bank;
    let s = maxWater / r.width;
    if (Math.abs(c.drift) > 0.01) s = Math.min(s, (W - 2 * margin) / Math.abs(c.drift));
    const waterH = r.width * s, top = (H - waterH) / 2, bot = top + waterH;
    scenery(ctx, W, H, top, bot, s, r.flow);

    const t = Math.min(simT, c.T);
    const sx = (W - c.drift * s) / 2;
    const A = { x: sx, y: bot }, B = { x: sx, y: top }, C = { x: sx + c.drift * s, y: top };
    const bx = A.x + c.along * t * s, by = A.y - c.across * t * s;

    // dashed lines: straight across (white) and the path it will take (yellow)
    ctx.setLineDash([6, 7]); ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.strokeStyle = "rgba(253,224,71,0.75)"; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); ctx.stroke();
    ctx.setLineDash([]);

    // wake: rings left behind that drift away with the current
    wakeClock += real;
    const headAng = Math.atan2(-Math.cos(c.th * RAD), -Math.sin(c.th * RAD));
    if (playing && simT < c.T && wakeClock > 0.07) {
      wakeClock = 0;
      wake.push({ x: bx - Math.cos(headAng) * 22, y: by - Math.sin(headAng) * 22, age: 0 });
    }
    for (const w of wake) { w.age += real; w.x += r.flow * s * dt; }
    wake = wake.filter((w) => w.age < 1.8);
    ctx.lineWidth = 1.6;
    for (const w of wake) {
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - w.age / 1.8)})`;
      ctx.beginPath(); ctx.ellipse(w.x, w.y, 3 + w.age * 12, 2 + w.age * 7, headAng, 0, 7); ctx.stroke();
    }
    // the part of the path already travelled
    ctx.strokeStyle = "#FDE047"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(bx, by); ctx.stroke();

    // banks: start jetty, opposite point and landing point
    jetty(ctx, A.x, bot);
    const near = Math.abs(c.drift * s) < 34;
    const flags = [{ x: B.x, color: near ? "#16A34A" : "#DC2626", text: near ? "Lands right opposite" : "Opposite" }];
    if (!near) flags.push({ x: C.x, color: "#F59E0B", text: `Lands ${Math.abs(c.drift).toFixed(0)} m ${c.drift > 0 ? "down" : "up"}` });
    for (const f of flags) flag(ctx, f.x, top, f.color);

    // the boat points where it's steered, but moves along the yellow line
    const k = phone ? 1 : 1.3;
    boat(ctx, bx, by, headAng, k);

    // velocity arrows with their values (put away once it has landed)
    if (simT < c.T) {
    const kv = (phone ? 58 : 90) / Math.max(r.boat, r.flow, c.speed, 0.1);
    const ends = {
      boat: [bx - r.boat * Math.sin(c.th * RAD) * kv, by - r.boat * Math.cos(c.th * RAD) * kv],
      river: [bx + r.flow * kv, by],
      actual: [bx + c.along * kv, by - c.across * kv],
    };
    arrow(ctx, bx, by, ...ends.boat, RV.boat, 3.5);
    if (r.flow > 0) arrow(ctx, bx, by, ...ends.river, "#FFFFFF", 3.5);
    arrow(ctx, bx, by, ...ends.actual, "#FDE047", 3.5);
    tipTags(ctx, [
      { x0: bx, y0: by, x1: ends.boat[0], y1: ends.boat[1], text: `boat ${r.boat.toFixed(1)}`, color: RV.boat },
      { x0: bx, y0: by, x1: ends.actual[0], y1: ends.actual[1], text: `actual ${c.speed.toFixed(1)}`, color: RV.actual },
      ...(r.flow > 0 ? [{ x0: bx, y0: by, x1: ends.river[0], y1: ends.river[1], text: `river ${r.flow.toFixed(1)}`, color: RV.river }] : []),
    ]);
    }

    // flag labels go on top of everything, pushed apart so they never overlap
    flagLabels(ctx, W, top, flags);
    // the triangle of velocities, in a corner away from the path
    const insetX = c.drift >= 0 ? W - 200 : 10;
    if (!phone) vectorInset(ctx, insetX, bot - 160, 190, 150, c);
    if (simT >= c.T) {
      const freeMid = phone ? W / 2 : c.drift >= 0 ? (W - 210) / 2 : 210 + (W - 210) / 2;
      tag(ctx, `Landed after ${c.T.toFixed(1)} s ✓`, freeMid, (top + bot) / 2, "#15803D", 13);
    }
    $("#rl-time").innerHTML = `<b>${t.toFixed(1)} s <span>of ${c.T.toFixed(1)} s</span></b><small>${speedNote(c.T)}</small>`;
  }

  function drawUpdown(ctx, W, H, phone) {
    const r = st.river, u = updown();
    const panel = phone ? 92 : 100, bank = phone ? 30 : 40;
    const top = bank, bot = H - panel - bank;
    const x0 = phone ? 40 : 70, x1 = W - (phone ? 40 : 70), s = (x1 - x0) / r.dist;
    scenery(ctx, W, H - panel, top, bot, s, r.flow);
    // white timeline panel at the bottom
    ctx.fillStyle = "#fff"; ctx.fillRect(0, H - panel, W, panel);
    ctx.fillStyle = "#E3E8F0"; ctx.fillRect(0, H - panel, W, 1);

    // A and B markers across the water
    ctx.setLineDash([5, 6]); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.75)";
    for (const x of [x0, x1]) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke(); }
    ctx.setLineDash([]);
    tag(ctx, "A", x0, top - 12 > 8 ? top - 14 : top + 12, COL.navy);
    tag(ctx, `B · ${r.dist} m`, x1, top - 12 > 8 ? top - 14 : top + 12, COL.navy);

    const lanes = [
      { y: top + (bot - top) * 0.32, name: "In this river", down: u.down, up: u.up, color: RV.boat },
      { y: top + (bot - top) * 0.74, name: "In still water", down: r.boat, up: r.boat, color: "#94A3B8" },
    ];
    const tMax = isFinite(u.total) ? Math.max(u.total, u.still) : u.still * 1.6;
    const bar0 = phone ? 74 : 110, bar1 = W - 16, bw = bar1 - bar0;
    lanes.forEach((L, i) => {
      const tDown = r.dist / L.down, tUp = L.up > 1e-9 ? r.dist / L.up : Infinity;
      let x, dir, v, state;
      if (simT < tDown) { x = x0 + L.down * simT * s; dir = 0; v = L.down; state = "down"; }
      else if (L.up > 1e-9) {
        const tt = simT - tDown;
        if (tt >= tUp) { x = x0; dir = Math.PI; v = 0; state = "home"; }
        else { x = x1 - L.up * tt * s; dir = Math.PI; v = L.up; state = "up"; }
      } else { x = Math.min(W + 60, x1 - L.up * (simT - tDown) * s); dir = Math.PI; v = L.up; state = "swept"; }
      const k = phone ? 0.95 : 1.15;
      boat(ctx, x, L.y, dir, k, L.color);
      if (state === "down" || state === "up" || state === "swept") {
        const len = Math.max(16, (phone ? 46 : 70) * Math.abs(v) / Math.max(u.down, 0.1));
        const sgn = state === "down" || state === "swept" ? 1 : -1, ax = x + sgn * 30;
        arrow(ctx, ax, L.y, ax + sgn * len, L.y, state === "down" ? RV.down : state === "up" ? RV.up : "#DC2626", 3);
        tag(ctx, state === "swept" ? "swept away" : `${Math.abs(v).toFixed(1)} m/s`, ax + sgn * len / 2, L.y - 22, state === "down" ? RV.down : state === "up" ? RV.up : "#DC2626", 11);
      }
      if (state === "home") tag(ctx, `Back at A · ${(tDown + tUp).toFixed(0)} s ✓`, Math.min(x0 + 90, W / 2), L.y + 32, "#15803D", 11);

      // timeline bar: blue = going down, purple = coming back
      const by = H - panel + 22 + i * 38;
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(18, by + 9, 5, 0, 7); ctx.fill();
      ctx.font = `700 12px ${FONT}`; ctx.fillStyle = i === 0 ? "#C2410C" : "#475569";
      ctx.fillText(phone ? (i === 0 ? "River" : "Still") : (i === 0 ? "In the river" : "Still water"), 28, by + 13);
      ctx.fillStyle = "#F1F5F9"; roundRect(ctx, bar0, by, bw, 18, 6); ctx.fill();
      const wDown = bw * Math.min(tDown / tMax, 1), wUp = isFinite(tUp) ? bw * Math.min(tUp / tMax, 1) : bw - wDown;
      ctx.fillStyle = RV.down; roundRect(ctx, bar0, by, wDown, 18, 6); ctx.fill();
      ctx.fillStyle = isFinite(tUp) ? RV.up : "#FCA5A5"; roundRect(ctx, bar0 + wDown, by, Math.min(wUp, bw - wDown), 18, 6); ctx.fill();
      ctx.font = `700 11px ${FONT}`; ctx.fillStyle = "#fff";
      if (wDown > 54) ctx.fillText(`→ ${tDown.toFixed(0)} s`, bar0 + 7, by + 13);
      if (wUp > 54) ctx.fillText(isFinite(tUp) ? `← ${tUp.toFixed(0)} s` : "never back", bar0 + wDown + 7, by + 13);
      // how far through the trip we are: a small pointer above the bar, clear of the numbers
      const mx = bar0 + bw * Math.min(simT / tMax, 1);
      ctx.fillStyle = COL.navy; ctx.beginPath(); ctx.moveTo(mx - 5, by - 7); ctx.lineTo(mx + 5, by - 7); ctx.lineTo(mx, by - 1); ctx.fill();
    });
    const end = tMax;
    $("#rl-time").innerHTML = `<b>${Math.min(simT, end).toFixed(0)} s</b><small>${speedNote(end)}</small>`;
  }

  function boat(ctx, x, y, ang, k = 1, color = RV.boat) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
    ctx.fillStyle = "rgba(0,30,60,0.22)"; ctx.beginPath(); ctx.ellipse(3, 4, 24, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(26, 0); ctx.bezierCurveTo(16, -11, -6, -11, -18, -9); ctx.lineTo(-18, 9); ctx.bezierCurveTo(-6, 11, 16, 11, 26, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)"; roundRect(ctx, -10, -5.5, 14, 11, 3); ctx.fill();
    ctx.fillStyle = "#1E3A8A"; ctx.beginPath(); ctx.arc(-3, 0, 3, 0, 7); ctx.fill();
    ctx.fillStyle = "#334155"; ctx.fillRect(-21, -3, 4, 6);   // outboard motor
    ctx.restore();
  }
  function flag(ctx, x, y, color) {
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, y - 30); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 17, y - 25); ctx.lineTo(x, y - 20); ctx.fill();
  }
  function flagLabels(ctx, W, y, flags) {
    ctx.font = `700 11px ${FONT}`;
    const L = flags.map((f) => { const w = ctx.measureText(f.text).width + 12; return { ...f, w, cx: Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, f.x)) }; })
      .sort((a, b) => a.cx - b.cx);
    if (L.length === 2) {
      const gap = L[1].cx - L[0].cx - (L[0].w + L[1].w) / 2 - 8;
      if (gap < 0) { L[0].cx += gap / 2; L[1].cx -= gap / 2; }
      for (const l of L) l.cx = Math.max(l.w / 2 + 4, Math.min(W - l.w / 2 - 4, l.cx));
      if (L[1].cx - L[0].cx < (L[0].w + L[1].w) / 2 + 4) L[1].row = 1;     // still no room: put it on a second line
    }
    for (const l of L) tag(ctx, l.text, l.cx, Math.max(12, y - 44) + (l.row ? 22 : 0), "#14532D", 11);
  }
  function jetty(ctx, x, y) {
    ctx.fillStyle = "#8B5E3C"; ctx.fillRect(x - 18, y - 4, 36, 14);
    ctx.fillStyle = "#6B4528"; for (let i = -14; i < 18; i += 8) ctx.fillRect(x + i, y - 4, 2, 14);
    tag(ctx, "Start", x, y + 24, "#14532D", 11);
  }
  // boat + river = actual, drawn as a triangle scaled to fit its box
  function vectorInset(ctx, x, y, w, h, c) {
    const r = st.river;
    ctx.fillStyle = "rgba(255,255,255,0.95)"; roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.font = `700 ${w < 160 ? 10.5 : 12}px ${FONT}`; ctx.fillStyle = COL.navy; ctx.fillText("boat + river = actual", x + 10, y + 18);
    const P0 = [0, 0], P1 = [-r.boat * Math.sin(c.th * RAD), -r.boat * Math.cos(c.th * RAD)], P2 = [P1[0] + r.flow, P1[1]];
    const xs = [P0[0], P1[0], P2[0]], ys = [P0[1], P1[1], P2[1]];
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const k = Math.min((w - 50) / Math.max(maxx - minx, 0.1), (h - 46) / Math.max(maxy - miny, 0.1));
    const ox = x + 25 + ((w - 50) - (maxx - minx) * k) / 2 - minx * k, oy = y + 30 + ((h - 46) - (maxy - miny) * k) / 2 - miny * k;
    const p = (P) => [ox + P[0] * k, oy + P[1] * k];
    arrow(ctx, ...p(P0), ...p(P1), RV.boat, 3);
    if (r.flow > 0) arrow(ctx, ...p(P1), ...p(P2), RV.river, 3);
    arrow(ctx, ...p(P0), ...p(P2), RV.actual, 3);
  }

  // =====================================================================
  //  RAIN & UMBRELLA: the numbers
  // =====================================================================
  function rain() {
    const r = st.rain;
    const rx = r.rain * Math.sin(r.slant * RAD), ry = r.rain * Math.cos(r.slant * RAD);   // + rx = blowing forward (right)
    const man = r.mode === "stand" ? 0 : r.mode === "vertical" ? rx : r.walk;
    const ax = rx - man;                                          // rain relative to you
    const ang = Math.atan2(-ax, ry) / RAD;                        // umbrella tilt: + = forward
    return { rx, ry, man, ax, ang, app: Math.hypot(ax, ry) };
  }

  function rainSide() {
    const r = st.rain;
    let h = `<div class="group-label">What are you doing?</div>` + modeCards(RAIN_MODES, r.mode, "data-wmode");
    h += group(1, "The rain", "As someone standing still sees it",
      sliderBox("rain", r.rain, RAIN_DEFS.rain) + sliderBox("slant", r.slant, RAIN_DEFS.slant) + `<div class="hint">0° falls straight down. Positive blows the way you walk.</div>`);
    if (r.mode === "walk") h += group(2, "You", "Walking to the right", sliderBox("walk", r.walk, RAIN_DEFS.walk));
    h += `<div class="group-label">Watch from</div><div class="seg" data-view><button data-val="ground" class="${r.view === "ground" ? "on" : ""}">🧍 The pavement</button><button data-val="man" class="${r.view === "man" ? "on" : ""}">🚶 The walker</button></div>`;
    h += `<div class="group-label">Hold the umbrella</div><div class="seg" data-hold><button data-val="tilt" class="${r.hold === "tilt" ? "on" : ""}">☂️ Tilted right</button><button data-val="straight" class="${r.hold === "straight" ? "on" : ""}">Straight up</button></div>`;
    $("#rl-side").innerHTML = h;
    el.querySelectorAll("#rl-side input[type=range]").forEach(setPct);
    rainOut();
  }

  function rainOut() {
    const r = st.rain, c = rain();
    const side = (v, pos, neg) => Math.abs(v) < 0.005 ? "no sideways part" : `${Math.abs(v).toFixed(2)} m/s ${v > 0 ? pos : neg}`;
    const dir = Math.abs(c.ang) < 0.5 ? "straight up" : `${Math.abs(c.ang).toFixed(1)}° ${c.ang > 0 ? "forward" : "backward"}`;
    $("#rl-work").innerHTML =
      step(1, "The rain, from the pavement", `${side(c.rx, "forward", "backward")}, and ${c.ry.toFixed(2)} m/s down`) +
      step(2, "Your velocity", r.mode === "vertical" ? `<b>${Math.abs(c.man).toFixed(2)} m/s ${c.man >= 0 ? "forward" : "backward"}</b>: the same as the rain's sideways part` : `<b>${c.man.toFixed(2)} m/s</b> forward`) +
      step(3, "Rain as you feel it = rain − you", `${side(c.ax, "from behind", "into your face")}, ${c.ry.toFixed(2)} m/s down → <b>${c.app.toFixed(2)} m/s</b>`) +
      step(4, "Tilt the umbrella towards it", `tan θ = ${Math.abs(c.ax).toFixed(2)} ÷ ${c.ry.toFixed(2)}, so θ = <b>${dir}</b>`) +
      `<div class="note">${r.mode === "vertical" ? (Math.abs(c.rx) < 0.01 ? "The rain is already falling straight down, so just stand still." : "Moving with the rain's sideways speed cancels it, so to you the rain falls straight down.") :
        c.man > 0 ? "Walking into the rain makes it seem to come at you from the front. The faster you walk, the more it slants." :
        "Standing still, you feel the rain exactly as it falls."}</div>`;
    $("#rl-stats").innerHTML = tile("Rain you feel", c.app.toFixed(2), "m/s", RV.feel) + tile("Comes from", Math.abs(c.ang).toFixed(1), `° ${c.ang > 0.5 ? "ahead" : c.ang < -0.5 ? "behind" : ""}`, RV.rain) +
      tile("Your speed", Math.abs(c.man).toFixed(2), "m/s", RV.you) + `<div class="stat" style="--c:#0EA5E9"><div class="lbl">How wet you get</div><div class="wet" id="rl-wetbox"><span id="rl-wet"></span></div></div>`;
  }

  // =====================================================================
  //  RAIN & UMBRELLA: the picture
  // =====================================================================
  const clouds = (() => { const R = seeded(5); return Array.from({ length: 6 }, () => ({ x: R(), y: 0.03 + R() * 0.14, s: 0.7 + R() * 0.7 })); })();
  const SLOW = 0.4;   // rain is far too fast to follow, so it's shown slowed down

  function drawRain(dt) {
    const { ctx, w: W, h: H } = prepCanvas(cv), r = st.rain, c = rain();
    const phone = W < 560, u = Math.min(H / 330, W / 400);                       // u = size of one drawing unit
    const ground = H - 52 * u, PX = 80 * u;                   // a person (1.75 m) is about 140 units tall
    const manView = r.view === "man";
    const manV = c.man * PX * SLOW;                           // walker speed on screen, px/s
    if (manX == null) manX = (Math.abs(c.man) > 0.01 ? W * 0.25 : W * 0.42) + 80;   // start where you can see them
    if (playing) { manX += manV * dt; walkPhase += (Math.abs(c.man) > 0.01 ? 2 + Math.abs(c.man) * 1.1 : 0) * dt; }
    const span = W + 160;
    const screenMan = manView ? W * 0.38 : ((manX % span) + span) % span - 80;
    const camX = manView ? manX - W * 0.38 : 0;
    const manWorld = screenMan + camX;

    // sky and clouds
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, "#5B6B82"); sky.addColorStop(1, "#B8C4D4");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, ground);
    for (const cl of clouds) {
      const cs = cl.s * u, sp = W + 320;
      const x = (((cl.x * sp - camX * 0.1 + simT * 6) % sp) + sp) % sp - 160;
      ctx.fillStyle = "rgba(226,232,240,0.55)";
      for (const [dx, dy, rr] of [[0, 0, 30], [28, -10, 26], [56, 0, 24], [-26, 4, 20], [26, 10, 24]]) { ctx.beginPath(); ctx.arc(x + dx * cs, cl.y * H + dy * cs, rr * cs, 0, 7); ctx.fill(); }
    }
    // city skyline (far away, so it slides slowly)
    const bwid = 64 * u, par = 0.35, off = camX * par;
    for (let i = Math.floor(off / bwid) - 1; i < (off + W) / bwid + 1; i++) {
      const x = i * bwid - off, bh = (60 + hash01(i) * 110) * u, w = bwid - 8 * u;
      ctx.fillStyle = "#7C8BA1"; ctx.fillRect(x, ground - bh, w, bh);
      ctx.fillStyle = "rgba(254,240,138,0.55)";
      for (let wy = ground - bh + 10 * u; wy < ground - 14 * u; wy += 16 * u)
        for (let wx = x + 8 * u; wx < x + w - 10 * u; wx += 14 * u)
          if (hash01(i * 97 + wx * 0.37 + wy * 0.11) > 0.62) ctx.fillRect(wx, wy, 6 * u, 7 * u);
    }
    // pavement, kerb lines and lamp posts (these move at full speed)
    ctx.fillStyle = "#4B5563"; ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = "#6B7280"; ctx.fillRect(0, ground, W, 5 * u);
    ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
    const tileW = 46 * u;
    for (let x = -(((camX % tileW) + tileW) % tileW); x < W + tileW; x += tileW) { ctx.beginPath(); ctx.moveTo(x, ground + 6 * u); ctx.lineTo(x - 16 * u, H); ctx.stroke(); }
    const lampGap = 260 * u;
    for (let x = -(((camX % lampGap) + lampGap) % lampGap) + lampGap * 0.6; x < W + 40; x += lampGap) {
      ctx.fillStyle = "#1F2937"; ctx.fillRect(x - 2 * u, ground - 150 * u, 4 * u, 150 * u); ctx.fillRect(x - 2 * u, ground - 150 * u, 26 * u, 4 * u);
      const glow = ctx.createRadialGradient(x + 24 * u, ground - 140 * u, 1, x + 24 * u, ground - 140 * u, 40 * u);
      glow.addColorStop(0, "rgba(254,240,138,0.6)"); glow.addColorStop(1, "rgba(254,240,138,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x + 24 * u, ground - 140 * u, 40 * u, 0, 7); ctx.fill();
      ctx.fillStyle = "#FEF08A"; ctx.beginPath(); ctx.arc(x + 24 * u, ground - 141 * u, 4.5 * u, 0, 7); ctx.fill();
    }

    // ---- umbrella geometry (shared by the drawing and the "does it keep you dry" test)
    const face = c.man < -0.01 ? -1 : 1;
    const target = r.hold === "tilt" ? c.ang : 0;
    if (tilt == null) tilt = target;
    tilt += (target - tilt) * Math.min(1, dt * 5 + (playing ? 0 : 1));
    const hand = { x: manWorld + 12 * u * face, y: ground - 86 * u };
    const ca = Math.cos(tilt * RAD), sa = Math.sin(tilt * RAD);
    const RIM = 72 * u, DOME = 24 * u, HALF = 46 * u;
    const underCanopy = (x, y) => {                   // is (x, y) between the canopy and its rim?
      const dx = x - hand.x, dy = y - hand.y;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;   // in the umbrella's own frame (up = −y)
      if (Math.abs(lx) > HALF) return false;
      const topY = -RIM - DOME * (1 - (lx / HALF) ** 2);
      return ly > topY && ly < -RIM + 6 * u;
    };
    const onBody = (x, y) => Math.abs(x - manWorld) < 13 * u && y > ground - 152 * u && y < ground - 4 * u;

    // ---- rain: drops live in the world, the camera decides how they look
    const vx = c.rx * PX * SLOW, vy = c.ry * PX * SLOW;     // drop velocity on the ground's clock, px/s
    const svx = vx - (manView ? manV : 0);                  // how they move across the screen
    const lean = (svx / vy) * ground;                       // sideways drift from top to bottom
    const spawnX = () => camX + Math.min(0, -lean) - 30 + Math.random() * (W + Math.abs(lean) + 60);
    const want = Math.round((W * H) / (phone ? 1500 : 1300));
    while (drops.length < want) drops.push({ x: spawnX(), y: Math.random() * ground });
    let hits = 0;
    for (const d of drops) {
      if (playing) { d.x += vx * dt; d.y += vy * dt; }
      let gone = false;
      if (underCanopy(d.x, d.y)) { splashes.push({ x: d.x, y: d.y, a: 0, c: "rgba(255,255,255,0.9)", s: 0.6 }); gone = true; }
      else if (onBody(d.x, d.y)) { hits++; splashes.push({ x: d.x, y: d.y, a: 0, c: "#7DD3FC", s: 0.8 }); gone = true; }
      else if (d.y >= ground) { if (Math.random() < 0.35) splashes.push({ x: d.x, y: ground + 3 * u + Math.random() * (H - ground - 8 * u), a: 0, c: "rgba(191,219,254,0.8)", s: 1 }); gone = true; }
      if (gone || d.x - camX < -80 - Math.abs(lean) || d.x - camX > W + 80 + Math.abs(lean)) { d.y = -Math.random() * 30; d.x = spawnX(); }
    }
    if (playing && dt > 0) wetAvg += (hits / dt - wetAvg) * Math.min(1, dt * 1.2);
    cv.dataset.wet = wetAvg.toFixed(2);
    const sl = Math.hypot(svx, vy) || 1, len = (10 + Math.min(14, sl / 18)) * u;
    ctx.strokeStyle = "rgba(219,234,254,0.85)"; ctx.lineWidth = 1.5 * u; ctx.lineCap = "round";
    ctx.beginPath();
    for (const d of drops) { const x = d.x - camX; ctx.moveTo(x, d.y); ctx.lineTo(x - (svx / sl) * len, d.y - (vy / sl) * len); }
    ctx.stroke();
    for (const s of splashes) s.a += dt;
    splashes = splashes.filter((s) => s.a < 0.3);
    for (const s of splashes) {
      ctx.strokeStyle = s.c; ctx.globalAlpha = 1 - s.a / 0.3; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(s.x - camX, s.y, (2 + s.a * 22 * s.s) * u, (1 + s.a * 5 * s.s) * u, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (splashes.length > 400) splashes.splice(0, splashes.length - 400);

    walker(ctx, screenMan, ground, u, walkPhase, Math.abs(c.man) > 0.01, tilt, face, RIM, DOME, HALF);

    // purple arrow: the direction the rain seems to come from, to the walker
    const ax = hand.x - camX + sa * (RIM + DOME + 10 * u), ay = hand.y - ca * (RIM + DOME + 10 * u);
    const fl = Math.hypot(c.ax, c.ry) || 1, alen = 46 * u;
    const fx = c.ax / fl, fy = c.ry / fl;
    ctx.setLineDash([5, 5]);
    arrow(ctx, ax - fx * alen, ay - fy * alen, ax, ay, RV.feel, 3);
    ctx.setLineDash([]);
    tag(ctx, "rain you feel", ax - fx * alen - 52, Math.max(12, ay - fy * alen), RV.feel, 11);

    // vector triangle
    const iw = phone ? 128 : 182, ih = phone ? 108 : 140;
    const insetLeft = !manView && screenMan > W * 0.55;     // keep the triangle off the walker
    rainInset(ctx, insetLeft ? 10 : W - iw - 10, 10, iw, ih, c);
    const camTxt = manView ? "Camera moves with the walker" : "Camera fixed to the pavement";
    ctx.font = `700 ${phone ? 10.5 : 12}px ${FONT}`;
    const cw = ctx.measureText(camTxt).width / 2 + 10;
    tag(ctx, camTxt, insetLeft ? W - cw - 6 : cw + 6, 18, COL.navy, phone ? 10.5 : 12);
    $("#rl-time").innerHTML = `<b>${r.hold === "tilt" ? "Umbrella tilted to the rain" : "Umbrella held straight up"}</b><small>Rain shown ${(1 / SLOW).toFixed(1)}× slower than real life</small>`;
    const bar = $("#rl-wet");
    if (bar) {
      const pct = Math.min(100, wetAvg * 10);
      bar.style.width = `${pct}%`;
      $("#rl-wetbox").dataset.label = pct < 6 ? "Dry 😊" : pct < 40 ? "Getting wet" : "Soaked! 😬";
    }
  }

  function walker(ctx, X, ground, u, ph, moving, tiltW, face, RIM, DOME, HALF) {
    ctx.save(); ctx.translate(X, ground); ctx.scale(face * u, u);
    const tiltDeg = tiltW * face;
    const hipY = -64, shY = -116;
    const legA = moving ? Math.sin(ph) * 0.42 : 0;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // legs, back one darker
    for (const sgn of [-1, 1]) {
      const a = legA * sgn, kx = Math.sin(a) * 32, ky = hipY + Math.cos(a) * 32;
      const bend = moving ? Math.max(0, -Math.sin(ph * 1 + (sgn > 0 ? 0 : Math.PI))) * 0.6 : 0;
      const fx = kx + Math.sin(a - bend) * 32, fy = ky + Math.cos(a - bend) * 32;
      ctx.strokeStyle = sgn < 0 ? "#1E293B" : "#334155"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, Math.min(fy, -2)); ctx.stroke();
      ctx.fillStyle = "#111827"; roundRect(ctx, fx - 4, Math.min(fy, -2) - 3, 15, 6, 3); ctx.fill();
    }
    // back arm swings
    const armA = moving ? -Math.sin(ph) * 0.45 : 0;
    ctx.strokeStyle = "#1E40AF"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-2, shY + 6); ctx.lineTo(-2 + Math.sin(armA) * 26, shY + 6 + Math.cos(armA) * 26); ctx.lineTo(-2 + Math.sin(armA * 1.4) * 44, shY + 6 + Math.cos(armA) * 44); ctx.stroke();
    // coat
    ctx.fillStyle = "#2563EB";
    ctx.beginPath(); ctx.moveTo(-13, shY); ctx.quadraticCurveTo(0, shY - 6, 13, shY); ctx.lineTo(15, hipY + 8); ctx.lineTo(-14, hipY + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1D4ED8"; ctx.fillRect(-14, hipY, 29, 8);
    // head
    ctx.fillStyle = "#E0AC69"; ctx.beginPath(); ctx.arc(2, shY - 18, 14, 0, 7); ctx.fill();
    ctx.fillStyle = "#3F2A1D"; ctx.beginPath(); ctx.arc(0, shY - 22, 14, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = "#1F2937"; ctx.beginPath(); ctx.arc(10, shY - 18, 1.8, 0, 7); ctx.fill();
    // umbrella, held in the front hand
    ctx.save(); ctx.translate(12, -86); ctx.rotate(tiltDeg * RAD);
    const R = RIM / u, D = DOME / u, Hh = HALF / u;
    ctx.strokeStyle = "#374151"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -R - D - 6); ctx.stroke();
    ctx.beginPath(); ctx.arc(-5, 10, 5, 0, Math.PI); ctx.stroke();
    const grad = ctx.createLinearGradient(-Hh, 0, Hh, 0); grad.addColorStop(0, "#C2410C"); grad.addColorStop(0.5, "#F97316"); grad.addColorStop(1, "#E4572E");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(-Hh, -R);
    ctx.quadraticCurveTo(-Hh * 0.9, -R - D * 1.9, 0, -R - D);
    ctx.quadraticCurveTo(Hh * 0.9, -R - D * 1.9, Hh, -R);
    for (let k = 3; k >= -3; k--) { const x0 = (k + 1) * Hh / 4, x1 = k * Hh / 4; if (x1 >= -Hh) ctx.quadraticCurveTo((x0 + x1) / 2, -R + 7, x1, -R); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.2;
    for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(0, -R - D); ctx.quadraticCurveTo(k * Hh * 0.8, -R - D * 0.8, k * Hh, -R); ctx.stroke(); }
    ctx.restore();
    // front arm reaching to the handle
    ctx.strokeStyle = "#2563EB"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(4, shY + 6); ctx.lineTo(12, shY + 26); ctx.lineTo(12, -84); ctx.stroke();
    ctx.fillStyle = "#E0AC69"; ctx.beginPath(); ctx.arc(12, -84, 5, 0, 7); ctx.fill();
    ctx.restore();
  }

  function rainInset(ctx, x, y, w, h, c) {
    ctx.fillStyle = "rgba(255,255,255,0.95)"; roundRect(ctx, x, y, w, h, 12); ctx.fill();
    const small = w < 160;
    ctx.font = `700 ${small ? 10.5 : 12}px ${FONT}`; ctx.fillStyle = COL.navy; ctx.fillText(small ? "rain − you = felt" : "rain − you = what you feel", x + 9, y + 17);
    // rain vector, then minus your velocity, gives the felt rain
    const P0 = [0, 0], P1 = [c.rx, c.ry], P2 = [c.rx - c.man, c.ry];
    const xs = [P0[0], P1[0], P2[0]], ys = [P0[1], P1[1], P2[1]];
    const minx = Math.min(...xs), maxx = Math.max(...xs), maxy = Math.max(...ys);
    const bw = w - 40, bh = h - (small ? 46 : 54);
    const k = Math.min(bw / Math.max(maxx - minx, 0.1), bh / Math.max(maxy, 0.1));
    const ox = x + 20 + (bw - (maxx - minx) * k) / 2 - minx * k, oy = y + 26;
    const p = (P) => [ox + P[0] * k, oy + P[1] * k];
    arrow(ctx, ...p(P0), ...p(P1), RV.rain, 3);
    if (Math.abs(c.man) > 0.01) arrow(ctx, ...p(P1), ...p(P2), RV.you, 3);
    arrow(ctx, ...p(P0), ...p(P2), RV.feel, 3);
    ctx.font = `700 ${small ? 9.5 : 11}px ${FONT}`;
    const ly = y + h - 10;
    ctx.fillStyle = RV.rain; ctx.fillText("rain", x + 9, ly);
    ctx.fillStyle = RV.you; ctx.fillText("you", x + (small ? 38 : 48), ly);
    ctx.fillStyle = RV.feel; ctx.fillText(`felt · ${Math.abs(c.ang).toFixed(0)}°`, x + (small ? 64 : 82), ly);
  }

  // =====================================================================
  //  shared: animation loop, buttons and sliders
  // =====================================================================
  function frame(now) {
    if (el.hidden) { raf = null; last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
    if (st.tab === "river") {
      const T = riverEnd(), k = speedUp(T);
      if (playing) { simT += dt * k; if (simT >= T) { simT = T; playing = false; ended = true; } }
      drawRiver(playing ? dt * k : 0, dt);
    } else {
      if (playing) simT += dt;
      drawRain(playing ? dt : 0);
    }
    $("#rl-play").classList.toggle("playing", playing);
    raf = requestAnimationFrame(frame);
  }
  function restart() { ended = false; simT = 0; wake = []; drops = []; splashes = []; playing = true; last = 0; }

  function render() {
    el.querySelectorAll("[data-rtab]").forEach((b) => b.classList.toggle("on", b.dataset.rtab === st.tab));
    if (st.tab === "river") {
      cv.classList.remove("rain");
      $("#rl-title").textContent = "River & boat";
      $("#rl-maths-sub").textContent = "Step by step, for the numbers you've chosen";
      $("#rl-sub").textContent = st.river.mode === "updown" ? "Seen from above. Two boats race from A to B and back." : "Seen from above. The boat points one way, but the river carries it.";
      riverSide();
    } else {
      cv.classList.add("rain");
      $("#rl-title").textContent = "Rain & umbrella";
      $("#rl-maths-sub").textContent = "Subtracting your velocity from the rain's, step by step";
      $("#rl-sub").textContent = "Which way does the rain seem to fall, and how should you hold the umbrella?";
      rainSide();
    }
    restart(); tilt = null; manX = null;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  bindSliders($("#rl-side"), { ...RIVER_DEFS, ...RAIN_DEFS }, (k, v) => {
    if (st.tab === "river") { st.river[k] = v; save(); riverOut(); restart(); }
    else { st.rain[k] = v; save(); rainOut(); }
  }, REL_LIMITS);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.rtab) { st.tab = b.dataset.rtab; save(); return render(); }
    if (b.dataset.rmode) { st.river.mode = b.dataset.rmode; save(); return render(); }
    if (b.dataset.wmode) { st.rain.mode = b.dataset.wmode; save(); rainSide(); drops = []; manX = null; return; }
    const p = b.parentElement;
    if (p.hasAttribute("data-view")) { st.rain.view = b.dataset.val; save(); drops = []; manX = null; return rainSide(); }
    if (p.hasAttribute("data-hold")) { st.rain.hold = b.dataset.val; save(); wetAvg = 0; return rainSide(); }
    if (b.id === "rl-play") { if (ended) return restart(); playing = !playing; last = 0; return; }
    if (b.id === "rl-restart") return restart();
  });
  render();
  return { show() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } } };
}
