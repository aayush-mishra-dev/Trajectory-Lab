// ===================================================================
//  Instruments: vernier calliper, screw gauge and spherometer.
//  Each one has Explore (move it and see the reading worked out),
//  Practise (read it yourself and get checked) and Learn.
// ===================================================================

const TEAL = "#0D9488", TEAL_SOFT = "#CCFBF1";

const TOOLS = {
  vernier: { name: "Vernier calliper", short: "Vernier", desc: "Lengths to 0.1 mm" },
  screw: { name: "Screw gauge", short: "Screw gauge", desc: "Thin wires to 0.01 mm" },
  sphero: { name: "Spherometer", short: "Spherometer", desc: "How curved a lens is" },
  rule: { name: "Metre rule", short: "Metre rule", desc: "Reading it without parallax" },
  cylinder: { name: "Measuring cylinder", short: "Cylinder", desc: "Volumes and the meniscus" },
};

// ---------- metre rule and measuring cylinder ----------
function drawRule(cv, o) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  ctx.fillStyle = "#FBFDFE"; ctx.fillRect(0, 0, W, H);
  const a = o.start, b = o.start + o.length, pad = 20;
  const lo = Math.max(0, Math.floor(a) - 1), hi = Math.ceil(b) + 1, px = (W - 2 * pad) / (hi - lo);
  const X = (cm) => pad + (cm - lo) * px, y = 150;
  ctx.fillStyle = "#FDE68A"; roundRect(ctx, pad - 8, y, W - 2 * pad + 16, 70, 6); ctx.fill();
  ctx.strokeStyle = "#B45309"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.font = `600 12px ${FONT}`; ctx.textAlign = "center";
  // numbers only every 1, 2, 5, 10… cm, so they never run into each other
  const labelStep = [1, 2, 5, 10, 20, 50].find((k) => k * px >= 30) || 100;
  const tickMm = px / 10 >= 3 ? 1 : px / 2 >= 3 ? 5 : 10;
  for (let mm = lo * 10; mm <= hi * 10; mm++) {
    if (mm % tickMm !== 0) continue;
    const x = X(mm / 10), len = mm % 10 === 0 ? 26 : mm % 5 === 0 ? 18 : 11;
    ctx.strokeStyle = "#78350F"; ctx.lineWidth = mm % 10 === 0 ? 1.6 : 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    if (mm % (labelStep * 10) === 0) { ctx.fillStyle = "#78350F"; ctx.fillText(String(mm / 10), x, y + 42); }
  }
  ctx.fillStyle = "#3B82F6"; roundRect(ctx, X(a), y - 46, X(b) - X(a), 40, 6); ctx.fill();
  if (X(b) - X(a) > 56) { ctx.fillStyle = "#fff"; ctx.fillText("object", (X(a) + X(b)) / 2, y - 21); }
  // start / end labels: kept inside the canvas and pushed apart if they'd overlap
  const tA = `start ${a.toFixed(1)}`, tB = `end ${b.toFixed(1)}`;
  const wA = ctx.measureText(tA).width, wB = ctx.measureText(tB).width;
  let xA = Math.max(wA / 2 + 4, X(a)), xB = Math.min(W - wB / 2 - 4, X(b));
  const gap = xB - xA - (wA + wB) / 2 - 10;
  if (gap < 0) { xA += gap / 2; xB -= gap / 2; }
  for (const [v, lbl, tx] of [[a, tA, xA], [b, tB, xB]]) {
    ctx.strokeStyle = "#DC2626"; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(v), y - 60); ctx.lineTo(X(v), y + 30); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#DC2626"; ctx.fillText(lbl, tx, y - 66);
  }
  ctx.textAlign = "left"; ctx.fillStyle = COL.muted; ctx.font = `600 11px ${FONT}`;
  ctx.fillText("cm (each small mark is 1 mm)", pad, H - 14);
  ctx.fillText("👁 Look straight down at each end to avoid parallax", pad, 28);
  return { start: a, end: b, length: o.length };
}

function drawCylinder(cv, o) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  ctx.fillStyle = "#FBFDFE"; ctx.fillRect(0, 0, W, H);
  const cap = 100, top = 30, bot = H - 30, cx = W * 0.4, cw = Math.min(110, W * 0.3);
  const lo = Math.max(0, o.volume - 12), hi = Math.min(cap, lo + 24);
  const Y = (ml) => bot - (ml - lo) / (hi - lo) * (bot - top);
  ctx.fillStyle = "rgba(186,230,253,0.35)"; ctx.fillRect(cx - cw / 2, top, cw, bot - top);
  const liquid = o.mercury ? "#94A3B8" : "#38BDF8";
  ctx.fillStyle = liquid;
  const ly = Y(o.volume), dip = o.mercury ? -8 : 8;
  ctx.beginPath(); ctx.moveTo(cx - cw / 2, ly - dip); ctx.quadraticCurveTo(cx, ly + dip, cx + cw / 2, ly - dip);
  ctx.lineTo(cx + cw / 2, bot); ctx.lineTo(cx - cw / 2, bot); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#0F172A"; ctx.lineWidth = 2; ctx.strokeRect(cx - cw / 2, top - 10, cw, bot - top + 10);
  ctx.font = `600 12px ${FONT}`; ctx.textAlign = "left";
  for (let ml = Math.ceil(lo); ml <= hi; ml++) {
    const y = Y(ml), len = ml % 10 === 0 ? 30 : ml % 5 === 0 ? 20 : 12;
    ctx.strokeStyle = "#0F172A"; ctx.lineWidth = ml % 5 === 0 ? 1.6 : 1;
    ctx.beginPath(); ctx.moveTo(cx + cw / 2, y); ctx.lineTo(cx + cw / 2 - len, y); ctx.stroke();
    if (ml % 5 === 0) { ctx.fillStyle = "#0F172A"; ctx.fillText(`${ml}`, cx + cw / 2 + 6, y + 4); }
  }
  ctx.strokeStyle = "#DC2626"; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - cw / 2 - 40, ly); ctx.lineTo(cx + cw / 2 + 40, ly); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#DC2626"; ctx.textAlign = "right"; ctx.fillText("👁 eye level", cx - cw / 2 - 8, ly - 8); ctx.textAlign = "left";
  ctx.fillStyle = COL.muted; ctx.font = `600 11px ${FONT}`;
  ctx.fillText(o.mercury ? "Mercury curves up: read the TOP" : "Water curves down: read the BOTTOM", 14, H - 8);
  ctx.fillText("mL (zoomed in)", cx + cw / 2 + 6, top - 2);
  return { volume: o.volume };
}


