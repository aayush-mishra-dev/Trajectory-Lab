// ===================================================================
//  Quiz: a personal quiz that remembers you. Questions are generated
//  fresh each time (new numbers), and it learns which topics you find
//  hardest.
// ===================================================================

const QUIZ_TOPICS = {
  basics: { name: "Projectile basics", color: "#1D4ED8" },
  range: { name: "Range & angles", color: "#0891B2" },
  energy: { name: "Velocity & energy", color: "#059669" },
  air: { name: "Air & the real world", color: "#EA580C" },
  planets: { name: "Gravity & planets", color: "#7C3AED" },
  instruments: { name: "Instruments", color: "#0D9488" },
  relative: { name: "Relative motion", color: "#0284C7" },
  history: { name: "History", color: "#B45309" },
};
const LEVEL_NAMES = ["Easy", "Medium", "Hard"];
const RANKS = ["Beginner", "Thrower", "Launcher", "Sharpshooter", "Ballistician", "Galileo", "Newton"];

// little burst of colour for wins
function confetti(host, n = 30) {
  if (!host) return;
  const colors = ["#1D4ED8", "#EA580C", "#10B981", "#7C3AED", "#F59E0B", "#DB2777"];
  const box = document.createElement("div"); box.className = "confetti";
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.style.cssText = `left:${50 + (Math.random() - 0.5) * 30}%;background:${colors[i % colors.length]};--dx:${(Math.random() - 0.5) * 420}px;--dy:${-120 - Math.random() * 220}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * 80}ms`;
    box.appendChild(s);
  }
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.appendChild(box); setTimeout(() => box.remove(), 1400);
}

const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sinD = (d) => Math.sin(d * RAD), cosD = (d) => Math.cos(d * RAD);

// Build a multiple-choice question from a correct number and common wrong answers
function numQ(topic, level, q, correct, wrongs, unit, explain, hint, dec = 1) {
  const f = (v) => `${(+v).toFixed(dec)}${unit ? " " + unit : ""}`;
  const right = f(correct), opts = [right];
  for (const w of wrongs) { const s = f(w); if (isFinite(w) && !opts.includes(s) && w >= 0) opts.push(s); if (opts.length === 4) break; }
  let k = 1;
  while (opts.length < 4) {   // top up with nearby values if the mistakes clash
    const s = f(correct * (1 + (k % 2 ? 0.25 : -0.2) * Math.ceil(k / 2)));
    if (!opts.includes(s)) opts.push(s);
    k++;
  }
  const options = shuffle(opts);
  return { topic, level, q, options, answer: options.indexOf(right), explain, hint };
}
function textQ(topic, level, q, right, wrongs, explain, hint = "") {
  const uniq = [...new Set(wrongs.filter((w) => w !== right))].slice(0, 3);
  const options = shuffle([right, ...uniq]);
  return { topic, level, q, options, answer: options.indexOf(right), explain, hint };
}

