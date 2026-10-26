// ===================================================================
//  Visitors: how many people have opened Trajectory Lab.
//  The counts come from the Python side (core/visits.py).
// ===================================================================

function initVisitors(app, el) {
  function render() {
    const d = app.data || {}, days = d.days || {};
    const keys = Object.keys(days).sort();
    const last = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(now); dt.setDate(now.getDate() - i);
      const k = dt.toISOString().slice(0, 10);
      last.push({ k, n: days[k] || 0 });
    }
    const week = last.slice(-7).reduce((a, b) => a + b.n, 0);
    const best = keys.reduce((m, k) => (days[k] > (days[m] || 0) ? k : m), keys[0] || "");
    const tile = (lbl, val, c, sub = "") => `<div class="stat pop" style="--c:${c}"><div class="lbl">${lbl}</div><div class="val">${val}</div>${sub ? `<small class="muted">${sub}</small>` : ""}</div>`;
    el.innerHTML = `
      <div class="page-intro"><div><div class="page-title">Visitors</div>
        <div class="card-sub">Hey there! Thanks for stopping by. Here's how many people have launched things in Trajectory Lab.</div></div></div>
      <div class="stats big">
        ${tile("All-time visits", (d.total || 0).toLocaleString(), "#0891B2")}
        ${tile("Today", (d.today || 0).toLocaleString(), "#1D4ED8")}
        ${tile("Last 7 days", week.toLocaleString(), "#7C3AED")}
        ${tile("Busiest day", best ? (days[best] || 0).toLocaleString() : "—", "#EA580C", best ? new Date(best).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "")}
      </div>
      <section class="card"><div class="card-title">Where visitors come from</div>
        <div class="card-sub">Darker countries have more visits.</div>
        <div class="map-wrap"><svg id="vs-map" viewBox="0 0 960 470" role="img" aria-label="World map of visitors"></svg><div class="map-tip" id="vs-tip"></div></div>
        <div class="country-list" id="vs-list"></div></section>
      <section class="card"><div class="card-title">Last 14 days</div><div class="card-sub">One visit is counted each time someone opens the site.</div>
        <canvas id="vs-chart" class="vs-chart"></canvas></section>
      ${d.local ? `<div class="note">You're running Trajectory Lab on your own computer, so these are visits to your copy. Once it's online, visits from everyone are counted.</div>` : ""}
      ${funFact("space", "While you're here")}`;
    const countries = Object.entries(d.countries || {}).sort((a, b) => b[1] - a[1]);
    const maxC = Math.max(1, ...countries.map((c) => c[1]));
    el.querySelector("#vs-list").innerHTML = countries.length ? countries.slice(0, 12).map(([c, n], i) =>
      `<div class="c-row" style="animation-delay:${i * 50}ms"><span>${c}</span><div class="m-bar"><span style="width:${n / maxC * 100}%;background:#0891B2"></span></div><b>${n}</b></div>`).join("") : `<div class="hint">No countries yet.</div>`;
    drawMap(el, countries, maxC);
    requestAnimationFrame(() => drawChart(el.querySelector("#vs-chart"), {
      series: [{ x: last.map((_, i) => i - 13), y: last.map((p) => p.n), color: "#0891B2", width: 3 }],
      xLabel: "Days ago", yLabel: "Visits", yFromZero: true }));
  }
  render();
  return { show: render };
}

// World map: shapes are loaded from a public CDN the first time the page opens
const MAP_ALIASES = { "United States": "United States of America", "Russian Federation": "Russia", "Czech Republic": "Czechia",
  "South Korea": "South Korea", "Korea, Republic of": "South Korea", "Viet Nam": "Vietnam", "Iran, Islamic Republic of": "Iran" };
let mapLib = null;
async function drawMap(el, countries, maxC) {
  const svg = el.querySelector("#vs-map"), tip = el.querySelector("#vs-tip");
  try {
    if (!mapLib) {
      const [geo, topo, world] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/d3-geo@3/+esm"),
        import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((r) => r.json()),
      ]);
      mapLib = { geo, shapes: topo.feature(world, world.objects.countries).features };
    }
    const counts = {};
    for (const [c, n] of countries) counts[MAP_ALIASES[c] || c] = n;
    const proj = mapLib.geo.geoNaturalEarth1().fitSize([960, 470], { type: "Sphere" });
    const path = mapLib.geo.geoPath(proj);
    svg.innerHTML = `<path d="${path({ type: "Sphere" })}" fill="#F0F9FF" stroke="#E0F2FE"/>` + mapLib.shapes.map((f, i) => {
      const name = f.properties.name, n = counts[name] || 0;
      const fill = n ? `color-mix(in srgb, #0891B2 ${25 + 75 * n / maxC}%, #E0F2FE)` : "#E2E8F0";
      return `<path class="ctry${n ? " has" : ""}" d="${path(f)}" fill="${fill}" stroke="#fff" stroke-width="0.6" data-name="${name}" data-n="${n}" style="animation-delay:${(i % 40) * 15}ms"/>`;
    }).join("");
    svg.onmousemove = svg.onclick = (e) => {
      const t = e.target.closest(".ctry");
      if (!t) { tip.style.opacity = 0; return; }
      const r = svg.getBoundingClientRect();
      tip.textContent = `${t.dataset.name}: ${t.dataset.n} visit${t.dataset.n === "1" ? "" : "s"}`;
      tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top - 34}px`; tip.style.opacity = 1;
    };
    svg.onmouseleave = () => { tip.style.opacity = 0; };
  } catch {
    svg.outerHTML = `<div class="hint">The map couldn't load (no internet?). The list below still shows every country.</div>`;
  }
}