// ---------- the numbers behind each reading ----------

function vernierSetup(o) {
  const N = o.fine ? 20 : 10;           // vernier divisions
  const lc = 1 / N;                      // least count in mm (1 MSD = 1 mm)
  const vsd = (N - 1) / N;               // N VSD = (N − 1) MSD
  const zero = o.zeroDiv * lc;           // zero error in mm
  const obs = Math.round((o.length + zero) / lc) * lc;  // what the scales show
  const msr = Math.floor(obs + 1e-9);
  const n = Math.round((obs - msr) / lc);
  return { N, lc, vsd, zero, obs, msr, n, corrected: obs - zero };
}

function screwSetup(o) {
  const pitch = o.pitch, N = pitch === 0.5 ? 50 : 100, lc = pitch / N;
  const zero = o.zeroDiv * lc;
  const obs = Math.round((o.length + zero) / lc) * lc;
  const turns = Math.floor(obs / pitch + 1e-9);
  const psr = turns * pitch;
  const csr = Math.round((obs - psr) / lc) % N;
  return { pitch, N, lc, zero, obs, psr, csr, corrected: obs - zero };
}

function spheroSetup(o) {
  const lc = 0.01, l = o.legs * 10;                 // leg spacing in mm
  const r = l / Math.sqrt(3);                        // centre leg to each outer leg
  const Rmm = o.radius * 10;
  const hTrue = Rmm - Math.sqrt(Math.max(Rmm * Rmm - r * r, 0));
  const h = Math.max(lc, Math.round(hTrue / lc) * lc);
  const plane = o.plane;                             // reading on the flat glass (mm)
  const lens = o.convex ? plane + h : plane - h;
  const R = l * l / (6 * h) + h / 2;                 // mm
  return { lc, l, r, h, plane, lens, R, Rcm: R / 10 };
}

const splitReading = (v, lc, N) => {                 // main-scale mm + circular divisions
  const ms = Math.floor(v + 1e-9);
  return { ms, div: Math.round((v - ms) / lc) % N };
};

// ---------- drawing ----------

function drawVernier(cv, o, interactive = true) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  const v = vernierSetup(o), phone = W < 560;
  ctx.fillStyle = "#FBFDFE"; ctx.fillRect(0, 0, W, H);

  // --- overview of the whole calliper ---
  const pad = 18, oy = 22, maxMM = 110;
  const OX = (mm) => pad + 40 + (mm / maxMM) * (W - 2 * pad - 60);
  ctx.fillStyle = "#CBD5E1"; ctx.fillRect(pad, oy, W - 2 * pad, 16);                // beam
  ctx.fillStyle = "#94A3B8";
  for (let m = 0; m <= maxMM; m += 10) ctx.fillRect(OX(m), oy, 1, 7);
  // fixed jaw
  ctx.fillStyle = "#64748B";
  ctx.beginPath(); ctx.moveTo(OX(0) - 14, oy); ctx.lineTo(OX(0), oy); ctx.lineTo(OX(0), oy + 70); ctx.lineTo(OX(0) - 6, oy + 70); ctx.lineTo(OX(0) - 14, oy + 16); ctx.fill();
  // object
  const objW = OX(o.length) - OX(0);
  ctx.fillStyle = "#F59E0B"; roundRect(ctx, OX(0), oy + 26, Math.max(objW, 0), 34, 4); ctx.fill();
  if (objW > 46) { ctx.fillStyle = "#7C2D12"; ctx.font = `600 11px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("object", OX(0) + objW / 2, oy + 47); ctx.textAlign = "left"; }
  // sliding jaw + vernier plate
  const jx = OX(o.length);
  ctx.fillStyle = TEAL;
  ctx.beginPath(); ctx.moveTo(jx, oy - 2); ctx.lineTo(jx + 34, oy - 2); ctx.lineTo(jx + 34, oy + 20); ctx.lineTo(jx + 14, oy + 20); ctx.lineTo(jx + 6, oy + 70); ctx.lineTo(jx, oy + 70); ctx.fill();
  ctx.strokeStyle = "#0F766E"; ctx.lineWidth = 1.5; ctx.strokeRect(jx + 2, oy, 30, 18);
  // magnifier hint
  ctx.strokeStyle = TEAL; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(jx + 17, oy + 20); ctx.lineTo(W / 2, oy + 96); ctx.stroke(); ctx.setLineDash([]);

  // --- magnified scales ---
  const top = oy + 104, mh = 54, vh = 54;
  const win = phone ? 22 : 34;                          // mm shown across the width
  const centre = v.obs + v.N * v.vsd / 2;
  const x0 = centre - win / 2, px = (W - 2 * pad) / win;
  const X = (mm) => pad + (mm - x0) * px;
  ctx.save(); ctx.beginPath(); ctx.rect(pad, top - 4, W - 2 * pad, mh + vh + 40); ctx.clip();
  ctx.fillStyle = "#F1F5F9"; ctx.fillRect(pad, top, W - 2 * pad, mh);
  ctx.fillStyle = TEAL_SOFT; ctx.fillRect(X(v.obs) - 10, top + mh, v.N * v.vsd * px + 20, vh);
  const coinMain = Math.round(v.obs + v.n * v.vsd);
  ctx.font = `600 ${phone ? 12 : 13}px ${FONT}`; ctx.textAlign = "center";
  for (let m = Math.floor(x0) - 1; m <= x0 + win + 1; m++) {
    const len = m % 10 === 0 ? 30 : m % 5 === 0 ? 20 : 12, x = X(m);
    const hl = m === coinMain;
    ctx.strokeStyle = hl ? "#DC2626" : COL.navy; ctx.lineWidth = hl ? 2.5 : 1.2;
    ctx.beginPath(); ctx.moveTo(x, top + mh); ctx.lineTo(x, top + mh - len); ctx.stroke();
    if (m % 10 === 0) { ctx.fillStyle = COL.navy; ctx.fillText(String(m / 10), x, top + mh - 34); }
  }
  for (let k = 0; k <= v.N; k++) {
    const x = X(v.obs + k * v.vsd), major = k % (v.N / 10 * 5) === 0, labelled = k % (v.N / 10) === 0;
    const hl = k === v.n;
    ctx.strokeStyle = hl ? "#DC2626" : k === 0 ? "#EA580C" : "#134E4A"; ctx.lineWidth = hl || k === 0 ? 2.5 : 1.2;
    ctx.beginPath(); ctx.moveTo(x, top + mh); ctx.lineTo(x, top + mh + (major ? 22 : labelled ? 16 : 11)); ctx.stroke();
    const num = k / (v.N / 10), roomy = (v.N / 10) * v.vsd * px >= 18;   // enough space for every number?
    if (labelled && (roomy || num % 2 === 0 || hl)) { ctx.fillStyle = hl ? "#DC2626" : "#134E4A"; ctx.fillText(String(num), x, top + mh + 38); }
  }
  ctx.restore();
  ctx.textAlign = "left"; ctx.font = `600 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.fillText("main scale (cm)", pad + 4, top - 6);
  ctx.fillText("vernier scale", pad + 4, top + mh + vh + 14);
  if (interactive) ctx.fillText(phone ? "Drag to move the jaw" : "Drag here to move the jaw", W - pad - (phone ? 120 : 150), H - 8);
  return v;
}

