// ===================================================================
//  Physics: launches a projectile and steps it forward in time (RK4)
//  until it lands. Handles air resistance, wind, slopes and bouncing.
// ===================================================================

const AIR_DENSITY = 1.225; // kg/m³ at sea level
const RAD = Math.PI / 180;

function simulate(p, steps = 1500, maxSteps = 30000, maxBounces = 12) {
  const th = p.angle * RAD, ph = p.azimuth * RAD, al = p.incline * RAD;
  const tanA = Math.tan(al);
  const nx = -Math.sin(al), nz = Math.cos(al); // straight out of the ground
  const g = p.g;

  const horiz = p.speed * Math.cos(th);
  let vx = horiz * Math.cos(ph), vy = horiz * Math.sin(ph), vz = p.speed * Math.sin(th);
  let x = 0, y = 0, z = p.height;

  const area = Math.PI * (p.diameter / 2) ** 2;
  const rho = p.rho ?? AIR_DENSITY;
  const k = p.drag ? 0.5 * rho * p.cd * area / p.mass : 0;
  let wx = 0, wy = 0;
  if (p.drag && p.wind) {
    wx = p.windSpeed * Math.cos(p.windDir * RAD);
    wy = p.windSpeed * Math.sin(p.windDir * RAD);
  }

  // acceleration from gravity + drag (drag acts on velocity relative to the air)
  const acc = (vx, vy, vz) => {
    const rx = vx - wx, ry = vy - wy, rz = vz;
    const s = Math.sqrt(rx * rx + ry * ry + rz * rz);
    return [-k * s * rx, -k * s * ry, -g - k * s * rz];
  };

  const tEst = (vz + Math.sqrt(Math.max(vz * vz + 2 * g * p.height, 0))) / g;
  // Without air, RK4 is exact for steady gravity, so any step size works: always use about `steps` steps.
  // With air, keep steps small enough to follow the drag.
  const dt = p.drag ? Math.min(Math.max(tEst / steps, 2e-4), 0.05) : Math.max(tEst / steps, 2e-4);

  const T = [0], X = [x], Y = [y], Z = [z], VX = [vx], VY = [vy], VZ = [vz];
  const impacts = [];
  let t = 0, gap = z - x * tanA;

  for (let i = 0; i < maxSteps; i++) {
    const a1 = acc(vx, vy, vz);
    const v2 = [vx + 0.5 * dt * a1[0], vy + 0.5 * dt * a1[1], vz + 0.5 * dt * a1[2]];
    const a2 = acc(v2[0], v2[1], v2[2]);
    const v3 = [vx + 0.5 * dt * a2[0], vy + 0.5 * dt * a2[1], vz + 0.5 * dt * a2[2]];
    const a3 = acc(v3[0], v3[1], v3[2]);
    const v4 = [vx + dt * a3[0], vy + dt * a3[1], vz + dt * a3[2]];
    const a4 = acc(v4[0], v4[1], v4[2]);
    const nxp = x + dt / 6 * (vx + 2 * v2[0] + 2 * v3[0] + v4[0]);
    const nyp = y + dt / 6 * (vy + 2 * v2[1] + 2 * v3[1] + v4[1]);
    const nzp = z + dt / 6 * (vz + 2 * v2[2] + 2 * v3[2] + v4[2]);
    const nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
    const nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
    const nvz = vz + dt / 6 * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2]);
    const newGap = nzp - nxp * tanA;

    if (newGap >= 0) {
      x = nxp; y = nyp; z = nzp; vx = nvx; vy = nvy; vz = nvz; t += dt; gap = newGap;
      T.push(t); X.push(x); Y.push(y); Z.push(z); VX.push(vx); VY.push(vy); VZ.push(vz);
      continue;
    }

    // Went through the ground: find the exact landing point
    const f = gap > newGap ? gap / (gap - newGap) : 0;
    x += f * (nxp - x); y += f * (nyp - y);
    vx += f * (nvx - vx); vy += f * (nvy - vy); vz += f * (nvz - vz);
    t += f * dt; z = x * tanA;
    T.push(t); X.push(x); Y.push(y); Z.push(z); VX.push(vx); VY.push(vy); VZ.push(vz);
    impacts.push(T.length - 1);

    if (!p.bounce || impacts.length > maxBounces) break;
    const vn = vx * nx + vz * nz; // speed into the ground (negative)
    if (-vn * p.restitution < 0.3) break; // too slow to bounce again
    const fr = 0.9, tx = vx - vn * nx, ty = vy, tz = vz - vn * nz;
    vx = fr * tx - p.restitution * vn * nx;
    vy = fr * ty;
    vz = fr * tz - p.restitution * vn * nz;
    z += 1e-9; gap = z - x * tanA;
  }

  const tr = { t: T, x: X, y: Y, z: Z, vx: VX, vy: VY, vz: VZ, impacts };
  tr.s = summarize(p, tr);
  return tr;
}