const GEN = {
  basics: [
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([10, 20, 30, 40]) : ri(12, 45), th = L === 1 ? pick([30, 60]) : ri(20, 70);
      const vy = v * sinD(th);
      return numQ("basics", L, `A ball is thrown at <b>${v} m/s</b> at <b>${th}°</b> above the horizontal. What is the vertical part of its velocity?`,
        vy, [v * cosD(th), v * th / 90, v / 2], "m/s",
        `v<sub>y</sub> = v sin θ = ${v} × sin ${th}° = ${vy.toFixed(1)} m/s. (Cos gives the horizontal part.)`, "Vertical goes with sin, horizontal with cos.");
    },
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([20, 30, 40]) : ri(15, 40), th = L === 1 ? 30 : ri(25, 70);
      const vy = v * sinD(th), t = vy / g;
      return numQ("basics", L, `Launched at <b>${v} m/s</b> and <b>${th}°</b> (no air, g = ${g} m/s²), how long until it reaches the top?`,
        t, [2 * t, v / g, vy * g / 100], "s",
        `At the top the vertical speed is zero: t = v sin θ / g = ${vy.toFixed(1)} / ${g} = ${t.toFixed(2)} s.`, "At the highest point, vertical speed = 0.", 2);
    },
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([20, 30, 40]) : ri(15, 45), th = L === 1 ? pick([30, 90]) : ri(25, 75);
      const vy = v * sinD(th), H = vy * vy / (2 * g);
      return numQ("basics", L, `What is the maximum height of a ball launched at <b>${v} m/s</b>, <b>${th}°</b> (no air, g = ${g} m/s²)?`,
        H, [2 * H, v * v / (2 * g), vy / (2 * g)], "m",
        `H = (v sin θ)² / 2g = ${vy.toFixed(1)}² / ${2 * g} = ${H.toFixed(1)} m.`, "Use v² = u² − 2gH with final vertical speed 0.");
    },
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([10, 20, 25]) : ri(10, 40), th = L === 1 ? 30 : ri(20, 75);
      const T = 2 * v * sinD(th) / g;
      return numQ("basics", L, `Launched from flat ground at <b>${v} m/s</b>, <b>${th}°</b> (g = ${g} m/s²), how long is it in the air?`,
        T, [T / 2, 2 * v * cosD(th) / g, 2 * v / g], "s",
        `Time of flight T = 2v sin θ / g = 2 × ${v} × sin ${th}° / ${g} = ${T.toFixed(2)} s.`, "It's twice the time to reach the top.", 2);
    },
    (L) => {
      const g = L === 1 ? 10 : 9.8, h = L === 1 ? pick([5, 20, 45, 80]) : ri(10, 120), v = L === 1 ? pick([5, 10, 15]) : ri(4, 30);
      const t = Math.sqrt(2 * h / g), x = v * t;
      return numQ("basics", Math.max(L, 2), `A ball rolls off a <b>${h} m</b> high cliff at <b>${v} m/s</b>. How far from the base does it land? (g = ${g} m/s², no air)`,
        x, [v * h / g, v * Math.sqrt(h / g), v * 2 * h / g], "m",
        `Fall time t = √(2h/g) = √(2 × ${h} / ${g}) = ${t.toFixed(2)} s. Distance = v t = ${v} × ${t.toFixed(2)} = ${x.toFixed(1)} m.`, "The horizontal speed doesn't change while it falls.");
    },
  ],
  range: [
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([10, 20, 30]) : ri(12, 40), th = L === 1 ? pick([15, 45, 75]) : ri(15, 75);
      const R = v * v * sinD(2 * th) / g;
      return numQ("range", L, `What is the range of a throw at <b>${v} m/s</b>, <b>${th}°</b> on flat ground (g = ${g} m/s², no air)?`,
        R, [v * v * sinD(th) / g, 2 * v * v * sinD(th) / g, v * v / (2 * g)], "m",
        `R = v² sin 2θ / g = ${v}² × sin ${2 * th}° / ${g} = ${R.toFixed(1)} m.`, "Range = v² sin 2θ / g.");
    },
    (L) => {
      const th = ri(10, 40);
      return textQ("range", 1, `Which other launch angle gives the <b>same range</b> as ${th}° (same speed, no air)?`,
        `${90 - th}°`, [`${180 - th}°`, `${2 * th}°`, `${45 + th}°`, `${th + 10}°`],
        `sin 2θ is the same for θ and 90° − θ, so ${th}° and ${90 - th}° land in the same place. The higher one stays up longer.`, "Think about sin 2θ.");
    },
    (L) => {
      const g = L === 1 ? 10 : 9.8, v = L === 1 ? pick([10, 20, 30]) : ri(15, 50), R = v * v / g;
      return numQ("range", L, `What is the <b>longest</b> possible range for a speed of <b>${v} m/s</b> on flat ground (g = ${g} m/s², no air)?`,
        R, [R / 2, 2 * R, v / g * 10], "m", `The best angle is 45°, where sin 2θ = 1, so R<sub>max</sub> = v²/g = ${R.toFixed(1)} m.`, "Which angle makes sin 2θ biggest?");
    },
    (L) => {
      const g = 9.8, R = ri(20, 120), v = Math.sqrt(R * g);
      return numQ("range", Math.max(L, 2), `At 45° with no air, what speed is needed to land <b>${R} m</b> away? (g = 9.8 m/s²)`,
        v, [R * g / 45, Math.sqrt(R * g / 2), Math.sqrt(2 * R * g)], "m/s", `At 45°, R = v²/g, so v = √(Rg) = √(${R} × 9.8) = ${v.toFixed(1)} m/s.`, "Rearrange R = v²/g.");
    },
    (L) => {
      const k = pick([2, 3]);
      return textQ("range", L, `If you throw ${k === 2 ? "twice" : "three times"} as fast (same angle, no air), the range becomes…`,
        `${k * k} times as far`, [`${k} times as far`, `${2 * k * k} times as far`, "the same"], `Range depends on v², so ${k}× the speed gives ${k}² = ${k * k}× the range.`, "Range ∝ v².");
    },
    (L) => textQ("range", 2, "On an <b>uphill</b> slope, compared with 45°, the angle for the longest throw (along the slope) is…",
      "Steeper than 45°", ["Exactly 45°", "Lower than 45°", "Always 30°"], "On a slope of angle α, the best angle is 45° + α/2. Uphill α is positive, so it's steeper.", "Try it in the Simulator with the Ground slope slider."),
  ],
  energy: [
    () => textQ("energy", 1, "At the very top of its path (no air), the ball's speed is…", "Equal to its horizontal speed", ["Zero", "Its launch speed", "Twice its horizontal speed"],
      "Only the vertical part becomes zero at the top. The horizontal part never changes without air.", "Which part of the velocity disappears at the top?"),
    () => textQ("energy", 1, "With no air, which stays the same during the whole flight?", "Horizontal velocity", ["Vertical velocity", "Speed", "Height"],
      "No force acts sideways, so the horizontal velocity stays constant. Gravity only changes the vertical part."),
    () => textQ("energy", 1, "What is the ball's acceleration at the top of its path?", "g, straight down", ["Zero", "g, along the path", "It depends on the angle"],
      "Gravity acts the whole time, including at the top. The acceleration is always g downward (without air)."),
    (L) => {
      const v = L === 1 ? pick([10, 20, 30]) : ri(10, 40), th = ri(20, 70), top = v * cosD(th);
      return numQ("energy", L, `Thrown at <b>${v} m/s</b> at <b>${th}°</b> (no air), how fast is it moving at the highest point?`,
        top, [0, v * sinD(th), v], "m/s", `At the top only the horizontal part is left: v cos θ = ${v} × cos ${th}° = ${top.toFixed(1)} m/s.`, "What's left when the vertical speed is zero?");
    },
    (L) => {
      const m = pick([0.1, 0.2, 0.5, 2]), v = ri(5, 30), ke = 0.5 * m * v * v;
      return numQ("energy", L, `A <b>${m} kg</b> ball is launched at <b>${v} m/s</b>. What is its kinetic energy at launch?`,
        ke, [m * v * v, m * v, 0.5 * m * v], "J", `KE = ½mv² = 0.5 × ${m} × ${v}² = ${ke.toFixed(1)} J.`, "KE = ½mv².");
    },
    () => textQ("energy", 2, "Launched and landing at the same height with no air, the landing speed is…", "The same as the launch speed", ["Slower than the launch speed", "Faster than the launch speed", "Zero"],
      "Energy is conserved: back at the same height, all the potential energy has turned back into kinetic energy."),
  ],
  air: [
    () => textQ("air", 1, "With air resistance, the angle for the longest throw is usually…", "Less than 45°", ["Exactly 45°", "More than 45°", "90°"],
      "Air slows the ball the longer it flies, so a lower, quicker path wins. Check it in Analysis → Best angle."),
    () => textQ("air", 1, "Air resistance pushes on a moving ball…", "Opposite to its motion through the air", ["Straight down", "Straight up", "Towards the target"],
      "Drag always acts against the ball's velocity relative to the air."),
    () => textQ("air", 2, "Drag on a fast ball grows roughly with…", "The square of its speed", ["Its speed", "Its mass", "Its height"],
      "At everyday speeds, F = ½ρC<sub>d</sub>Av²: double the speed and the drag is four times bigger."),
    () => textQ("air", 2, "With air resistance, compared with the way up, the way down is…", "Steeper and shorter", ["Exactly the same", "Longer and flatter", "Straight down"],
      "The ball loses horizontal speed as it flies, so it comes down more steeply than it went up."),
    () => textQ("air", 1, "A falling object reaches terminal velocity when…", "Drag equals its weight", ["It hits the ground", "Its speed reaches zero", "Gravity switches off"],
      "When drag balances weight there's no net force, so the speed stops increasing."),
    () => textQ("air", 2, "A headwind usually makes a throw…", "Land shorter", ["Land farther", "Go higher", "Stay the same"],
      "The ball moves faster relative to the air, so drag pushes back harder."),
    () => textQ("air", 2, "Why does a ping-pong ball slow down so much more than a golf ball?", "It has very little mass for its size", ["It is smoother", "It spins less", "Gravity is weaker on it"],
      "Drag depends on size and speed, but its effect depends on mass. A light ball gets slowed far more by the same drag."),
    () => textQ("air", 3, "Bob Beamon's 8.90 m long jump (1968) was in Mexico City, high above sea level. Thin air there means…", "Less drag", ["More drag", "Stronger gravity", "No effect at all"],
      "Air is less dense at altitude, so there's less drag. (Gravity is also very slightly weaker, but drag is the bigger difference.)"),
  ],
  planets: [
    () => textQ("planets", 1, "On the Moon, a hammer and a feather dropped together…", "Land at the same time", ["The hammer lands first", "The feather lands first", "Both float"],
      "There's no air on the Moon, so nothing slows the feather. Astronaut David Scott showed this on Apollo 15 in 1971."),
    (L) => {
      const v = ri(10, 30), th = 45, gE = 9.81, gM = 1.62, rE = v * v / gE, rM = v * v / gM;
      return numQ("planets", L, `A ${v} m/s throw at 45° lands ${rE.toFixed(1)} m away on Earth (no air). About how far would the same throw go on the Moon (g = 1.62 m/s²)?`,
        rM, [rE * 1.62, rE / 1.62, rE * 2], "m", `Range ∝ 1/g, so it's ${gE}/${gM} ≈ 6.1 times farther: ${rM.toFixed(0)} m.`, "Range = v²/g at 45°.", 0);
    },
    (L) => {
      const g = pick([1.62, 3.71, 24.79]), name = { 1.62: "the Moon", 3.71: "Mars", 24.79: "Jupiter's cloud tops" }[g], v = ri(10, 30), T = 2 * v / g;
      return numQ("planets", L, `A ball is thrown straight up at <b>${v} m/s</b> on ${name} (g = ${g} m/s²). How long until it comes back down?`,
        T, [v / g, 2 * v / 9.81, v * g / 10], "s", `Up and down takes T = 2v/g = 2 × ${v} / ${g} = ${T.toFixed(2)} s.`, "Twice the time to stop at the top.", 2);
    },
    () => textQ("planets", 1, "Which has the strongest gravity?", "Jupiter", ["Earth", "Mars", "The Moon"], "Jupiter's gravity at its cloud tops is about 24.8 m/s², around 2.5 times Earth's."),
    () => textQ("planets", 2, "Does a heavier ball (same size and shape) fall faster with no air?", "No, all objects fall with the same acceleration", ["Yes, heavier always falls faster", "Only on Earth", "Only if it's thrown"],
      "Without air, every object accelerates at g, whatever its mass. Galileo argued this in the 1600s."),
  ],
  instruments: [
    (L) => {
      const N = pick([10, 20, 50]);
      return numQ("instruments", L, `On a vernier calliper, <b>${N}</b> vernier divisions match <b>${N - 1}</b> main-scale divisions of 1 mm. What is the least count?`,
        1 / N, [1 / (N - 1), (N - 1) / N, N / 100], "mm", `LC = 1 MSD − 1 VSD = 1 − ${N - 1}/${N} = 1/${N} = ${(1 / N).toFixed(2)} mm.`, "LC = 1 MSD − 1 VSD.", 2);
    },
    (L) => {
      const msr = ri(10, 80), n = ri(1, 9), r = msr + n * 0.1;
      return numQ("instruments", L, `A vernier (LC 0.1 mm) shows main scale <b>${msr} mm</b> and vernier division <b>${n}</b> lining up. What's the reading?`,
        r, [msr + n, msr + n * 0.01, msr - n * 0.1], "mm", `Reading = MSR + n × LC = ${msr} + ${n} × 0.1 = ${r.toFixed(1)} mm.`, "Multiply the division by the least count.");
    },
    (L) => {
      const obs = ri(200, 600) / 10, e = pick([-0.3, -0.2, 0.2, 0.4]), t = obs - e;
      return numQ("instruments", Math.max(L, 2), `A vernier calliper has a zero error of <b>${e > 0 ? "+" : ""}${e} mm</b>. It reads <b>${obs.toFixed(1)} mm</b>. What is the true length?`,
        t, [obs + e, obs, obs - 2 * e], "mm", `True = observed − zero error = ${obs.toFixed(1)} − (${e}) = ${t.toFixed(1)} mm.`, "Always subtract the zero error (with its sign).");
    },
    (L) => {
      const pitch = pick([0.5, 1]), N = pitch === 0.5 ? 50 : 100;
      return numQ("instruments", L, `A screw gauge has pitch <b>${pitch} mm</b> and <b>${N}</b> circular divisions. Its least count is…`,
        pitch / N, [N / pitch / 1000, pitch / 10, 1 / N / 10], "mm", `LC = pitch ÷ divisions = ${pitch} ÷ ${N} = ${(pitch / N).toFixed(3)} mm.`, "LC = pitch ÷ number of divisions.", 3);
    },
    (L) => {
      const psr = ri(2, 16) / 2, csr = ri(1, 49), r = psr + csr * 0.01;
      return numQ("instruments", L, `A screw gauge (LC 0.01 mm) shows <b>${psr} mm</b> on the sleeve and division <b>${csr}</b> on the line. Reading?`,
        r, [psr + csr * 0.1, psr + csr * 0.001, csr * 0.01], "mm", `Reading = PSR + CSR × LC = ${psr} + ${csr} × 0.01 = ${r.toFixed(2)} mm.`, "PSR + CSR × LC.", 2);
    },
    (L) => {
      const l = pick([3, 4, 5]), h = pick([0.1, 0.2, 0.25, 0.4]), lmm = l * 10, R = (lmm * lmm / (6 * h) + h / 2) / 10;
      return numQ("instruments", 3, `A spherometer's legs are <b>${l} cm</b> apart and the height is <b>h = ${h} mm</b>. Find R (in cm).`,
        R, [R / 2, R * 3, lmm * lmm / (2 * h) / 10], "cm", `R = l²/6h + h/2 = ${lmm}²/(6 × ${h}) + ${h}/2 = ${(R * 10).toFixed(0)} mm ≈ ${R.toFixed(1)} cm.`, "Use R = l²/6h + h/2 with l and h in mm.");
    },
    () => textQ("instruments", 2, "Which instrument would you use to measure the diameter of a thin wire most precisely?", "Screw gauge", ["Metre rule", "Vernier calliper", "Spherometer"],
      "A screw gauge reads to 0.01 mm, ten times finer than a typical vernier calliper."),
    () => textQ("instruments", 2, "A spherometer is used to measure…", "The radius of curvature of a surface", ["The mass of a lens", "Focal length directly", "The thickness of paper"],
      "It measures the small height h of a curved surface, then R = l²/6h + h/2."),
  ],
  relative: [
    (L) => { const vb = ri(4, 8), vr = ri(1, 3), d = ri(40, 200);
      return numQ("relative", L, `A boat moves at <b>${vb} m/s</b> in still water. The river flows at <b>${vr} m/s</b>. To cross a <b>${d} m</b> wide river in the <b>least time</b>, how long does it take?`,
        d / vb, [d / Math.sqrt(vb * vb - vr * vr), d / (vb - vr), d / (vb + vr)], "s", `For least time, point straight across: t = d ÷ v_b = ${d} ÷ ${vb} = ${(d / vb).toFixed(1)} s. The river only moves you sideways.`, "Which heading puts all the boat's speed into crossing?"); },
    (L) => { const vb = ri(5, 9), vr = ri(1, 4), th = Math.asin(vr / vb) / RAD;
      return numQ("relative", Math.max(L, 2), `Boat speed <b>${vb} m/s</b>, river <b>${vr} m/s</b>. At what angle upstream (from straight across) must it head to land <b>directly opposite</b>?`,
        th, [Math.atan(vr / vb) / RAD, Math.acos(vr / vb) / RAD, vr / vb * 90], "°", `sin θ = v_r ÷ v_b = ${vr}/${vb}, so θ = ${th.toFixed(1)}°.`, "The upstream part of the boat's velocity must cancel the river."); },
    (L) => { const vb = ri(6, 10), vr = ri(1, 4), D = ri(10, 60) * 10;
      return numQ("relative", L, `A boat (${vb} m/s in still water) goes <b>${D} m upstream</b> in a river flowing at ${vr} m/s. How long does it take?`,
        D / (vb - vr), [D / (vb + vr), D / vb, D / vr], "s", `Upstream speed = v_b − v_r = ${vb - vr} m/s, so t = ${D} ÷ ${vb - vr} = ${(D / (vb - vr)).toFixed(1)} s.`, "Upstream, the river slows you."); },
    (L) => { const rain = ri(6, 12), man = ri(2, 6), ang = Math.atan(man / rain) / RAD;
      return numQ("relative", L, `Rain falls straight down at <b>${rain} m/s</b>. You walk at <b>${man} m/s</b>. At what angle from vertical should you tilt your umbrella?`,
        ang, [Math.atan(rain / man) / RAD, man / rain * 90, Math.asin(Math.min(1, man / rain)) / RAD + 5], "°", `Relative to you the rain also moves backward at ${man} m/s, so tan θ = ${man}/${rain}: θ = ${ang.toFixed(1)}° forward.`, "Find the rain's velocity relative to you."); },
    () => textQ("relative", 1, "Rain falls straight down. As you start walking, it seems to come…", "Slanting towards you from the front", ["Straight down still", "From behind you", "Upwards"],
      "Relative to you the rain gains a backward velocity, so it seems to come from in front. Tilt your umbrella forward."),
    () => textQ("relative", 2, "Two cars drive towards each other at 50 km/h and 70 km/h. How fast does each see the other approaching?", "120 km/h", ["20 km/h", "70 km/h", "60 km/h"],
      "Moving towards each other, relative speed = 50 + 70 = 120 km/h."),
  ],
  history: [
    () => { const e = pick(HISTORY.filter((h) => h.who)); const others = shuffle(HISTORY.filter((h) => h.who && h.who !== e.who).map((h) => h.who)).filter((v, i, a) => a.indexOf(v) === i);
      return textQ("history", 1, `Who is linked with this? <i>“${e.title}”</i>`, e.who, others.slice(0, 3), e.short); },
    () => { const e = pick(HISTORY.filter((h) => Number.isInteger(h.year) && h.year > 1400 && h.year < 2000)); const ys = [e.year - pick([30, 60]), e.year + pick([40, 90]), e.year - pick([100, 150])];
      return textQ("history", 2, `When did this happen? <i>“${e.title}”</i>`, String(e.year), ys.map(String), e.short); },
    () => textQ("history", 1, "Who first showed that a projectile's path is a parabola?", "Galileo Galilei", ["Isaac Newton", "Aristotle", "Pierre Vernier"],
      "Galileo split the motion into steady horizontal motion and accelerating vertical motion, giving a parabola (Two New Sciences, 1638)."),
    () => textQ("history", 2, "Aristotle thought a thrown stone kept moving because…", "The air pushed it along", ["Gravity pulled it forward", "It had momentum", "Of magnetism"],
      "This idea was criticised for centuries and replaced by impetus theory, then Newton's laws."),
  ],
};

