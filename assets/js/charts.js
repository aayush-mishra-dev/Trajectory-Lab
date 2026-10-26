// ===================================================================
//  Small line charts (height / velocity / energy over time, and range
//  against launch angle), drawn straight onto a canvas
// ===================================================================

function drawChart(cv, cfg) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  const phone = W < 560;
  const legendH = cfg.series.length > 1 || cfg.legend ? 24 : 4;
  const M = { l: phone ? 44 : 54, r: 14, t: legendH + 8, b: 38 };
  const aw = W - M.l - M.r, ah = H - M.t - M.b;

  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const s of cfg.series) for (let i = 0; i < s.x.length; i++) {
    x0 = Math.min(x0, s.x[i]); x1 = Math.max(x1, s.x[i]);
    y0 = Math.min(y0, s.y[i]); y1 = Math.max(y1, s.y[i]);
  }
  if (cfg.yFromZero) y0 = Math.min(0, y0);
  if (!(x1 > x0)) x1 = x0 + 1;
  if (!(y1 > y0)) y1 = y0 + 1;
  const ypad = (y1 - y0) * 0.08; y1 += ypad; if (!cfg.yFromZero || y0 < 0) y0 -= ypad;
  const X = (x) => M.l + (x - x0) / (x1 - x0) * aw;
  const Y = (y) => M.t + ah - (y - y0) / (y1 - y0) * ah;

  // grid + ticks
  ctx.font = `500 11px ${FONT}`; ctx.lineWidth = 1;
  const xs = niceStep(x1 - x0, phone ? 4 : 7), ys = niceStep(y1 - y0, 4);
  ctx.textAlign = "center"; ctx.fillStyle = COL.muted;
  for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) {
    ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(X(v), M.t); ctx.lineTo(X(v), M.t + ah); ctx.stroke();
    ctx.fillText(fmt(v, xs), X(v), M.t + ah + 15);
  }
  ctx.textAlign = "right";
  for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) {
    ctx.strokeStyle = Math.abs(v) < 1e-9 ? COL.gridStrong : COL.grid;
    ctx.beginPath(); ctx.moveTo(M.l, Y(v)); ctx.lineTo(M.l + aw, Y(v)); ctx.stroke();
    ctx.fillText(fmt(v, ys), M.l - 6, Y(v) + 4);
  }
  ctx.textAlign = "center"; ctx.fillStyle = COL.navy; ctx.font = `600 12px ${FONT}`;
  ctx.fillText(cfg.xLabel, M.l + aw / 2, H - 6);
  ctx.save(); ctx.translate(13, M.t + ah / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText(cfg.yLabel, 0, 0); ctx.restore(); ctx.textAlign = "left";

  for (const vx of cfg.vlines || []) {
    ctx.strokeStyle = "#94A3B8"; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(X(vx), M.t); ctx.lineTo(X(vx), M.t + ah); ctx.stroke(); ctx.setLineDash([]);
  }

  // lines
  ctx.save(); ctx.beginPath(); ctx.rect(M.l, M.t - 2, aw, ah + 4); ctx.clip();
  for (const s of cfg.series) {
    const stp = Math.max(1, Math.floor(s.x.length / 700));
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.5; ctx.setLineDash(s.dash || []);
    ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(X(s.x[0]), Y(s.y[0]));
    for (let i = stp; i < s.x.length; i += stp) ctx.lineTo(X(s.x[i]), Y(s.y[i]));
    ctx.lineTo(X(s.x[s.x.length - 1]), Y(s.y[s.y.length - 1]));
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();

  // marker line (e.g. "your angle")
  if (cfg.mark) {
    const m = cfg.mark;
    ctx.strokeStyle = m.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(m.x), M.t); ctx.lineTo(X(m.x), M.t + ah); ctx.stroke();
    ctx.font = `600 11px ${FONT}`; ctx.fillStyle = m.color;
    const tx = X(m.x) + 5 + ctx.measureText(m.label).width > M.l + aw ? X(m.x) - 5 - ctx.measureText(m.label).width : X(m.x) + 5;
    ctx.fillText(m.label, tx, M.t + 12);
  }
  if (cfg.point) {
    const pt = cfg.point;
    ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(X(pt.x), Y(pt.y), 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    pill(ctx, pt.label, X(pt.x), Y(pt.y), pt.color, W, H, Y(pt.y) - M.t > 40 ? "above" : "below");
  }

  // time cursor with the values where it crosses each line
  if (cfg.cursor != null && cfg.cursor > 0) {
    const cx = X(cfg.cursor);
    ctx.strokeStyle = COL.orange; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, M.t); ctx.lineTo(cx, M.t + ah); ctx.stroke();
    for (const s of cfg.series) {
      const yv = interp(s.x, s.y, cfg.cursor);
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx, Y(yv), 4, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // legend
  if (legendH > 4) {
    let lx = M.l;
    ctx.font = `500 12px ${FONT}`;
    for (const s of cfg.series) {
      if (!s.name) continue;
      ctx.strokeStyle = s.color; ctx.lineWidth = 3; ctx.setLineDash(s.dash || []);
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx + 16, 12); ctx.stroke(); ctx.setLineDash([]);
      let label = s.name;
      if (cfg.cursor != null && cfg.cursor > 0) label += ` ${interp(s.x, s.y, cfg.cursor).toFixed(1)}`;
      ctx.fillStyle = COL.navy; ctx.fillText(label, lx + 21, 16);
      lx += 21 + ctx.measureText(label).width + 16;
    }
  }
}

function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  const n = xs.length;
  if (x >= xs[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  const f = (x - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + f * (ys[hi] - ys[lo]);
}