function speedAt(tr, i) {
  return Math.hypot(tr.vx[i], tr.vy[i], tr.vz[i]);
}

function summarize(p, tr) {
  const n = tr.t.length;
  const i1 = tr.impacts.length ? tr.impacts[0] : n - 1;
  let ia = 0, imax = 0, imin = 0;
  for (let i = 0; i <= i1; i++) {
    if (tr.z[i] > tr.z[ia]) ia = i;
    const s = speedAt(tr, i);
    if (s > speedAt(tr, imax)) imax = i;
    if (s < speedAt(tr, imin)) imin = i;
  }
  const energy = (i) => 0.5 * p.mass * speedAt(tr, i) ** 2 + p.mass * p.g * tr.z[i];
  const e0 = energy(0);
  return {
    landed: tr.impacts.length > 0,
    iImpact: i1, iApex: ia, iVmax: imax, iVmin: imin,
    flightTime: tr.t[i1],
    range: tr.x[i1],
    rangeSlope: tr.x[i1] / Math.cos(p.incline * RAD),
    drift: tr.y[i1],
    maxHeight: tr.z[ia],
    apexTime: tr.t[ia],
    vMax: speedAt(tr, imax),
    vMin: speedAt(tr, imin),
    impactSpeed: speedAt(tr, i1),
    impactAngle: Math.atan2(-tr.vz[i1], Math.hypot(tr.vx[i1], tr.vy[i1])) / RAD,
    energyLost: e0 > 0 ? (e0 - energy(i1)) / e0 * 100 : 0,
    bounces: Math.max(tr.impacts.length - 1, 0),
    restX: tr.x[n - 1],
    endTime: tr.t[n - 1],
  };
}

// Position and velocity at any time (linear interpolation between steps)
function stateAt(tr, t) {
  const T = tr.t, n = T.length;
  if (t <= 0) return { i: 0, x: tr.x[0], y: tr.y[0], z: tr.z[0], vx: tr.vx[0], vy: tr.vy[0], vz: tr.vz[0] };
  if (t >= T[n - 1]) {
    const j = n - 1;
    return { i: j, x: tr.x[j], y: tr.y[j], z: tr.z[j], vx: tr.vx[j], vy: tr.vy[j], vz: tr.vz[j] };
  }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
  const f = (t - T[lo]) / (T[hi] - T[lo] || 1);
  const L = (a) => a[lo] + f * (a[hi] - a[lo]);
  return { i: lo, x: L(tr.x), y: L(tr.y), z: L(tr.z), vx: L(tr.vx), vy: L(tr.vy), vz: L(tr.vz) };
}

function flightRange(p, angle) {
  return simulate({ ...p, angle, bounce: false }, 400).s.rangeSlope;
}

// Golden-section search for the angle that lands farthest along the ground
function bestAngle(p) {
  let lo = Math.max(-89, p.incline + 0.5), hi = 89.5;
  const r = (Math.sqrt(5) - 1) / 2;
  let a = hi - r * (hi - lo), b = lo + r * (hi - lo);
  let fa = flightRange(p, a), fb = flightRange(p, b);
  for (let i = 0; i < 40; i++) {
    if (fa > fb) { hi = b; b = a; fb = fa; a = hi - r * (hi - lo); fa = flightRange(p, a); }
    else { lo = a; a = b; fa = fb; b = lo + r * (hi - lo); fb = flightRange(p, b); }
  }
  const best = (lo + hi) / 2;
  return { angle: best, range: flightRange(p, best) };
}

// Range for a spread of launch angles
function angleSweep(p, n = 60) {
  const lo = Math.max(-89, p.incline + 1), out = { angle: [], range: [] };
  for (let i = 0; i < n; i++) {
    const a = lo + (89 - lo) * i / (n - 1);
    out.angle.push(a);
    out.range.push(simulate({ ...p, angle: a, bounce: false }, 300).s.rangeSlope);
  }
  return out;
}
