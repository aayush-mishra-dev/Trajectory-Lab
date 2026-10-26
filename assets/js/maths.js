// ===================================================================
//  The maths page: the standard formulas with the current numbers plugged in
//  (written in MathML, which every modern browser draws natively)
// ===================================================================

const mi = (s) => `<mi>${s}</mi>`;
const mn = (v, d = 2) => `<mn>${typeof v === "number" ? v.toFixed(d) : v}</mn>`;
const mo = (s) => `<mo>${s}</mo>`;
const mt = (s) => `<mtext>&#8202;${s}</mtext>`;
const frac = (a, b) => `<mfrac><mrow>${a}</mrow><mrow>${b}</mrow></mfrac>`;
const msqrt = (a) => `<msqrt>${a}</msqrt>`;
const sub = (a, b) => `<msub>${a}<mrow>${b}</mrow></msub>`;
const sup = (a, b) => `<msup>${a}<mrow>${b}</mrow></msup>`;
const eq = (...parts) => `<math display="block">${parts.join("")}</math>`;
const vx_ = sub(mi("v"), mi("x")), vy_ = sub(mi("v"), mi("y"));

function mathsHTML(p, tr) {
  const v = p.speed, g = p.g, h = p.height, th = p.angle * RAD;
  const vx = v * Math.cos(th), vy = v * Math.sin(th);
  const T = (vy + Math.sqrt(Math.max(vy * vy + 2 * g * h, 0))) / g;
  const H = h + Math.max(vy, 0) ** 2 / (2 * g);
  const R = vx * T, vEnd = Math.sqrt(v * v + 2 * g * h);
  const tHalf = Math.max(vy, 0) / g, xHalf = vx * tHalf;
  const vyEnd = vy - g * T, endAng = Math.atan2(-vyEnd, vx) / RAD;
  const s = tr.s;
  const sym = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;

  let html = `
  <section class="card maths-card">
    <div class="card-title">The maths of your throw</div>
    <div class="card-sub">Every number below uses your current throw. Change a setting and the working updates.</div>

    <div class="big-idea"><b class="bi-title">The one big idea</b>Split the motion into two separate parts. <b>Sideways:</b> nothing pushes or pulls, so the speed never changes. <b>Up and down:</b> gravity pulls down, changing the speed by a steady ${g} m/s every second. Solve each part on its own, then put them together.</div>

    <div class="group-label">What the letters mean</div>
    <table class="symbols">
      ${sym("v", `launch speed = <b>${v.toFixed(2)} m/s</b>`)}${sym("θ", `launch angle = <b>${p.angle.toFixed(1)}°</b>`)}
      ${sym("g", `gravity = <b>${g} m/s²</b>`)}${sym("h", `launch height = <b>${h.toFixed(2)} m</b>`)}
      ${sym("t", "time since launch (s)")}${sym("vₓ, vᵧ", "horizontal and vertical parts of the velocity")}
    </table>

    <div class="mstep"><span>1</span><div><b>Split the launch speed into two parts</b>
      <p>Think of the launch arrow as the long side of a right-angled triangle. The horizontal side is v cos θ and the vertical side is v sin θ.</p>
      ${eq(vx_, mo("="), mi("v"), mo("cos"), mi("θ"), mo("="), mn(v), mo("×"), mo("cos"), mn(p.angle, 1), mo("°"), mo("="), mn(vx), mt("m/s"))}
      ${eq(vy_, mo("="), mi("v"), mo("sin"), mi("θ"), mo("="), mn(v), mo("×"), mo("sin"), mn(p.angle, 1), mo("°"), mo("="), mn(vy), mt("m/s"))}
      <p class="small">Check: √(${vx.toFixed(2)}² + ${vy.toFixed(2)}²) = ${Math.hypot(vx, vy).toFixed(2)} m/s, the launch speed. ✓</p></div></div>

    <div class="mstep"><span>2</span><div><b>Where is the ball at any time t?</b>
      <p>Sideways it moves at a steady speed. Vertically it starts going up at vᵧ, but gravity takes away ${g} m/s every second.</p>
      ${eq(mi("x"), mo("="), vx_, mi("t"), mo("="), mn(vx), mi("t"))}
      ${eq(mi("y"), mo("="), mi("h"), mo("+"), vy_, mi("t"), mo("−"), frac(mn(1, 0), mn(2, 0)), mi("g"), sup(mi("t"), mn(2, 0)), mo("="), mn(h), mo("+"), mn(vy), mi("t"), mo("−"), mn(g / 2, 3), sup(mi("t"), mn(2, 0)))}
      <p class="small">Try t = 1 s: x = ${vx.toFixed(2)} m, y = ${(h + vy - g / 2).toFixed(2)} m.</p></div></div>

    <div class="mstep"><span>3</span><div><b>The highest point</b>
      <p>At the top the ball stops going up for an instant: its vertical speed is zero. That tells us when, and then how high.</p>
      ${vy > 0 ? eq(sub(mi("t"), mi("top")), mo("="), frac(vy_, mi("g")), mo("="), frac(mn(vy), mn(g)), mo("="), mn(tHalf), mt("s")) : `<p>You launched level or downward, so the highest point is the start.</p>`}
      ${eq(mi("H"), mo("="), mi("h"), mo("+"), frac(sup(vy_, mn(2, 0)), mn(2, 0) + mi("g")), mo("="), mn(h), mo("+"), frac(sup(mn(Math.max(vy, 0)), mn(2, 0)), mn(2, 0) + mo("×") + mn(g)), mo("="), mn(H), mt("m"))}
      <p class="small">It's ${xHalf.toFixed(2)} m along when it reaches the top.</p></div></div>

    <div class="mstep"><span>4</span><div><b>How long it stays in the air</b>
      <p>It lands when y = 0. Putting y = 0 into step 2 gives a quadratic; the positive answer is:</p>
      ${eq(mi("T"), mo("="), frac(vy_ + mo("+") + msqrt(sup(vy_, mn(2, 0)) + mo("+") + mn(2, 0) + mi("g") + mi("h")), mi("g")), mo("="), mn(T), mt("s"))}
      ${h === 0 ? `<p class="small">From flat ground this is just 2vᵧ/g: up and down take the same time.</p>` : `<p class="small">Starting ${h} m up gives it extra time to fall.</p>`}</div></div>

    <div class="mstep"><span>5</span><div><b>How far it goes (the range)</b>
      <p>The sideways speed never changes, so distance = speed × time.</p>
      ${eq(mi("R"), mo("="), vx_, mi("T"), mo("="), mn(vx), mo("×"), mn(T), mo("="), mn(R), mt("m"))}
      ${h === 0 ? eq(mi("R"), mo("="), frac(sup(mi("v"), mn(2, 0)) + mo("sin") + mn(2, 0) + mi("θ"), mi("g")), mo("="), mn(R), mt("m")) + `<p class="small">sin 2θ is biggest at θ = 45°, which is why 45° goes farthest with no air.</p>` : ""}</div></div>

    <div class="mstep"><span>6</span><div><b>How it lands</b>
      <p>Energy is conserved: the height it loses turns into extra speed.</p>
      ${eq(sub(mi("v"), mi("end")), mo("="), msqrt(sup(mi("v"), mn(2, 0)) + mo("+") + mn(2, 0) + mi("g") + mi("h")), mo("="), mn(vEnd), mt("m/s"))}
      <p class="small">It hits the ground at ${endAng.toFixed(1)}° below the horizontal.</p></div></div>

    <div class="mstep"><span>7</span><div><b>The shape of the path</b>
      <p>Take t out of the two equations in step 2 and you get y in terms of x. It's a parabola:</p>
      ${eq(mi("y"), mo("="), mi("h"), mo("+"), mi("x"), mo("tan"), mi("θ"), mo("−"), frac(mi("g") + sup(mi("x"), mn(2, 0)), mn(2, 0) + sup(mi("v"), mn(2, 0)) + sup(mo("cos"), mn(2, 0)) + mi("θ")))}</div></div>

    <div class="group-label">Summary</div>
    <div class="sum-grid">
      <div><span>Time to top</span><b>${tHalf.toFixed(2)} s</b></div><div><span>Max height</span><b>${H.toFixed(2)} m</b></div>
      <div><span>Flight time</span><b>${T.toFixed(2)} s</b></div><div><span>Range</span><b>${R.toFixed(2)} m</b></div>
    </div>
  `;
  if (!p.drag && p.incline === 0) {
    html += `<div class="note">The simulation agrees: range <b>${s.range.toFixed(2)} m</b>, max height <b>${s.maxHeight.toFixed(2)} m</b>, time <b>${s.flightTime.toFixed(2)} s</b>.</div>`;
  } else {
    const why = [p.drag && "air resistance", p.incline !== 0 && "a slope"].filter(Boolean).join(" and ");
    html += `<div class="note">Your simulation has ${why}, which these formulas leave out, so it lands at <b>${s.range.toFixed(2)} m</b> instead of ${R.toFixed(2)} m. Turn ${p.drag && p.incline ? "them" : "it"} off in the controls to see the two match exactly.</div>`;
  }
  html += `</section>`;

  if (p.drag) {
    const area = Math.PI * (p.diameter / 2) ** 2;
    const rho = p.rho ?? AIR_DENSITY;
    const vt = rho > 0 ? Math.sqrt(2 * p.mass * g / (rho * p.cd * area)) : Infinity;
    html += `
    <section class="card maths-card">
      <div class="card-title">With air resistance</div>
      <div class="card-sub">Air pushes back against the ball, harder the faster it goes.</div>
      ${eq(sub(mi("F"), mi("drag")), mo("="), frac(mn(1, 0), mn(2, 0)), mi("ρ"), sub(mi("C"), mi("d")), mi("A"), sup(mi("v"), mn(2, 0)))}
      <table class="symbols">${sym("ρ", `air density = <b>${rho} kg/m³</b>`)}${sym("C<sub>d</sub>", `drag coefficient = <b>${p.cd}</b> (how streamlined it is)`)}${sym("A", `front area = π r² = <b>${(area * 1e4).toFixed(1)} cm²</b>`)}</table>
      <div class="mstep"><span>!</span><div><b>Terminal speed</b><p>Falling fast enough, drag equals weight and it stops speeding up.</p>
      ${eq(sub(mi("v"), mi("t")), mo("="), msqrt(frac(mn(2, 0) + mi("m") + mi("g"), mi("ρ") + sub(mi("C"), mi("d")) + mi("A"))), mo("="), isFinite(vt) ? mn(vt, 1) + mt("m/s") : mi("∞"))}</div></div>
      <p class="small">There's no neat formula with drag, so the app takes thousands of tiny time steps (4th-order Runge–Kutta): work out the forces, update the velocity, update the position, repeat.</p>
    </section>`;
  }
  return html;
}

function mspace() { return `<mspace width="0.8em"/>`; }
