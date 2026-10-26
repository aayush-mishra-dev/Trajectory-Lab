// ===================================================================
//  3D view: a perspective camera you can rotate (drag) and zoom (pinch
//  or scroll). x = forward, y = sideways, z = up.
// ===================================================================

const CAM_DEFAULT = { yaw: -58, pitch: 24, zoom: 1 };

function makeCamera(cam, bounds, W, H) {
  const [cx, cy, cz] = bounds.center;
  const fov = 38 * RAD, f = (H / 2) / Math.tan(fov / 2);
  const dist = bounds.radius / Math.sin(fov / 2) * 1.05;
  const yaw = cam.yaw * RAD, pitch = cam.pitch * RAD;
  const eye = [cx + dist * Math.cos(pitch) * Math.cos(yaw),
               cy + dist * Math.cos(pitch) * Math.sin(yaw),
               cz + dist * Math.sin(pitch)];
  const fw = norm([cx - eye[0], cy - eye[1], cz - eye[2]]);
  const right = norm(cross(fw, [0, 0, 1]));
  const up = cross(right, fw);
  const raw = (x, y, z) => {
    const d = [x - eye[0], y - eye[1], z - eye[2]];
    const zc = dot(d, fw);
    return zc < 1e-6 ? null : [f * dot(d, right) / zc, -f * dot(d, up) / zc, zc];
  };
  // Fit: scale and centre so the whole scene fills the canvas from this angle
  let mx0 = Infinity, mx1 = -Infinity, my0 = Infinity, my1 = -Infinity;
  for (const x of [bounds.x0, bounds.x1]) for (const y of [-bounds.half, bounds.half])
    for (const z of [bounds.z0, bounds.z1, x * bounds.tanA]) {
      const q = raw(x, y, z); if (!q) continue;
      mx0 = Math.min(mx0, q[0]); mx1 = Math.max(mx1, q[0]); my0 = Math.min(my0, q[1]); my1 = Math.max(my1, q[1]);
    }
  const fit = Math.min(W * 0.84 / (mx1 - mx0 || 1), (H - 70) * 0.86 / (my1 - my0 || 1)) * cam.zoom;
  const mcx = (mx0 + mx1) / 2, mcy = (my0 + my1) / 2;
  return {
    eye,
    project(x, y, z) {
      const q = raw(x, y, z);
      if (!q) return null;
      return { x: W / 2 + (q[0] - mcx) * fit, y: H / 2 + 8 + (q[1] - mcy) * fit, depth: q[2], f: f * fit };
    },
  };
}

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

function sceneBounds(sc) {
  const { tr, p, show } = sc;
  const tanA = Math.tan(p.incline * RAD);
  const paths = [tr, ...(show.pinned ? sc.pinned.map((q) => q.tr) : []), ...(sc.vac ? [sc.vac] : [])];
  let x0 = 0, x1 = 0, ymax = 0, z1 = p.height;
  for (const q of paths) for (let i = 0; i < q.x.length; i++) {
    x0 = Math.min(x0, q.x[i]); x1 = Math.max(x1, q.x[i]);
    ymax = Math.max(ymax, Math.abs(q.y[i])); z1 = Math.max(z1, q.z[i]);
  }
  const span = Math.max(x1 - x0, 1);
  x0 -= 0.06 * span; x1 += 0.06 * span;
  const half = Math.max(ymax * 1.3, 0.22 * span);
  const z0 = Math.min(0, x0 * tanA, x1 * tanA);
  z1 = Math.max(z1, x0 * tanA, x1 * tanA);
  const center = [(x0 + x1) / 2, 0, (z0 + z1) / 2];
  const radius = 0.5 * Math.hypot(x1 - x0, 2 * half, z1 - z0);
  return { x0, x1, half, z0, z1, center, radius, tanA, span };
}