function makeQuestion(topic, level) {
  const gens = GEN[topic];
  for (let tries = 0; tries < 12; tries++) {
    const q = pick(gens)(level);
    if (!q) continue;
    if (Math.abs(q.level - level) <= 1 || tries > 8) return q;
  }
  return pick(gens)(level);
}

function initQuiz(app, el) {
  const blank = { name: "", xp: 0, answered: 0, correct: 0, bestStreak: 0, topics: {}, scores: [],
                  settings: { topics: Object.keys(QUIZ_TOPICS), level: "adaptive", count: 10, mode: "practice" } };
  const prof = { ...blank, ...app.store.get("quiz", {}) };
  prof.settings = { ...blank.settings, ...prof.settings };
  const save = () => app.store.set("quiz", prof);
  let game = null, timer = null;

  const rankOf = (xp) => ({ i: Math.min(RANKS.length - 1, Math.floor(xp / 150)), into: xp % 150 });
  const acc = (t) => (t && t.total ? t.right / t.total : null);

  function recommend() {
    const tried = Object.keys(QUIZ_TOPICS).filter((k) => prof.topics[k]?.total >= 3);
    const untried = Object.keys(QUIZ_TOPICS).filter((k) => !(prof.topics[k]?.total));
    if (tried.length) {
      const weak = tried.reduce((a, b) => (acc(prof.topics[a]) <= acc(prof.topics[b]) ? a : b));
      if (acc(prof.topics[weak]) < 0.8) return { topic: weak, why: `your weakest topic (${Math.round(acc(prof.topics[weak]) * 100)}% so far)` };
    }
    if (untried.length) return { topic: untried[0], why: "you haven't tried it yet" };
    return null;
  }

  // ---------- setup screen ----------
  function setup() {
    clearInterval(timer);
    const s = prof.settings, r = rankOf(prof.xp), rec = recommend();
    const overall = prof.answered ? Math.round(100 * prof.correct / prof.answered) : 0;
    el.innerHTML = `
      <div class="sec-bar"><div class="card-sub">Fresh questions every time. It remembers how you do and helps with your weak spots.</div></div>
      ${funFact("quiz", "Quick tip")}
      <div class="quiz-grid">
        <section class="card profile">
          <div class="hello">${prof.name ? (prof.answered ? `Welcome back, <b>${esc(prof.name)}</b>!` : `Hi, <b>${esc(prof.name)}</b>! Ready for your first quiz?`) : "Hi! What should we call you?"}</div>
          <div class="name-row"><input type="text" id="qz-name" maxlength="24" placeholder="Your name" value="${esc(prof.name)}"></div>
          <div class="rank"><div class="rank-badge">${r.i + 1}</div><div><b>${RANKS[r.i]}</b><div class="xpbar"><span style="width:${r.into / 1.5}%"></span></div>
            <small>${prof.xp} XP · ${150 - r.into} XP to ${RANKS[Math.min(r.i + 1, RANKS.length - 1)]}</small></div></div>
          <div class="mini-stats"><div><b>${prof.answered}</b><span>answered</span></div><div><b>${overall}%</b><span>accuracy</span></div><div><b>🔥 ${prof.bestStreak}</b><span>best streak</span></div></div>
          <div class="group-label">Your topics</div>
          <div class="mastery">${Object.entries(QUIZ_TOPICS).map(([k, t]) => { const a = acc(prof.topics[k]);
            return `<div class="m-row"><span>${t.name}</span><div class="m-bar"><span style="width:${a == null ? 0 : a * 100}%;background:${t.color}"></span></div><small>${a == null ? "—" : Math.round(a * 100) + "%"}</small></div>`; }).join("")}</div>
          ${prof.scores.length > 1 ? `<div class="group-label">Recent quizzes</div><canvas id="qz-trend" class="trend"></canvas>` : ""}
          ${prof.answered ? `<button class="btn ghost" id="qz-wipe">Reset my progress</button>` : ""}
        </section>
        <section class="card">
          ${rec ? `<div class="recommend"><div><b>Recommended for you</b><div>${QUIZ_TOPICS[rec.topic].name}: ${rec.why}.</div></div>
            <button class="btn primary" data-quick="${rec.topic}">Practise it</button></div>` : ""}
          <div class="group-label">Topics</div>
          <div class="pills multi" id="qz-topics">${Object.entries(QUIZ_TOPICS).map(([k, t]) =>
            `<button data-topic="${k}" class="${s.topics.includes(k) ? "on" : ""}" style="--tc:${t.color}">${t.name}</button>`).join("")}</div>
          <div class="group-label">Difficulty</div>
          <div class="seg" data-qset="level">${[["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"], ["adaptive", "Adaptive"]].map(([v, l]) => `<button data-val="${v}" class="${s.level === v ? "on" : ""}">${l}</button>`).join("")}</div>
          <div class="hint">${s.level === "adaptive" ? "Adaptive starts easy and gets harder when you're on a roll." : "Questions stay at this level."}</div>
          <div class="group-label">Questions</div>
          <div class="count-row"><div class="seg" data-qset="count">${[5, 10, 15, 20].map((n) => `<button data-val="${n}" class="${s.count === n ? "on" : ""}">${n}</button>`).join("")}</div>
            <span class="num"><input type="number" id="qz-count" min="1" max="50" value="${s.count}" inputmode="numeric" aria-label="Custom number of questions"><span class="unit">custom</span></span></div>
          <div class="group-label">Mode</div>
          <div class="seg" data-qset="mode"><button data-val="practice" class="${s.mode === "practice" ? "on" : ""}">Practice · hints</button><button data-val="timed" class="${s.mode === "timed" ? "on" : ""}">Timed · 30 s</button></div>
          <button class="btn primary big" id="qz-start">Start quiz</button>
        </section>
      </div>`;
    if (prof.scores.length > 1) {
      const sc = prof.scores.slice(-12);
      requestAnimationFrame(() => drawChart(el.querySelector("#qz-trend"), {
        series: [{ x: sc.map((_, i) => i + 1), y: sc.map((s) => s.pct), color: "#7C3AED", width: 3 }],
        xLabel: "Quiz", yLabel: "Score (%)", yFromZero: true }));
    }
  }

  // ---------- playing ----------
  function start(opts = {}) {
    const s = prof.settings;
    const topics = opts.topics || s.topics;
    if (!topics.length) { app.toast?.("Pick at least one topic"); return; }
    const lvl = { easy: 1, medium: 2, hard: 3, adaptive: 1 }[s.level];
    game = { topics, level: lvl, adaptive: s.level === "adaptive", count: opts.questions ? opts.questions.length : s.count,
             i: 0, right: 0, streak: 0, best: 0, xp: 0, answers: [], fixed: opts.questions || null, run: 0 };
    nextQ();
  }

  function nextQ() {
    if (game.i >= game.count) return results();
    // topics you find harder come up more often
    const weights = game.topics.map((k) => { const a = acc(prof.topics[k]); return a == null ? 1.5 : 1 + 2 * (1 - a); });
    let r = Math.random() * weights.reduce((x, y) => x + y, 0), topic = game.topics[0];
    for (let k = 0; k < weights.length; k++) { r -= weights[k]; if (r <= 0) { topic = game.topics[k]; break; } }
    game.q = game.fixed ? { ...game.fixed[game.i], options: game.fixed[game.i].options } : makeQuestion(topic, game.level);
    game.chosen = null; game.hintUsed = false; game.timeLeft = 30;
    play();
    if (prof.settings.mode === "timed" && !game.fixed) {
      clearInterval(timer);
      timer = setInterval(() => {
        game.timeLeft -= 0.1;
        const bar = el.querySelector(".timer span");
        if (bar) bar.style.width = `${Math.max(0, game.timeLeft / 30 * 100)}%`;
        if (game.timeLeft <= 0) { clearInterval(timer); answer(-1); }
      }, 100);
    }
  }

  function play() {
    const q = game.q, t = QUIZ_TOPICS[q.topic], done = game.chosen !== null;
    const letters = "ABCD";
    el.innerHTML = `
      <section class="card quiz-card">
        <div class="q-top"><span>Question <b>${game.i + 1}</b> of ${game.count}</span>
          <span class="q-chips"><span class="chip" style="--tc:${t.color}">${t.name}</span><span class="chip lv">${LEVEL_NAMES[game.level - 1]}</span>
          <span class="chip fire">🔥 ${game.streak}</span><span class="chip xp">+${game.xp} XP</span></span></div>
        <div class="progress"><span style="width:${game.i / game.count * 100}%"></span></div>
        ${prof.settings.mode === "timed" && !game.fixed && !done ? `<div class="timer"><span style="width:100%"></span></div>` : ""}
        <div class="question">${q.q}</div>
        <div class="options">${q.options.map((o, i) => {
          let cls = "";
          if (done) cls = i === q.answer ? "right" : i === game.chosen ? "wrong" : "dim";
          return `<button class="opt ${cls}" data-opt="${i}" ${done ? "disabled" : ""}><span class="letter">${letters[i]}</span><span>${o}</span></button>`; }).join("")}</div>
        ${!done && q.hint && prof.settings.mode === "practice" ? `<button class="btn ghost" id="qz-hint">${ICON.info}${game.hintUsed ? q.hint : "Show a hint (half XP)"}</button>` : ""}
        ${done ? feedbackHTML() : ""}
        <button class="btn ghost small" id="qz-quit">End quiz</button>
      </section>`;
  }

  function feedbackHTML() {
    const q = game.q, ok = game.chosen === q.answer;
    const cheers = ["Correct!", "Spot on!", "Nice!", "Exactly right!"];
    let head = ok ? pick(cheers) : game.chosen === -1 ? "Time's up." : "Not quite.";
    if (ok && game.streak >= 3) head = `${game.streak} in a row!${prof.name ? " Brilliant, " + esc(prof.name) + "." : ""}`;
    const last = game.i + 1 >= game.count;
    return `<div class="feedback ${ok ? "good" : "bad"}"><b>${head}</b>${ok ? "" : ` The answer is <b>${q.options[q.answer]}</b>.`}<div>${q.explain}</div></div>
      <button class="btn primary big" id="qz-next">${last ? "See my results" : "Next question →"}</button>`;
  }

  function answer(i) {
    if (game.chosen !== null) return;
    clearInterval(timer);
    const q = game.q, ok = i === q.answer;
    game.chosen = i;
    if (ok) {
      game.right++; game.streak++; game.best = Math.max(game.best, game.streak);
      const gain = (game.hintUsed ? 5 : 10) * game.level + (game.streak >= 3 ? 5 : 0);
      game.xp += gain;
      if (game.adaptive && ++game.run >= 2 && game.level < 3) { game.level++; game.run = 0; }
    } else {
      game.streak = 0; game.run = 0;
      if (game.adaptive && game.level > 1) game.level--;
    }
    game.answers.push({ q, chosen: i, ok });
    if (ok) setTimeout(() => confetti(el.querySelector(".quiz-card"), game.streak >= 3 ? 40 : 18), 30);
    const tp = prof.topics[q.topic] || { right: 0, total: 0 };
    tp.total++; if (ok) tp.right++;
    prof.topics[q.topic] = tp;
    prof.answered++; if (ok) prof.correct++;
    prof.bestStreak = Math.max(prof.bestStreak, game.streak);
    save();
    play();
  }

  // ---------- results ----------
  function results() {
    clearInterval(timer);
    const n = game.answers.length, pct = n ? Math.round(100 * game.right / n) : 0;
    prof.xp += game.xp;
    if (n) prof.scores = [...prof.scores, { pct, n, date: Date.now() }].slice(-30);
    save();
    const head = pct >= 90 ? "Outstanding" : pct >= 70 ? "Great work" : pct >= 50 ? "Good effort" : "Keep practising";
    const col = pct >= 70 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626";
    const by = {};
    for (const a of game.answers) { const b = by[a.q.topic] || (by[a.q.topic] = { r: 0, t: 0 }); b.t++; if (a.ok) b.r++; }
    const wrong = game.answers.filter((a) => !a.ok);
    const rec = recommend();
    // strongest and weakest areas, from everything you've answered so far
    const tried = Object.entries(prof.topics).filter(([, t]) => t.total > 0).map(([k, t]) => [k, t.right / t.total, t.total]);
    tried.sort((a, b) => b[1] - a[1] || b[2] - a[2]);
    const strong = tried[0], weak = tried.length > 1 ? tried[tried.length - 1] : null;
    const sw = strong ? `<div class="sw">
      <div class="sw-card good"><span>💪 Strongest area</span><b>${QUIZ_TOPICS[strong[0]].name}</b><small>${Math.round(strong[1] * 100)}% correct</small></div>
      ${weak ? `<div class="sw-card bad"><span>🎯 Needs practice</span><b>${QUIZ_TOPICS[weak[0]].name}</b><small>${Math.round(weak[1] * 100)}% correct</small></div>` : ""}</div>` : "";
    el.innerHTML = `
      <section class="card results">
        <div class="res-top">
          <div class="ring" style="--p:${pct};--c:${col}"><span>${pct}%</span></div>
          <div><div class="page-title">${head}${prof.name ? ", " + esc(prof.name) : ""}!</div>
            <div class="card-sub">${game.right} of ${n} correct · best streak ${game.best} · <b>+${game.xp} XP</b></div></div>
        </div>
        ${sw}
        <div class="group-label">By topic (this round)</div>
        <div class="mastery">${Object.entries(by).map(([k, b]) => `<div class="m-row"><span>${QUIZ_TOPICS[k].name}</span><div class="m-bar"><span style="width:${b.r / b.t * 100}%;background:${QUIZ_TOPICS[k].color}"></span></div><small>${b.r}/${b.t}</small></div>`).join("")}</div>
        ${wrong.length ? `<div class="group-label">Review your mistakes</div>${wrong.map((a) => `<details class="more"><summary>${a.q.q.replace(/<[^>]+>/g, "")}</summary>
          <div class="review">You said <b>${a.chosen < 0 ? "nothing (time ran out)" : a.q.options[a.chosen]}</b>. The answer is <b>${a.q.options[a.q.answer]}</b>.<div>${a.q.explain}</div></div></details>`).join("")}` : `<div class="note">A perfect round. Try a harder level!</div>`}
        <div class="group-label">What next?</div>
        <div class="btnrow wrap">
          <button class="btn primary" id="qz-again">Play again</button>
          ${wrong.length ? `<button class="btn" id="qz-retry">Retry my ${wrong.length} mistake${wrong.length > 1 ? "s" : ""}</button>` : ""}
          ${rec ? `<button class="btn" data-quick="${rec.topic}">Practise ${QUIZ_TOPICS[rec.topic].name}</button>` : ""}
          <button class="btn ghost" id="qz-setup">Change settings</button>
        </div>
      </section>`;
    game.wrong = wrong.map((a) => a.q);
  }

  // ---------- events ----------
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const s = prof.settings;
    if (b.dataset.topic) {
      const k = b.dataset.topic;
      s.topics = s.topics.includes(k) ? s.topics.filter((x) => x !== k) : [...s.topics, k];
      b.classList.toggle("on", s.topics.includes(k)); save(); return;
    }
    const qset = b.parentElement?.dataset.qset;
    if (qset) { s[qset] = qset === "count" ? +b.dataset.val : b.dataset.val; save(); return setup(); }
    if (b.dataset.quick) { prof.settings.level = prof.settings.level || "adaptive"; return start({ topics: [b.dataset.quick] }); }
    if (b.dataset.opt !== undefined) return answer(+b.dataset.opt);
    switch (b.id) {
      case "qz-start": return start();
      case "qz-next": game.i++; return nextQ();
      case "qz-hint": game.hintUsed = true; return play();
      case "qz-quit": return game.answers.length ? results() : setup();
      case "qz-again": return start({ topics: game.topics });
      case "qz-retry": return start({ questions: game.wrong });
      case "qz-setup": return setup();
      case "qz-wipe":
        if (confirm("Reset your quiz progress? This can't be undone.")) { Object.assign(prof, structuredClone(blank)); save(); setup(); }
    }
  });
  el.addEventListener("input", (e) => {
    if (e.target.id === "qz-name") { prof.name = e.target.value.trim(); save(); }
    if (e.target.id === "qz-count") { const n = Math.round(+e.target.value); if (n >= 1 && n <= 50) { prof.settings.count = n; save();
      el.querySelectorAll("[data-qset=count] button").forEach((b) => b.classList.toggle("on", +b.dataset.val === n)); } }
  });
  el.addEventListener("change", (e) => { if (e.target.id === "qz-name") setup(); });

  setup();
  return { show() { if (!game) setup(); } };
}
