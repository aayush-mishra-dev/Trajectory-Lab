// ===================================================================
//  Drawing helpers shared by the 2D view, 3D view and charts
// ===================================================================

const COL = {
  navy: "#0F1B2D", blue: "#1D4ED8", orange: "#E4572E", muted: "#55627A",
  grid: "#E9EEF6", gridStrong: "#D5DDEA", line: "#E3E8F0",
  path: "#1D4ED8", ghost: "#A3AEC2", ground: "#6B8F4E", groundFill: "#E3EED8",
  v: "#0F1B2D", vx: "#8B5CF6", vz: "#10B981",
  height: "#059669", range: "#1D4ED8", vmax: "#DC2626", vmin: "#D97706", wind: "#0E7490",
};
const FONT = "Inter, system-ui, -apple-system, sans-serif";

// A "nice" grid spacing (1, 2 or 5 × 10ⁿ) giving about `target` lines over `span`
function niceStep(span, target = 6) {
  const raw = Math.max(span, 1e-9) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}

function fmt(v, step) {
  const d = step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step)));
  return v.toFixed(d);
}

// Sets up a canvas for sharp drawing on high-resolution screens
function prepCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function arrow(ctx, x0, y0, x1, y1, color, width = 2.5) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  const head = Math.min(10, len * 0.45), ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - head * 0.6 * Math.cos(ang), y1 - head * 0.6 * Math.sin(ang)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(ang - 0.42), y1 - head * Math.sin(ang - 0.42));
  ctx.lineTo(x1 - head * Math.cos(ang + 0.42), y1 - head * Math.sin(ang + 0.42));
  ctx.closePath(); ctx.fill();
}

// Rounded label with a coloured dot, kept inside the canvas
function pill(ctx, text, x, y, color, W, H, place = "above") {
  ctx.font = `600 12px ${FONT}`;
  const tw = ctx.measureText(text).width, pw = tw + 22, ph = 22;
  let px = x - pw / 2, py = place === "above" ? y - ph - 12 : y + 12;
  px = Math.max(4, Math.min(W - pw - 4, px));
  py = Math.max(4, Math.min(H - ph - 4, py));
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Math.max(px + 8, Math.min(px + pw - 8, x)), place === "above" ? py + ph : py); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, px, py, pw, ph, 11); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px + 10, py + ph / 2, 3.5, 0, 7); ctx.fill();
  ctx.fillText(text, px + 17, py + 15.5);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function ball(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
  g.addColorStop(0, "#FF9A7A"); g.addColorStop(1, COL.orange);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5; ctx.stroke();
}

function badge(ctx, text, x, y, color, align = "right") {
  ctx.font = `600 12px ${FONT}`;
  const w = ctx.measureText(text).width + 18, h = 24;
  const bx = align === "right" ? x - w : x;
  ctx.fillStyle = "rgba(255,255,255,0.92)"; roundRect(ctx, bx, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = COL.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = color; ctx.fillText(text, bx + 9, y + 16.5);
}

// Small top-down compass for the wind: the grey arrow is your throw (pointing "ahead"),
// the teal arrow is where the wind is blowing. Matches the dial in the Air & wind controls.
function windCompass(ctx, cx, cy, r, windDir, speed) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.94)"; ctx.strokeStyle = "#A5F3FC"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.font = `600 9px ${FONT}`; ctx.fillStyle = "#64748B"; ctx.textAlign = "center";
  ctx.fillText("ahead", cx, cy - r + 11); ctx.fillText("you", cx, cy + r - 5);
  ctx.textAlign = "left"; ctx.fillText("L", cx - r + 5, cy + 3); ctx.textAlign = "right"; ctx.fillText("R", cx + r - 5, cy + 3);
  // your throw
  ctx.setLineDash([3, 3]); arrow(ctx, cx, cy + r * 0.45, cx, cy - r * 0.5, "#94A3B8", 1.6); ctx.setLineDash([]);
  // the wind: 0° blows ahead, 90° blows to your left, 180° back at you, 270° to your right
  const d = windDir * RAD, ux = -Math.sin(d), uy = -Math.cos(d), L = r * 0.72;
  arrow(ctx, cx - ux * L, cy - uy * L, cx + ux * L, cy + uy * L, "#0891B2", 3.2);
  // name and speed in a label to the right of the compass
  const t1 = windName(windDir), t2 = `${speed.toFixed(1)} m/s`;
  ctx.font = `700 11px ${FONT}`; const w = Math.max(ctx.measureText(t1).width, ctx.measureText(t2).width) + 14;
  ctx.fillStyle = "rgba(255,255,255,0.94)"; roundRect(ctx, cx + r + 6, cy - 17, w, 34, 8); ctx.fill();
  ctx.textAlign = "left"; ctx.fillStyle = "#0E7490"; ctx.fillText(t1, cx + r + 13, cy - 3);
  ctx.font = `600 10.5px ${FONT}`; ctx.fillStyle = "#475569"; ctx.fillText(t2, cx + r + 13, cy + 11);
  ctx.restore();
}
function windName(dir) {
  const names = ["Tailwind", "Tailwind from the right", "Crosswind from the right", "Headwind from the right",
                 "Headwind", "Headwind from the left", "Crosswind from the left", "Tailwind from the left"];
  return names[Math.round((((dir % 360) + 360) % 360) / 45) % 8];
}