function draw3D(cv, sc) {
  cv.style.height = "";  // 3D uses the fixed shape from the CSS
  const { ctx, w: W, h: H } = prepCanvas(cv);
  const { tr, p, show } = sc;
  const s = tr.s, B = sceneBounds(sc), tanA = B.tanA;
  const cam = makeCamera(sc.cam, B, W, H);
  const P = (x, y, z) => cam.project(x, y, z);
  const phone = W < 560;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#F3F7FE"); bg.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const poly = (pts, fill, stroke, lw = 1) => {
    const q = pts.map((a) => P(...a));
    if (q.some((v) => !v)) return;
    ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y);
    for (const v of q.slice(1)) ctx.lineTo(v.x, v.y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };
  const seg = (a, b, color, lw = 1, dash) => {
    const A = P(...a), Bp = P(...b);
    if (!A || !Bp) return;
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Bp.x, Bp.y); ctx.stroke(); ctx.setLineDash([]);
  };
  const text = (str, pt, color = COL.muted, align = "center", size = 11) => {
    const v = P(...pt); if (!v) return;
    ctx.font = `500 ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align;
    ctx.fillText(str, v.x, v.y); ctx.textAlign = "left";
  };

  // ----- ground plane with grid -----
  const { x0, x1, half } = B;
  const gz = (x) => x * tanA;
  poly([[x0, -half, gz(x0)], [x1, -half, gz(x1)], [x1, half, gz(x1)], [x0, half, gz(x0)]],
       COL.groundFill, COL.ground, 1.5);
  const step = niceStep(Math.max(x1 - x0, 2 * half), phone ? 5 : 7);
  for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step)
    seg([gx, -half, gz(gx)], [gx, half, gz(gx)], "rgba(107,143,78,0.28)");
  for (let gy = Math.ceil(-half / step) * step; gy <= half; gy += step)
    seg([x0, gy, gz(x0)], [x1, gy, gz(x1)], "rgba(107,143,78,0.28)");
  seg([x0, 0, gz(x0)], [x1, 0, gz(x1)], "rgba(107,143,78,0.55)", 1.2);

  // tick labels on the edges nearest the camera
  const nearY = cam.eye[1] < 0 ? -half : half;
  const nearX = cam.eye[0] < B.center[0] ? x0 : x1;
  for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step)
    text(fmt(gx, step), [gx, nearY * 1.08, gz(gx)]);
  for (let gy = Math.ceil(-half / step) * step; gy <= half; gy += step)
    if (Math.abs(gy) > 1e-9) text(fmt(gy, step), [nearX + (nearX === x0 ? -1 : 1) * 0.04 * B.span, gy, gz(nearX)]);
  if (!phone) text("forward (m)", [(x0 + x1) / 2, nearY * 1.32, gz((x0 + x1) / 2)], COL.navy, "center", 12);

  // height ruler at the far corner
  const farX = nearX === x0 ? x1 : x0, farY = -nearY;
  const zTop = B.z1 * 1.08;
  seg([farX, farY, gz(farX)], [farX, farY, zTop], COL.gridStrong, 1.2);
  let zstep = niceStep(zTop - gz(farX), 4);
  const pa = P(farX, farY, 0), pb = P(farX, farY, zstep);
  if (pa && pb && Math.abs(pa.y - pb.y) < 16) zstep *= Math.ceil(16 / Math.max(Math.abs(pa.y - pb.y), 1));
  for (let z = Math.ceil(gz(farX) / zstep) * zstep; z <= zTop; z += zstep) {
    seg([farX, farY, z], [farX + (farX === x1 ? -1 : 1) * 0.02 * B.span, farY, z], COL.gridStrong, 1.2);
    text(`${fmt(z, zstep)} m`, [farX, farY, z], COL.muted, "right");
  }

  // ----- paths -----
  const path3 = (q, upto, color, lw, dash, onGround = false) => {
    const n = upto ?? q.x.length, stp = Math.max(1, Math.floor(n / 600));
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i += stp) {
      const v = P(q.x[i], q.y[i], onGround ? gz(q.x[i]) : q.z[i]);
      if (!v) continue;
      if (!started) { ctx.moveTo(v.x, v.y); started = true; } else ctx.lineTo(v.x, v.y);
    }
    const j = n - 1, v = P(q.x[j], q.y[j], onGround ? gz(q.x[j]) : q.z[j]);
    if (v && started) ctx.lineTo(v.x, v.y);
    ctx.stroke(); ctx.setLineDash([]);
  };
  path3(tr, null, "rgba(15,27,45,0.22)", 2, null, true); // shadow on the ground
  if (p.height > 0) seg([0, 0, 0], [0, 0, p.height], "#64748B", 5);
  if (sc.vac) path3(sc.vac, null, "#94A3B8", 1.6, [2, 4]);
  if (show.pinned) for (const q of sc.pinned) path3(q.tr, null, q.color || COL.ghost, 2.4, [6, 5]);
  path3(tr, null, COL.path, 2, [7, 6]);

  const cur = sc.cur;
  if (sc.t > 0) path3(tr, cur.i + 1, COL.orange, 3.5);

  // drop line and shadow under the ball
  seg([cur.x, cur.y, cur.z], [cur.x, cur.y, gz(cur.x)], "rgba(15,27,45,0.35)", 1, [3, 4]);
  const sh = P(cur.x, cur.y, gz(cur.x));
  if (sh) {
    ctx.fillStyle = "rgba(15,27,45,0.22)";
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 9, 3.5, 0, 0, 7); ctx.fill();
  }

  // ----- highlighted points -----
  const marks = [];
  if (show.hmax) marks.push([s.iApex, `Max height ${s.maxHeight.toFixed(2)} m`, COL.height, "above"]);
  if (show.range) marks.push([s.iImpact, `Range ${s.range.toFixed(2)} m`, COL.range, "above"]);
  if (show.vmax) marks.push([s.iVmax, `Max speed ${s.vMax.toFixed(2)} m/s`, COL.vmax, "below"]);
  if (show.vmin) marks.push([s.iVmin, `Min speed ${s.vMin.toFixed(2)} m/s`, COL.vmin, "below"]);
  for (const [i, label, color, place] of marks) {
    const v = P(tr.x[i], tr.y[i], tr.z[i]); if (!v) continue;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(v.x, v.y, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    pill(ctx, label, v.x, v.y, color, W, H, place);
  }

  // ----- velocity arrows and ball -----
  const b = P(cur.x, cur.y, cur.z);
  if (b && show.vectors) {
    const k = 0.2 * B.radius / Math.max(s.vMax, 1e-6);
    const A = (dx, dy, dz, color, lw) => {
      const e = P(cur.x + k * dx, cur.y + k * dy, cur.z + k * dz);
      if (e) arrow(ctx, b.x, b.y, e.x, e.y, color, lw);
    };
    A(cur.vx, cur.vy, 0, COL.vx, 2.5);
    A(0, 0, cur.vz, COL.vz, 2.5);
    A(cur.vx, cur.vy, cur.vz, COL.v, 2.8);
  }
  if (b) ball(ctx, b.x, b.y, Math.max(6, Math.min(13, b.f * B.radius * 0.016 / b.depth)));

  // ----- wind arrow on the ground -----
  if (p.drag && p.wind && p.windSpeed > 0) {
    const L = 0.16 * B.span, wd = p.windDir * RAD;
    const sx = x0 + 0.1 * B.span, sy = -nearY * 0.75;
    const a0 = P(sx, sy, gz(sx)), a1 = P(sx + L * Math.cos(wd), sy + L * Math.sin(wd), gz(sx + L * Math.cos(wd)));
    if (a0 && a1) arrow(ctx, a0.x, a0.y, a1.x, a1.y, COL.wind, 3);
    // bottom-left corner, above the "drag to turn" hint, where the ground never reaches
    const r = W < 560 ? 24 : 30;
    windCompass(ctx, 10 + r, H - 34 - r, r, p.windDir, p.windSpeed);
  }
  const v = Math.hypot(cur.vx, cur.vy, cur.vz);
  badge(ctx, `v ${v.toFixed(1)} m/s · h ${cur.z.toFixed(1)} m`, 10, 10, COL.navy, "left");
  ctx.font = `500 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.fillText(phone ? "Drag to turn · pinch to zoom" : "Drag to turn · scroll to zoom · double-click to reset", 12, H - 10);
}

// Mouse and touch: drag rotates, pinch / scroll zooms, double-click resets
function attachOrbit(cv, getCam, redraw, active) {
  const pts = new Map();
  let pinch0 = null;
  cv.addEventListener("pointerdown", (e) => {
    if (!active()) return;
    cv.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: getCam().zoom };
    }
  });
  cv.addEventListener("pointermove", (e) => {
    if (!active() || !pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), cam = getCam();
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch0) {
      const [a, b] = [...pts.values()];
      cam.zoom = Math.min(4, Math.max(0.4, pinch0.zoom * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d));
    } else if (pts.size === 1) {
      cam.yaw -= (e.clientX - prev[0]) * 0.45;
      cam.pitch = Math.min(85, Math.max(3, cam.pitch + (e.clientY - prev[1]) * 0.3));
    }
    redraw();
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", (e) => {
    if (!active()) return;
    e.preventDefault();
    const cam = getCam();
    cam.zoom = Math.min(4, Math.max(0.4, cam.zoom * Math.exp(-e.deltaY * 0.0015)));
    redraw();
  }, { passive: false });
  cv.addEventListener("dblclick", () => { if (!active()) return; Object.assign(getCam(), CAM_DEFAULT); redraw(); });
}