function drawScrew(cv, o, interactive = true) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  const s = screwSetup(o), phone = W < 560;
  ctx.fillStyle = "#FBFDFE"; ctx.fillRect(0, 0, W, H);

  // --- overview: U-frame, anvil, wire, spindle, sleeve, thimble ---
  const cx = W * 0.32, cy = 62, sc = Math.min(4, (W * 0.3) / 26);
  ctx.strokeStyle = "#64748B"; ctx.lineWidth = 12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx - 40, cy + 40); ctx.quadraticCurveTo(cx - 40, cy + 64, cx, cy + 64); ctx.lineTo(cx + 60, cy + 64); ctx.quadraticCurveTo(cx + 90, cy + 64, cx + 90, cy + 34); ctx.lineTo(cx + 90, cy + 8); ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#475569"; ctx.fillRect(cx - 40, cy - 9, 16, 18);                   // anvil
  const d = o.length * sc;
  ctx.fillStyle = "#F59E0B"; ctx.beginPath(); ctx.arc(cx - 24 + d / 2, cy, Math.max(d / 2, 0.5), 0, 7); ctx.fill();  // wire
  ctx.fillStyle = "#94A3B8"; ctx.fillRect(cx - 24 + d, cy - 6, cx + 90 - (cx - 24 + d), 12);  // spindle
  ctx.fillStyle = "#CBD5E1"; ctx.fillRect(cx + 90, cy - 12, 70, 24);                    // sleeve
  ctx.fillStyle = TEAL; roundRect(ctx, cx + 110 + o.length * 2, cy - 17, 80, 34, 6); ctx.fill();  // thimble
  ctx.fillStyle = COL.muted; ctx.font = `600 11px ${FONT}`;
  ctx.textAlign = "right"; ctx.fillText("anvil", cx - 52, cy + 4);
  ctx.textAlign = "center"; ctx.fillText("wire", cx - 24 + d / 2, cy - Math.max(d / 2, 6) - 6); ctx.textAlign = "left";
  ctx.fillText("thimble", cx + 120 + o.length * 2, cy + 32);

  // --- magnified sleeve and thimble ---
  const pad = 18, top = 150, yc = top + 70, win = phone ? 7 : 11;
  const edge = s.obs;                                   // thimble edge at the reading
  const x0 = edge - win * 0.62, px = (W - 2 * pad) / win;
  const X = (mm) => pad + (mm - x0) * px;
  const ex = X(edge);
  ctx.save(); ctx.beginPath(); ctx.rect(pad, top, W - 2 * pad, 140); ctx.clip();
  ctx.fillStyle = "#E2E8F0"; ctx.fillRect(pad, yc - 34, ex - pad, 68);               // sleeve
  ctx.strokeStyle = COL.navy; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad, yc); ctx.lineTo(ex, yc); ctx.stroke();           // datum line
  ctx.font = `600 13px ${FONT}`; ctx.textAlign = "center";
  for (let m = Math.floor(x0 * 2) / 2; m <= edge + 1e-9; m += 0.5) {
    const x = X(m), whole = Math.abs(m - Math.round(m)) < 1e-9;
    if (x < pad - 2) continue;
    ctx.strokeStyle = COL.navy; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, yc); ctx.lineTo(x, whole ? yc - 16 : yc + 12); ctx.stroke();
    if (whole) { ctx.fillStyle = COL.navy; ctx.fillText(String(Math.round(m)), x, yc - 22); }
  }
  // thimble with its circular scale
  const th = 120, Rv = th / 2;
  const grad = ctx.createLinearGradient(0, yc - Rv, 0, yc + Rv);
  grad.addColorStop(0, "#5EEAD4"); grad.addColorStop(0.5, "#CCFBF1"); grad.addColorStop(1, "#2DD4BF");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(ex, yc - Rv * 0.92); ctx.lineTo(ex + 14, yc - Rv); ctx.lineTo(W, yc - Rv); ctx.lineTo(W, yc + Rv); ctx.lineTo(ex + 14, yc + Rv); ctx.lineTo(ex, yc + Rv * 0.92); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#0F766E"; ctx.lineWidth = 1.5; ctx.stroke();
  const step = 2 * Math.PI / s.N;
  ctx.textAlign = "left"; ctx.font = `600 12px ${FONT}`;
  for (let k = -Math.floor(s.N / 4); k <= Math.floor(s.N / 4); k++) {
    const ang = k * step;
    if (Math.abs(ang) >= Math.PI / 2 - 0.05) continue;
    const y = yc - Rv * 0.9 * Math.sin(ang);
    const div = ((s.csr + k) % s.N + s.N) % s.N;
    const major = div % 5 === 0, hl = k === 0;
    ctx.strokeStyle = hl ? "#DC2626" : "#134E4A"; ctx.lineWidth = hl ? 2.5 : 1.1;
    ctx.beginPath(); ctx.moveTo(ex + 2, y); ctx.lineTo(ex + (major ? 26 : 16), y); ctx.stroke();
    if (major && Math.cos(ang) > 0.35) { ctx.fillStyle = hl ? "#DC2626" : "#134E4A"; ctx.fillText(String(div), ex + 30, y + 4); }
  }
  ctx.restore();
  ctx.textAlign = "left"; ctx.font = `600 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.fillText(phone ? "sleeve (mm)" : "sleeve (mm above line, ½ mm below)", pad + 4, top - 6);
  ctx.fillText("circular scale", Math.max(Math.min(ex + 14, W - 90), pad + (phone ? 90 : 230)), top - 6);
  if (interactive) ctx.fillText("Drag to turn the thimble", pad + 4, H - 8);
  return s;
}

function drawSphero(cv, o) {
  const { ctx, w: W, h: H } = prepCanvas(cv);
  const sp = spheroSetup(o), phone = W < 560;
  ctx.fillStyle = "#FBFDFE"; ctx.fillRect(0, 0, W, H);
  const onLens = o.on === "lens";
  const reading = onLens ? sp.lens : sp.plane;

  // --- side view (curvature exaggerated so you can see it) ---
  const sw = phone ? W - 24 : W * 0.55, cx = 12 + sw / 2, base = H * (phone ? 0.42 : 0.72);
  const legX = sw * 0.32, sag = onLens ? (o.convex ? 26 : -26) : 0;
  ctx.fillStyle = "#BAE6FD"; ctx.strokeStyle = "#0284C7"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - sw / 2 + 6, base + 30);
  if (onLens) ctx.quadraticCurveTo(cx, base - sag * 2 + 0, cx + sw / 2 - 6, base + 30);
  else ctx.lineTo(cx + sw / 2 - 6, base + 30);
  ctx.lineTo(cx + sw / 2 - 6, base + 46); ctx.lineTo(cx - sw / 2 + 6, base + 46); ctx.closePath(); ctx.fill(); ctx.stroke();
  // surface height at x for the drawing
  const surf = (x) => { if (!onLens) return base + 30; const u = (x - cx) / (sw / 2 - 6); return base + 30 - sag * (1 - u * u); };
  ctx.strokeStyle = "#334155"; ctx.lineWidth = 4;
  for (const lx of [cx - legX, cx + legX]) { ctx.beginPath(); ctx.moveTo(lx, base - 40); ctx.lineTo(lx, surf(lx)); ctx.stroke(); }
  ctx.fillStyle = "#64748B"; ctx.fillRect(cx - legX - 6, base - 46, 2 * legX + 12, 10);  // frame
  ctx.strokeStyle = TEAL; ctx.lineWidth = 5;                                              // central screw
  ctx.beginPath(); ctx.moveTo(cx, base - 90); ctx.lineTo(cx, surf(cx)); ctx.stroke();
  ctx.fillStyle = TEAL; roundRect(ctx, cx - 40, base - 96, 80, 10, 4); ctx.fill();        // disc
  ctx.fillStyle = "#475569"; ctx.fillRect(cx + 46, base - 120, 6, 80);                     // vertical scale
  ctx.font = `600 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.fillText(onLens ? (o.convex ? "on the convex lens" : "on the concave surface") : "on flat glass", cx - sw / 2 + 10, base + 64);
  ctx.fillText("(curve exaggerated)", cx - sw / 2 + 10, base + 78);

  // --- magnified reading: vertical scale + disc divisions ---
  const rx = phone ? 24 : W * 0.6, ry = phone ? base + 104 : 30, rw = phone ? W - 48 : W * 0.37, rh = phone ? H - base - 124 : H - 60;
  const { ms, div } = splitReading(reading, sp.lc, 100);
  // vertical main scale
  const vx = rx + 20, vmid = ry + rh / 2, pxmm = rh / 6;
  ctx.fillStyle = "#F1F5F9"; ctx.fillRect(vx - 10, ry, 34, rh);
  ctx.textAlign = "right"; ctx.font = `600 12px ${FONT}`;
  for (let m = Math.floor(reading) - 3; m <= Math.floor(reading) + 4; m++) {
    const y = vmid - (m - reading) * pxmm;
    if (y < ry || y > ry + rh) continue;
    ctx.strokeStyle = COL.navy; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(vx + 24, y); ctx.lineTo(vx + 10, y); ctx.stroke();
    ctx.fillStyle = COL.navy; ctx.fillText(String(m), vx + 6, y + 4);
  }
  // disc edge at the reading
  ctx.fillStyle = "rgba(13,148,136,0.25)"; ctx.fillRect(vx + 24, vmid, rw - 50, 12);
  ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx - 10, vmid); ctx.lineTo(rx + rw, vmid); ctx.stroke();
  // disc divisions, read against the edge of the vertical scale
  const dx = vx + 24, spacing = Math.max(9, (rw - 60) / 14);
  ctx.textAlign = "center";
  for (let k = -7; k <= 7; k++) {
    const x = dx + 40 + k * spacing; if (x < dx + 14 || x > rx + rw - 4) continue;
    const dv = ((div + k) % 100 + 100) % 100, major = dv % 5 === 0, hl = k === 0;
    ctx.strokeStyle = hl ? "#DC2626" : "#134E4A"; ctx.lineWidth = hl ? 2.5 : 1.1;
    ctx.beginPath(); ctx.moveTo(x, vmid + 12); ctx.lineTo(x, vmid + 12 + (major ? 18 : 11)); ctx.stroke();
    if (major) { ctx.fillStyle = hl ? "#DC2626" : "#134E4A"; ctx.fillText(String(dv), x, vmid + 46); }
  }
  ctx.strokeStyle = "#DC2626"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(dx + 40, vmid - 8); ctx.lineTo(dx + 40, vmid + 12); ctx.stroke(); ctx.setLineDash([]);
  ctx.textAlign = "left"; ctx.font = `600 11px ${FONT}`; ctx.fillStyle = COL.muted;
  ctx.fillText("main scale (mm)", vx - 10, ry - 6 + (phone ? 0 : 0));
  ctx.fillText("disc (circular scale)", dx + 10, vmid + 64);
  return { ...sp, ms, div, reading };
}

