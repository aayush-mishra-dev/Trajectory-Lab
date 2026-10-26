// ===================================================================
//  2D side view: same scale on both axes, so angles and slopes are true
// ===================================================================

function draw2D(cv, sc) {
  const { tr, p, show } = sc;
  const s = tr.s;
  const tanA = Math.tan(p.incline * RAD);
  const W0 = cv.clientWidth, phone = W0 < 560;
  const M = { l: phone ? 38 : 48, r: 12, t: 12, b: phone ? 26 : 30 };

  // ----- world bounds -----
  const paths = [tr, ...(show.pinned ? sc.pinned.map((q) => q.tr) : []), ...(sc.vac ? [sc.vac] : [])];
  const ex = sc.extra || {};
  let x0 = 0, x1 = 0, z0 = Math.min(0, p.height), z1 = Math.max(0, p.height);
  if (ex.target) x1 = Math.max(x1, ex.target.x + ex.target.w);
  if (ex.wall) { x1 = Math.max(x1, ex.wall.x + 2); z1 = Math.max(z1, ex.wall.x * tanA + ex.wall.h); }
  for (const q of paths) {
    for (let i = 0; i < q.x.length; i++) {
      if (q.x[i] < x0) x0 = q.x[i]; if (q.x[i] > x1) x1 = q.x[i];
      if (q.z[i] < z0) z0 = q.z[i]; if (q.z[i] > z1) z1 = q.z[i];
    }
  }
  if (ex.view) { x0 = ex.view[0]; x1 = ex.view[1]; z1 = Math.max(ex.view[2], p.height); }  // fixed view (challenges)
  const xspan0 = Math.max(x1 - x0, 1);
  x0 -= 0.05 * xspan0; x1 += 0.05 * xspan0;
  z0 = Math.min(z0, x0 * tanA, x1 * tanA);
  z1 = Math.max(z1, z0 + 1);
  const zspan0 = z1 - z0;
  z1 += 0.2 * zspan0; z0 -= 0.06 * zspan0;

  // The canvas height follows the shape of the throw, so there's no big empty sky
  const fit = M.t + M.b + (W0 - M.l - M.r) * (z1 - z0) / (x1 - x0);
  const hMin = phone ? 230 : 300, hMax = W0 * (phone ? 0.8 : 0.6);
  cv.style.height = `${Math.round(Math.min(hMax, Math.max(hMin, fit)))}px`;
  const { ctx, w: W, h: H } = prepCanvas(cv);

  const aw = W - M.l - M.r, ah = H - M.t - M.b;
  const scale = Math.min(aw / (x1 - x0), ah / (z1 - z0));
  const extraX = (aw / scale - (x1 - x0)) / 2;
  const wx0 = x0 - extraX, wx1 = x1 + extraX;           // visible world x range
  const wz0 = z0, wz1 = z0 + ah / scale;                  // visible world z range (ground anchored low)
  const X = (x) => M.l + (x - wx0) * scale;
  const Z = (z) => M.t + ah - (z - wz0) * scale;

  // ----- background, grid, labels -----
  const sky = ctx.createLinearGradient(0, M.t, 0, M.t + ah);
  sky.addColorStop(0, "#F7FAFF"); sky.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = sky; ctx.fillRect(M.l, M.t, aw, ah);

  const step = niceStep(Math.max(wx1 - wx0, wz1 - wz0), phone ? 5 : 8);
  ctx.lineWidth = 1; ctx.strokeStyle = COL.grid;
  ctx.font = `500 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.textAlign = "center";
  for (let gx = Math.ceil(wx0 / step) * step; gx <= wx1; gx += step) {
    ctx.beginPath(); ctx.moveTo(X(gx), M.t); ctx.lineTo(X(gx), M.t + ah); ctx.stroke();
    ctx.fillText(fmt(gx, step), X(gx), H - M.b + 16);
  }
  ctx.textAlign = "right";
  for (let gz = Math.ceil(wz0 / step) * step; gz <= wz1; gz += step) {
    ctx.beginPath(); ctx.moveTo(M.l, Z(gz)); ctx.lineTo(M.l + aw, Z(gz)); ctx.stroke();
    ctx.fillText(fmt(gz, step), M.l - 6, Z(gz) + 4);
  }
  ctx.fillText("m", M.l - 6, H - M.b + 16);  // units, in the empty corner
  ctx.textAlign = "left";

  ctx.save();
  ctx.beginPath(); ctx.rect(M.l, M.t, aw, ah); ctx.clip();

  // ----- wind: drifting streaks show the part of the wind along the throw -----
  sc.windLabel = null;
  if (p.drag && p.wind && p.windSpeed > 0) {
    const along = p.windSpeed * Math.cos(p.windDir * RAD);
    ctx.save(); ctx.beginPath(); ctx.rect(M.l, M.t, aw, ah); ctx.clip();
    ctx.strokeStyle = "rgba(14,116,144,0.30)"; ctx.fillStyle = "rgba(14,116,144,0.30)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    if (Math.abs(along) > 0.3) {
      // streaks point the way the air moves and drift that way too, wrapping round at the edges
      const dir = Math.sign(along), len = 18 + Math.min(26, Math.abs(along) * 2), gapX = 120, gapY = 46, span = aw + gapX;
      const phase = (((sc.t || 0) * Math.abs(along) * 14) % gapX) * dir;
      for (let row = 0, y = M.t + 30; y < M.t + ah - 20; row++, y += gapY)
        for (let k = 0; k * gapX < span; k++) {
          const raw = k * gapX + (row % 2) * gapX / 2 + phase;
          const x = M.l - gapX / 2 + (((raw % span) + span) % span);
          ctx.beginPath(); ctx.moveTo(x - dir * len / 2, y); ctx.lineTo(x + dir * len / 2, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + dir * len / 2, y); ctx.lineTo(x + dir * (len / 2 - 6), y - 4); ctx.lineTo(x + dir * (len / 2 - 6), y + 4); ctx.fill();
        }
    }
    ctx.restore();
    sc.windLabel = windName(p.windDir);
  }

  // ----- ground -----
  ctx.fillStyle = COL.groundFill;
  ctx.beginPath(); ctx.moveTo(X(wx0), Z(wx0 * tanA)); ctx.lineTo(X(wx1), Z(wx1 * tanA));
  ctx.lineTo(X(wx1), H); ctx.lineTo(X(wx0), H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = COL.ground; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(X(wx0), Z(wx0 * tanA)); ctx.lineTo(X(wx1), Z(wx1 * tanA)); ctx.stroke();

  if (p.height > 0) {  // launch tower
    ctx.fillStyle = "#64748B";
    ctx.fillRect(X(0) - 4, Z(p.height), 8, Z(0) - Z(p.height));
  }

  const line = (q, upto, color, width, dash) => {
    const n = upto ?? q.x.length, stp = Math.max(1, Math.floor(n / 900));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(X(q.x[0]), Z(q.z[0]));
    for (let i = stp; i < n; i += stp) ctx.lineTo(X(q.x[i]), Z(q.z[i]));
    if (n > 0) ctx.lineTo(X(q.x[n - 1]), Z(q.z[n - 1]));
    ctx.stroke(); ctx.setLineDash([]);
  };

  // challenge wall and target
  if (ex.wall) {
    const gw = ex.wall.x * tanA, ww = Math.max(6, 0.6 * scale);
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(X(ex.wall.x) - ww / 2, Z(gw + ex.wall.h), ww, Z(gw) - Z(gw + ex.wall.h) + 2);
    ctx.fillStyle = "#6B4429";
    for (let yy = Z(gw + ex.wall.h) + 8; yy < Z(gw); yy += 10) ctx.fillRect(X(ex.wall.x) - ww / 2, yy, ww, 1.5);
  }
  if (ex.target) {
    const tx0 = ex.target.x - ex.target.w / 2, tx1 = ex.target.x + ex.target.w / 2, n = 5;
    for (let k = 0; k < n; k++) {
      const a = tx0 + (tx1 - tx0) * k / n, b = tx0 + (tx1 - tx0) * (k + 1) / n;
      ctx.strokeStyle = k % 2 ? "#FFFFFF" : (k === 2 ? "#DC2626" : "#F97316");
      ctx.lineWidth = 7; ctx.lineCap = "butt";
      ctx.beginPath(); ctx.moveTo(X(a), Z(a * tanA) + 3); ctx.lineTo(X(b), Z(b * tanA) + 3); ctx.stroke();
    }
    const fx = ex.target.x, fz = fx * tanA;
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(fx), Z(fz)); ctx.lineTo(X(fx), Z(fz) - 34); ctx.stroke();
    ctx.fillStyle = ex.target.hit ? "#16A34A" : "#DC2626";
    ctx.beginPath(); ctx.moveTo(X(fx), Z(fz) - 34); ctx.lineTo(X(fx) + 18, Z(fz) - 28); ctx.lineTo(X(fx), Z(fz) - 22); ctx.fill();
  }

  if (sc.vac) line(sc.vac, null, "#94A3B8", 1.6, [2, 4]);
  if (show.pinned) for (const q of sc.pinned) line(q.tr, null, q.color || COL.ghost, 2.4, [6, 5]);
  if (!ex.hidePath) line(tr, null, COL.path, 2, [7, 6]);

  // ----- equal-time dots -----
  if (show.dots && !ex.hidePath) {
    const dt = niceStep(s.flightTime, 14);
    ctx.fillStyle = "rgba(228,87,46,0.55)";
    for (let tt = dt; tt < s.flightTime - 1e-9; tt += dt) { const q = stateAt(tr, tt); ctx.beginPath(); ctx.arc(X(q.x), Z(q.z), 3, 0, 7); ctx.fill(); }
  }

  // ----- trail and ball -----
  const cur = sc.cur;
  if (sc.t > 0) {
    line(tr, cur.i + 1, COL.orange, 3.5);
    ctx.strokeStyle = COL.orange; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(X(tr.x[cur.i]), Z(tr.z[cur.i])); ctx.lineTo(X(cur.x), Z(cur.z)); ctx.stroke();
  }
  // shadow on the ground
  const gz = cur.x * tanA, hAbove = Math.max(cur.z - gz, 0);
  ctx.fillStyle = `rgba(15,27,45,${0.18 * Math.max(0.25, 1 - hAbove / (wz1 - wz0))})`;
  ctx.beginPath(); ctx.ellipse(X(cur.x), Z(gz), 9, 3, -Math.atan(tanA), 0, 7); ctx.fill();
  ctx.restore();

  // ----- highlighted points -----
  const marks = [];
  if (show.hmax) marks.push([s.iApex, `Max height ${s.maxHeight.toFixed(2)} m`, COL.height, "above"]);
  if (show.range) marks.push([s.iImpact, `Range ${s.range.toFixed(2)} m`, COL.range, "above"]);
  if (show.vmax) marks.push([s.iVmax, `Max speed ${s.vMax.toFixed(2)} m/s`, COL.vmax, "below"]);
  if (show.vmin) marks.push([s.iVmin, `Min speed ${s.vMin.toFixed(2)} m/s`, COL.vmin, "below"]);
  for (const [i, text, color, place] of marks) {
    const mx = X(tr.x[i]), mz = Z(tr.z[i]);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mx, mz, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    pill(ctx, text, mx, mz, color, W, H, place);
  }

  // ----- velocity arrows -----
  const bx = X(cur.x), bz = Z(cur.z);
  if (show.vectors) {
    const k = (phone ? 52 : 70) / Math.max(s.vMax, 1e-6);
    const hv = Math.hypot(cur.vx, cur.vy) * Math.sign(cur.vx || 1);
    arrow(ctx, bx, bz, bx + k * hv, bz, COL.vx, 2.5);
    arrow(ctx, bx, bz, bx, bz - k * cur.vz, COL.vz, 2.5);
    arrow(ctx, bx, bz, bx + k * hv, bz - k * cur.vz, COL.v, 2.8);
  }
  ball(ctx, bx, bz, phone ? 8 : 9);

  // ----- badges -----
  if (sc.windLabel) {
    // top-left, under the readout: the launch end of the path is low there, so it stays clear
    const r = phone ? 24 : 30, cy = M.t + 40 + r;
    // launching from high up puts the start of the path there, so move to the right-hand corner
    const startHigh = Z(p.height || 0) < cy + r + 10;
    windCompass(ctx, startHigh ? W - M.r - r - (phone ? 150 : 175) : M.l + r + 8, cy, r, p.windDir, p.windSpeed);
  }
  const v = Math.hypot(cur.vx, cur.vy, cur.vz);
  badge(ctx, `t ${sc.t.toFixed(2)} s · x ${cur.x.toFixed(1)} m · h ${cur.z.toFixed(1)} m · v ${v.toFixed(1)} m/s`, M.l + 6, M.t + 6, COL.navy, "left");
}