// ---------- the page ----------

function initInstruments(app, el) {
  const st = app.store.get("tools", {
    tool: "vernier", mode: "explore",
    vernier: { length: 23.4, zeroDiv: 0, fine: false },
    screw: { length: 3.27, zeroDiv: 0, pitch: 0.5 },
    sphero: { legs: 4, radius: 60, convex: true, plane: 5, on: "lens" },
    practice: { right: 0, total: 0, streak: 0, best: 0, zero: false },
  });
  st.rule = st.rule || { start: 2.0, length: 7.4 };
  st.cylinder = st.cylinder || { volume: 47, mercury: false };
  let task = null;   // the current practice question

  el.innerHTML = `
    <div class="page-intro">
      <div><div class="page-title">Instruments</div>
      <div class="card-sub">Learn to read the measuring instruments from your physics lab: explore them, practise readings, then learn how they work.</div></div>
    </div>
    <div class="subnav" id="tl-tools">${Object.entries(TOOLS).map(([k, t]) => `<button data-tool="${k}"><b>${t.name}</b><small>${t.desc}</small></button>`).join("")}</div>
    <div class="seg mode-seg" id="tl-mode">
      <button data-mode="explore">Explore</button><button data-mode="practise">Practise</button><button data-mode="learn">Learn</button>
    </div>
    <div class="layout tool-layout">
      <section class="card stage-card"><canvas id="tl-canvas" class="tool-canvas"></canvas></section>
      <aside class="card controls" id="tl-side"></aside>
    </div>
    <section class="card learn-card" id="tl-learn" hidden></section>
    ${funFact("measure")}`;
  const $ = (s) => el.querySelector(s);
  const cv = $("#tl-canvas");
  const persist = () => app.store.set("tools", st);

  const DEFS = {
    vlen: ["Object length", 0, 100, 0.05, "mm", 2], vzero: ["Zero error", -9, 9, 1, "div", 0],
    slen: ["Wire diameter", 0, 20, 0.01, "mm", 2], szero: ["Zero error", -15, 15, 1, "div", 0],
    legs: ["Distance between legs l", 3, 6, 0.1, "cm", 1], radius: ["Radius of curvature R", 5, 200, 1, "cm", 0],
    rstart: ["Object starts at", 0, 30, 0.1, "cm", 1], rlen: ["Object length", 0.5, 60, 0.1, "cm", 1],
    volume: ["Liquid volume", 2, 98, 1, "mL", 0],
  };

  function draw() {
    if (st.mode === "learn") return drawLearnFigure();
    const opt = task ? task.opt : st[st.tool];
    if (st.tool === "vernier") return drawVernier(cv, opt, !task);
    if (st.tool === "screw") return drawScrew(cv, opt, !task);
    if (st.tool === "rule") return drawRule(cv, opt);
    if (st.tool === "cylinder") return drawCylinder(cv, opt);
    return drawSphero(cv, opt);
  }
  // the Learn page shows a worked example of the same instrument next to the text
  function drawLearnFigure() {
    const lc = $("#tl-learn-cv"); if (!lc) return;
    const opt = st[st.tool];
    if (st.tool === "vernier") return drawVernier(lc, opt, false);
    if (st.tool === "screw") return drawScrew(lc, opt, false);
    if (st.tool === "rule") return drawRule(lc, opt);
    if (st.tool === "cylinder") return drawCylinder(lc, opt);
    return drawSphero(lc, opt);
  }

  const step = (n, title, body) => `<div class="wstep"><span class="wn">${n}</span><div><b>${title}</b><div>${body}</div></div></div>`;

  function workingHTML() {
    const o = st[st.tool];
    if (st.tool === "rule") {
      const e = o.start + o.length;
      return step(1, "Least count", "Smallest mark = <b>1 mm = 0.1 cm</b>") +
        step(2, "Start reading", `Don't start at 0 (the end can be worn). Start mark: <b>${o.start.toFixed(1)} cm</b>`) +
        step(3, "End reading", `<b>${e.toFixed(1)} cm</b>, looking straight down to avoid parallax`) +
        step(4, "Length", `${e.toFixed(1)} − ${o.start.toFixed(1)} = <b>${o.length.toFixed(1)} cm</b>`) +
        `<div class="result-pill">Length = ${o.length.toFixed(1)} cm = ${(o.length * 10).toFixed(0)} mm</div>`;
    }
    if (st.tool === "cylinder") {
      return step(1, "Least count", "Each small mark is <b>1 mL</b>") +
        step(2, "Eye level", "Bend down so your eye is level with the liquid surface") +
        step(3, "Read the meniscus", o.mercury ? "Mercury curves upward, so read the <b>top</b> of the curve" : "Water curves downward, so read the <b>bottom</b> of the curve") +
        step(4, "Reading", `<b>${o.volume} mL</b>`) + `<div class="result-pill">Volume = ${o.volume} mL = ${o.volume} cm³</div>`;
    }
    if (st.tool === "vernier") {
      const v = vernierSetup(o);
      return step(1, "Least count", `LC = 1 MSD − 1 VSD = 1 − ${v.vsd.toFixed(2)} = <b>${v.lc} mm</b>`) +
        step(2, "Main scale reading", `Last main mark before the vernier 0: <b>${v.msr} mm</b>`) +
        step(3, "Vernier coincidence", `Vernier line <b>${v.n}</b> lines up (red), so VSR = ${v.n} × ${v.lc} = <b>${(v.n * v.lc).toFixed(2)} mm</b>`) +
        step(4, "Observed reading", `${v.msr} + ${(v.n * v.lc).toFixed(2)} = <b>${v.obs.toFixed(2)} mm</b>`) +
        step(5, "Correct for zero error", v.zero === 0 ? "No zero error, so the length is the observed reading." :
          `Zero error = ${v.zero > 0 ? "+" : ""}${v.zero.toFixed(2)} mm, so length = ${v.obs.toFixed(2)} − (${v.zero.toFixed(2)}) = <b>${v.corrected.toFixed(2)} mm</b>`) +
        `<div class="result-pill">Length = ${v.corrected.toFixed(2)} mm = ${(v.corrected / 10).toFixed(3)} cm</div>`;
    }
    if (st.tool === "screw") {
      const s = screwSetup(o);
      return step(1, "Least count", `LC = pitch ÷ divisions = ${s.pitch} ÷ ${s.N} = <b>${s.lc} mm</b>`) +
        step(2, "Pitch scale reading", `Last mark showing on the sleeve: <b>${s.psr.toFixed(1)} mm</b>`) +
        step(3, "Circular scale reading", `Division <b>${s.csr}</b> is on the line, so CSR = ${s.csr} × ${s.lc} = <b>${(s.csr * s.lc).toFixed(2)} mm</b>`) +
        step(4, "Observed reading", `${s.psr.toFixed(1)} + ${(s.csr * s.lc).toFixed(2)} = <b>${s.obs.toFixed(2)} mm</b>`) +
        step(5, "Correct for zero error", s.zero === 0 ? "No zero error." :
          `Zero error = ${s.zero > 0 ? "+" : ""}${s.zero.toFixed(2)} mm, so diameter = ${s.obs.toFixed(2)} − (${s.zero.toFixed(2)}) = <b>${s.corrected.toFixed(2)} mm</b>`) +
        `<div class="result-pill">Diameter = ${s.corrected.toFixed(2)} mm</div>`;
    }
    const sp = spheroSetup(o), a = splitReading(sp.plane, 0.01, 100), b = splitReading(sp.lens, 0.01, 100);
    return step(1, "Least count", `Pitch 1 mm, 100 disc divisions: LC = <b>0.01 mm</b>`) +
      step(2, "Reading on flat glass", `${a.ms} mm + ${a.div} div = <b>${sp.plane.toFixed(2)} mm</b>`) +
      step(3, `Reading on the ${o.convex ? "convex" : "concave"} surface`, `${b.ms} mm + ${b.div} div = <b>${sp.lens.toFixed(2)} mm</b>`) +
      step(4, "Height h", `h = |${sp.lens.toFixed(2)} − ${sp.plane.toFixed(2)}| = <b>${sp.h.toFixed(2)} mm</b>`) +
      step(5, "Radius of curvature", `R = l²/6h + h/2 = ${sp.l.toFixed(0)}²/(6 × ${sp.h.toFixed(2)}) + ${sp.h.toFixed(2)}/2 = <b>${sp.R.toFixed(0)} mm</b>`) +
      `<div class="result-pill">R ≈ ${sp.Rcm.toFixed(1)} cm</div>`;
  }

  function sideExplore() {
    const o = st[st.tool];
    let h = "";
    if (st.tool === "vernier") {
      h += `<div class="seg" data-opt="fine"><button data-val="0" class="${!o.fine ? "on" : ""}">LC 0.1 mm</button><button data-val="1" class="${o.fine ? "on" : ""}">LC 0.05 mm</button></div>`;
      h += sliderBox("vlen", o.length, DEFS.vlen) + sliderBox("vzero", o.zeroDiv, DEFS.vzero, " <small>in vernier divisions</small>");
    } else if (st.tool === "screw") {
      h += `<div class="seg" data-opt="pitch"><button data-val="0.5" class="${o.pitch === 0.5 ? "on" : ""}">Pitch 0.5 mm · 50 div</button><button data-val="1" class="${o.pitch === 1 ? "on" : ""}">Pitch 1 mm · 100 div</button></div>`;
      h += sliderBox("slen", o.length, DEFS.slen) + sliderBox("szero", o.zeroDiv, DEFS.szero, " <small>in circular divisions</small>");
    } else if (st.tool === "rule") {
      h += sliderBox("rstart", o.start, DEFS.rstart) + sliderBox("rlen", o.length, DEFS.rlen);
    } else if (st.tool === "cylinder") {
      h += `<div class="seg" data-opt="mercury"><button data-val="0" class="${!o.mercury ? "on" : ""}">Water</button><button data-val="1" class="${o.mercury ? "on" : ""}">Mercury</button></div>`;
      h += sliderBox("volume", o.volume, DEFS.volume);
    } else {
      h += `<div class="seg" data-opt="on"><button data-val="plane" class="${o.on === "plane" ? "on" : ""}">On flat glass</button><button data-val="lens" class="${o.on === "lens" ? "on" : ""}">On the surface</button></div>`;
      h += `<div class="seg" data-opt="convex"><button data-val="1" class="${o.convex ? "on" : ""}">Convex</button><button data-val="0" class="${!o.convex ? "on" : ""}">Concave</button></div>`;
      h += sliderBox("legs", o.legs, DEFS.legs) + sliderBox("radius", o.radius, DEFS.radius);
    }
    h += `<div class="group-label">How the reading is worked out</div><div class="working">${workingHTML()}</div>`;
    $("#tl-side").innerHTML = h;
    el.querySelectorAll("#tl-side input[type=range]").forEach(setPct);
  }

  // ---------- practice ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  function newTask() {
    const z = st.practice.zero;
    if (st.tool === "vernier") {
      const fine = Math.random() < 0.4, lc = fine ? 0.05 : 0.1;
      const opt = { fine, zeroDiv: z ? Math.round(rnd(-6, 6)) || 3 : 0, length: Math.round(rnd(5, 90) / lc) * lc };
      task = { opt, answer: vernierSetup(opt).corrected, tol: lc / 2 + 1e-9, unit: "mm", ask: z ? "What is the true length (after correcting the zero error)?" : "What length does the calliper show?" };
    } else if (st.tool === "screw") {
      const pitch = Math.random() < 0.6 ? 0.5 : 1;
      const opt = { pitch, zeroDiv: z ? Math.round(rnd(-8, 8)) || 4 : 0, length: Math.round(rnd(0.5, 12) / 0.01) * 0.01 };
      task = { opt, answer: screwSetup(opt).corrected, tol: 0.005 + 1e-9, unit: "mm", ask: z ? "What is the true diameter (after correcting the zero error)?" : "What diameter does the screw gauge show?" };
    } else if (st.tool === "rule") {
      const opt = { start: Math.round(rnd(1, 5) * 10) / 10, length: Math.round(rnd(2, 20) * 10) / 10 };
      task = { opt, answer: opt.length, tol: 0.05 + 1e-9, unit: "cm", ask: "How long is the object? (start and end are marked)" };
    } else if (st.tool === "cylinder") {
      const opt = { volume: Math.round(rnd(10, 90)), mercury: Math.random() < 0.3 };
      task = { opt, answer: opt.volume, tol: 0.5, unit: "mL", ask: "What volume does the cylinder show?" };
    } else {
      const opt = { legs: Math.round(rnd(30, 55)) / 10, radius: Math.round(rnd(15, 150)), convex: Math.random() < 0.6, plane: Math.round(rnd(2, 8) * 100) / 100, on: "lens" };
      const sp = spheroSetup(opt);
      task = { opt, answer: sp.Rcm, tol: sp.Rcm * 0.02, unit: "cm", ask: `Flat glass reads <b>${sp.plane.toFixed(2)} mm</b>. The legs are <b>${opt.legs} cm</b> apart. Read the surface reading from the picture and find R.` };
    }
    task.done = false;
    sidePractise(); draw();
  }

  function sidePractise(feedback = "") {
    const pr = st.practice, acc = pr.total ? Math.round(100 * pr.right / pr.total) : 0;
    const o = task.opt;
    let given = "";
    if (st.tool === "vernier") given = `Least count <b>${o.fine ? "0.05" : "0.1"} mm</b>${o.zeroDiv ? ` · zero error <b>${o.zeroDiv > 0 ? "+" : ""}${o.zeroDiv} div</b>` : ""}`;
    if (st.tool === "screw") given = `Pitch <b>${o.pitch} mm</b>, <b>${o.pitch === 0.5 ? 50 : 100}</b> divisions${o.zeroDiv ? ` · zero error <b>${o.zeroDiv > 0 ? "+" : ""}${o.zeroDiv} div</b>` : ""}`;
    $("#tl-side").innerHTML = `
      <div class="practice-stats"><div><b>${pr.right}/${pr.total}</b><span>correct</span></div><div><b>${acc}%</b><span>accuracy</span></div><div><b>🔥 ${pr.streak}</b><span>streak</span></div><div><b>${pr.best}</b><span>best</span></div></div>
      <label class="switch"><span>Include zero errors<small>harder</small></span><input type="checkbox" id="tl-zero" ${pr.zero ? "checked" : ""}><span class="track"></span></label>
      ${given ? `<div class="hint">${given}</div>` : ""}
      <div class="ask">${task.ask}</div>
      <div class="answer-row"><span class="num big"><input type="number" inputmode="decimal" id="tl-answer" placeholder="Your answer" step="any"><span class="unit">${task.unit}</span></span>
      <button class="btn primary" id="tl-check">Check</button></div>
      ${feedback}
      <div class="btnrow"><button class="btn" id="tl-new">${ICON.reset}New reading</button></div>`;
  }

  function check() {
    if (!task || task.done) return;
    const v = parseFloat($("#tl-answer").value);
    if (!isFinite(v)) { $("#tl-answer").focus(); return; }
    const ok = Math.abs(v - task.answer) <= task.tol;
    const pr = st.practice;
    pr.total++; if (ok) { pr.right++; pr.streak++; pr.best = Math.max(pr.best, pr.streak); } else pr.streak = 0;
    task.done = true; persist();
    // show the full working for this reading
    const saved = st[st.tool]; st[st.tool] = task.opt;
    const work = workingHTML(); st[st.tool] = saved;
    const fb = `<div class="feedback ${ok ? "good" : "bad"}"><b>${ok ? (pr.streak >= 3 ? `${pr.streak} in a row! 🎉` : "Correct!") : "Not quite."}</b>
      The answer is <b>${task.answer.toFixed(st.tool === "sphero" ? 1 : 2)} ${task.unit}</b>${ok ? "" : `; you said ${v}`}.</div>
      <details class="more open-work" ${ok ? "" : "open"}><summary>See the working</summary><div class="working">${work}</div></details>`;
    sidePractise(fb);
    $("#tl-answer").value = v;
  }

  // ---------- learn ----------
  const LEARN = {
    vernier: `
      <div class="card-title">Reading a vernier calliper</div>
      <p>A vernier calliper measures lengths, inside and outside diameters and depths to a tenth of a millimetre (or better). It has a fixed <b>main scale</b> in millimetres and a sliding <b>vernier scale</b>.</p>
      <h4>Least count</h4><p>Ten vernier divisions span nine main-scale divisions, so each vernier division is 0.9 mm. The difference, <b>1 MSD − 1 VSD = 0.1 mm</b>, is the least count: the smallest length it can read. A 20-division vernier spanning 19 mm reads to 0.05 mm.</p>
      <h4>Taking a reading</h4><ol><li>Note the main-scale mark just before the vernier zero: the <b>main scale reading</b>.</li><li>Find the vernier line that lines up exactly with any main-scale line: that's <b>n</b>.</li><li>Reading = MSR + n × LC.</li></ol>
      <h4>Zero error</h4><p>Close the jaws. If the vernier zero sits <b>to the right</b> of the main zero, the zero error is <b>positive</b> (+n × LC). If it sits <b>to the left</b>, it's <b>negative</b>: −(N − n) × LC. Always <b>subtract</b> the zero error: true reading = observed − zero error.</p>
      <div class="note">Common mistake: reading the vernier division number instead of multiplying it by the least count.</div>`,
    screw: `
      <div class="card-title">Reading a screw gauge</div>
      <p>A screw gauge (micrometer) measures small thicknesses, like a wire's diameter, to 0.01 mm. Turning the <b>thimble</b> once moves the spindle forward by one <b>pitch</b>.</p>
      <h4>Least count</h4><p><b>LC = pitch ÷ number of circular divisions</b>. With a 0.5 mm pitch and 50 divisions, LC = 0.01 mm.</p>
      <h4>Taking a reading</h4><ol><li>Read the last visible mark on the sleeve: the <b>pitch scale reading</b> (whole mm above the line, half mm below).</li><li>Read the circular-scale division on the reference line: <b>CSR</b>.</li><li>Reading = PSR + CSR × LC.</li></ol>
      <h4>Zero error</h4><p>Close the gauge gently using the ratchet. If the circular zero is <b>below</b> the reference line, the error is <b>positive</b>; if <b>above</b>, it's <b>negative</b>. Subtract it from every reading.</p>
      <h4>Backlash</h4><p>Worn threads let the screw slip a little when you reverse direction. Always turn in one direction when taking readings.</p>`,
    sphero: `
      <div class="card-title">Using a spherometer</div>
      <p>A spherometer measures the <b>radius of curvature</b> of a lens or curved mirror. Three outer legs form an equilateral triangle of side <b>l</b>, and a central screw moves up and down through the middle.</p>
      <h4>Least count</h4><p>With a 1 mm pitch and 100 disc divisions, <b>LC = 0.01 mm</b>.</p>
      <h4>Method</h4><ol><li>Place it on a flat glass plate and turn the screw until its tip just touches. Take the reading.</li><li>Place it on the curved surface and turn the screw until it just touches again. Take the reading.</li><li>The difference is the height <b>h</b> (the sagitta).</li><li>Press the legs on paper and measure the triangle's sides to find <b>l</b>.</li></ol>
      <h4>The formula</h4><p><b>R = l²/6h + h/2</b>. It comes from the geometry of a circle through the three leg points and the screw tip.</p>
      <div class="note">Tip: h is tiny (often under a millimetre), so a small reading mistake makes a big difference to R. Take several readings and average them.</div>`,
    rule: `
      <div class="card-title">Using a metre rule</div>
      <p>A metre rule has marks every <b>1 mm</b>, so its least count is <b>0.1 cm</b>.</p>
      <h4>Good habits</h4><ol><li>Don't measure from the 0 end: it may be worn. Start at a clear mark like 1.0 cm and subtract.</li>
      <li>Keep the rule flat against the object, edge to edge.</li><li>Put your eye straight above each reading to avoid <b>parallax error</b>.</li></ol>
      <div class="note">Parallax: if you look from the side, the mark seems to line up with a different number.</div>`,
    cylinder: `
      <div class="card-title">Reading a measuring cylinder</div>
      <p>The liquid surface curves at the edges: this curve is the <b>meniscus</b>.</p>
      <h4>Which part to read</h4><ol><li><b>Water</b> (and most liquids) curves down: read the <b>bottom</b> of the curve.</li>
      <li><b>Mercury</b> curves up: read the <b>top</b>.</li><li>Always crouch so your eye is level with the surface.</li></ol>
      <div class="note">1 mL = 1 cm³. Pick a cylinder whose size fits the volume, so the marks are fine enough.</div>`,
  };

  function render() {
    el.querySelectorAll("#tl-tools button").forEach((b) => b.classList.toggle("on", b.dataset.tool === st.tool));
    el.querySelectorAll("#tl-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === st.mode));
    const learn = st.mode === "learn";
    el.querySelector(".tool-layout").hidden = learn;
    $("#tl-learn").hidden = !learn;
    cv.classList.toggle("tall", st.tool === "sphero");
    cv.dataset.tool = st.tool;
    if (learn) {
      $("#tl-learn").innerHTML = `<div class="learn-grid"><div class="learn-text">${LEARN[st.tool]}
          <button class="btn primary" data-mode-go="practise">Try some practice readings →</button></div>
        <figure class="learn-fig"><canvas id="tl-learn-cv" class="tool-canvas${st.tool === "sphero" ? " tall" : ""}" data-tool="${st.tool}"></canvas>
          <figcaption>An example reading. Change it in <b>Explore</b>.</figcaption></figure></div>`;
      requestAnimationFrame(drawLearnFigure);
      return;
    }
    if (st.mode === "practise") { if (!task || task.tool !== st.tool) { newTask(); task.tool = st.tool; } else { sidePractise(); draw(); } }
    else { task = null; sideExplore(); draw(); }
  }

  // ---------- events ----------
  bindSliders($("#tl-side"), DEFS, (k, v) => {
    const o = st[st.tool];
    if (k === "vlen" || k === "slen") o.length = v;
    else if (k === "vzero" || k === "szero") o.zeroDiv = Math.round(v);
    else if (k === "rstart") o.start = v;
    else if (k === "rlen") o.length = v;
    else o[k] = v;
    persist(); draw();
    const w = el.querySelector(".working"); if (w && st.mode === "explore") w.innerHTML = workingHTML();
  }, {
    // real instruments have a size: typing past it explains why
    vlen: [0, 100, "this calliper's main scale ends at 10 cm"], vzero: [-9, 9, "a zero error is less than one main-scale division"],
    slen: [0, 25, "a standard screw gauge opens 0 to 25 mm"], szero: [-15, 15, ""],
    legs: [2, 10, ""], radius: [3, 10000, ""],
    rstart: [0, 99, "a metre rule is 100 cm long"], rlen: [0.1, 100, "a metre rule is 100 cm long"],
    volume: [0, 100, "this cylinder holds 100 mL"],
  });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) { st.tool = b.dataset.tool; task = null; persist(); return render(); }
    if (b.dataset.mode) { st.mode = b.dataset.mode; persist(); return render(); }
    if (b.dataset.modeGo) { st.mode = b.dataset.modeGo; persist(); return render(); }
    if (b.id === "tl-check") return check();
    if (b.id === "tl-new") { newTask(); task.tool = st.tool; return; }
    const opt = b.parentElement?.dataset.opt;
    if (opt) {
      const o = st[st.tool], v = b.dataset.val;
      if (opt === "fine") o.fine = v === "1";
      else if (opt === "pitch") o.pitch = +v;
      else if (opt === "convex") o.convex = v === "1";
      else if (opt === "on") o.on = v;
      else if (opt === "mercury") o.mercury = v === "1";
      persist(); sideExplore(); draw();
    }
  });
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "tl-answer") check(); });
  el.addEventListener("change", (e) => {
    if (e.target.id === "tl-zero") { st.practice.zero = e.target.checked; persist(); newTask(); task.tool = st.tool; }
  });

  // drag on the picture to move the jaw / turn the thimble
  let dragX = null;
  cv.addEventListener("pointerdown", (e) => { if (st.mode === "explore" && st.tool !== "sphero") { dragX = e.clientX; cv.setPointerCapture(e.pointerId); } });
  cv.addEventListener("pointermove", (e) => {
    if (dragX == null) return;
    const dx = e.clientX - dragX; dragX = e.clientX;
    const o = st[st.tool];
    if (st.tool === "vernier") o.length = clamp(o.length + dx * 0.02, 0, 100);
    else o.length = clamp(o.length + dx * 0.004, 0, 20);
    const key = st.tool === "vernier" ? "vlen" : "slen", box = el.querySelector(`[data-num="${key}"]`), r = el.querySelector(`input[type=range][data-key="${key}"]`);
    if (box) box.value = o.length.toFixed(2);
    if (r) { r.value = o.length; setPct(r); }
    draw();
    const w = el.querySelector(".working"); if (w) w.innerHTML = workingHTML();
  });
  const end = () => { if (dragX != null) { dragX = null; persist(); } };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  new ResizeObserver(() => draw()).observe(cv);
  new ResizeObserver(() => { if (st.mode === "learn") drawLearnFigure(); }).observe(el);

  render();
  return {
    show() { draw(); },
    open(tool) { st.tool = tool; st.mode = "explore"; task = null; persist(); render(); },
  };
}
