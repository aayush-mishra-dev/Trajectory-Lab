"""The page look around the app: same fonts, colours, banner and top bar as Periodic Lab."""

import streamlit as st

APP_NAME = "Trajectory Lab"

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

html, body, .stApp, .stMarkdown, p, label, button, input, textarea, li {
    font-family: 'Inter', system-ui, sans-serif;
}
.block-container { padding-top: 4.2rem !important; padding-bottom: 3rem; max-width: 1440px; }

/* No fading while the page updates */
[data-stale="true"], .stale-element, .element-container[data-stale="true"] {
    opacity: 1 !important; transition: none !important;
}

/* Frosted top bar; hide the "Deploy" button */
.stAppDeployButton, [data-testid="stAppDeployButton"] { display: none !important; }
header[data-testid="stHeader"] {
    background: rgba(244, 246, 250, 0.82);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(15, 27, 45, 0.06);
}
[data-testid="stVerticalBlock"] { gap: 0.6rem; }

/* Banner */
.hero {
    position: relative; overflow: hidden; isolation: isolate;
    background: radial-gradient(120% 140% at 85% 20%, #1B2E4D 0%, #0F1B2D 55%);
    color: #FFFFFF; border-radius: 24px; padding: 30px 34px 28px; margin-bottom: 8px;
    display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; align-items: center;
}
.hero::before {               /* slow drifting glow */
    content: ""; position: absolute; inset: -40%; z-index: -1;
    background: radial-gradient(closest-side, rgba(29,78,216,.35), transparent 70%) 20% 30% / 50% 50% no-repeat,
                radial-gradient(closest-side, rgba(228,87,46,.22), transparent 70%) 80% 70% / 45% 45% no-repeat;
    animation: glow 14s ease-in-out infinite alternate;
}
@keyframes glow { to { transform: translate(6%, -4%) rotate(8deg); } }
.hero-text > * { animation: heroIn .6s ease both; }
.hero-text > *:nth-child(2) { animation-delay: .08s; } .hero-text > *:nth-child(3) { animation-delay: .16s; }
.hero-text > *:nth-child(4) { animation-delay: .24s; } .hero-text > *:nth-child(5) { animation-delay: .32s; }
@keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.hero-kicker {
    display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #A9BCE6;
}
.hero-kicker i { width: 8px; height: 8px; border-radius: 50%; background: #34D399; box-shadow: 0 0 0 0 rgba(52,211,153,.6); animation: ping 2s infinite; }
@keyframes ping { 70% { box-shadow: 0 0 0 8px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
.hero-title {
    font-family: 'Space Grotesk', sans-serif; font-weight: 700;
    font-size: clamp(32px, 5vw, 50px); line-height: 1.05; margin: 8px 0 10px; letter-spacing: -0.02em;
}
.hero-title span {
    background: linear-gradient(90deg, #FDBA74, #E4572E, #F59E0B, #FDBA74); background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text; color: transparent; animation: shine 6s linear infinite;
}
@keyframes shine { to { background-position: 300% 0; } }
.hero-sub { color: #D4DDF0; font-size: 16px; max-width: 520px; line-height: 1.5; }
.hero-try { display: flex; align-items: center; gap: 10px; margin-top: 14px; font-size: 14.5px; color: #A9BCE6; }
.hero-try b { color: #fff; font-weight: 600; }
.ticker { position: relative; height: 1.5em; overflow: hidden; flex: 1; min-width: 0; }
.ticker span {
    position: absolute; left: 0; top: 0; white-space: nowrap; color: #FDBA74; font-weight: 700;
    opacity: 0; transform: translateY(100%); animation: tick 16s infinite;
}
.ticker span:nth-child(2) { animation-delay: 4s; } .ticker span:nth-child(3) { animation-delay: 8s; } .ticker span:nth-child(4) { animation-delay: 12s; }
@keyframes tick { 0% { opacity: 0; transform: translateY(100%); } 3%, 22% { opacity: 1; transform: none; } 25%, 100% { opacity: 0; transform: translateY(-100%); } }
@property --n { syntax: '<integer>'; inherits: false; initial-value: 0; }
.hero-stats { display: grid; grid-template-columns: repeat(4, auto); justify-content: start; gap: 8px 26px; margin-top: 20px; }
.hero-stats div { border-left: 2px solid rgba(169,188,230,.25); padding-left: 12px; }
.hero-stats b {
    display: block; font: 700 26px 'Space Grotesk', sans-serif; color: #fff;
    counter-reset: n var(--n); animation: count 1.8s cubic-bezier(.2,.7,.2,1) .4s both;
}
.hero-stats b::before { content: counter(n); }
.hero-stats small { color: #A9BCE6; font-size: 12.5px; }
@keyframes count { from { --n: 0; } to { --n: var(--to); } }

/* Banner drawing: one throw, shown as a time-lapse. The dots are equal times apart,
   so they're evenly spaced sideways but bunch up near the top, just like the real thing. */
.hero-art { width: 100%; max-width: 470px; justify-self: end; overflow: visible; }
.hero-art .star { fill: #C7D2FE; animation: twinkle 3s ease-in-out infinite; }
@keyframes twinkle { 50% { opacity: .15; } }
.hero-art .guide { fill: none; stroke: rgba(169,188,230,.16); stroke-width: 1.5; stroke-dasharray: 3 7; stroke-linecap: round; }
.hero-art .dot { opacity: 0; transform-box: fill-box; transform-origin: center; animation: dotIn 6.4s ease-out infinite backwards; }
@keyframes dotIn { 0% { opacity: 0; transform: scale(.2); } 2% { opacity: 1; transform: scale(1.25); } 5% { transform: scale(1); } 40% { opacity: .85; } 50%, 100% { opacity: 0; transform: scale(1); } }
.hero-art .hx { animation: hx 6.4s linear infinite; }
.hero-art .hy { animation: hy 6.4s infinite; }
.hero-art .shadow { transform-box: fill-box; transform-origin: center; animation: hs 6.4s infinite; }
.hero-art .ballwrap { animation: hb 6.4s linear infinite; }
@keyframes hx { 0% { transform: translateX(0); } 43.75%, 100% { transform: translateX(320px); } }
@keyframes hy {
  0% { transform: translateY(0); animation-timing-function: cubic-bezier(.333, .667, .667, 1); }
  21.875% { transform: translateY(-118px); animation-timing-function: cubic-bezier(.333, 0, .667, .333); }
  43.75%, 100% { transform: translateY(0); } }
@keyframes hs {
  0% { transform: scale(1); opacity: .5; animation-timing-function: cubic-bezier(.333, .667, .667, 1); }
  21.875% { transform: scale(.45); opacity: .18; animation-timing-function: cubic-bezier(.333, 0, .667, .333); }
  43.75%, 100% { transform: scale(1); opacity: .5; } }
@keyframes hb { 0%, 86% { opacity: 1; } 94%, 100% { opacity: 0; } }
.hero-art .ripple { fill: none; stroke: #FDBA74; stroke-width: 2; opacity: 0; transform-box: fill-box; transform-origin: center; animation: ripple 6.4s ease-out infinite; }
.hero-art .ripple.r2 { animation-delay: .18s; }
@keyframes ripple { 0%, 43.5% { opacity: 0; transform: scale(.3); } 44% { opacity: .9; transform: scale(.3); } 62%, 100% { opacity: 0; transform: scale(2.4); } }
.hero-art .pad { transform-box: fill-box; transform-origin: center bottom; animation: kick 6.4s ease-out infinite; }
@keyframes kick { 0% { transform: scaleY(.6); } 4% { transform: scaleY(1.2); } 9%, 100% { transform: none; } }

.pe-footer { text-align: center; color: #55627A; font-size: 13px; margin-top: 28px; }

@media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; padding: 24px 22px; }
    .hero-art { justify-self: center; max-width: 520px; margin-top: -4px; }
}
@media (max-width: 640px) {
    .block-container { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
    .hero { padding: 20px 18px 16px; border-radius: 20px; gap: 6px; }
    .hero-sub { font-size: 14.5px; }
    .hero-try { font-size: 13.5px; margin-top: 10px; }
    .hero-stats { grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 14px; }
    .hero-stats div { padding-left: 8px; }
    .hero-stats b { font-size: 21px; }
    .hero-stats small { font-size: 11px; line-height: 1.25; display: block; }
    .hero-art { max-width: 330px; margin: -6px auto -4px; }
}
@media (prefers-reduced-motion: reduce) {
    .hero *, .hero::before { animation-duration: .01s !important; animation-iteration-count: 1 !important; }
}
</style>
"""

# Banner drawing: a single throw as a time-lapse (no text, just motion).
_STARS = [(20, 22, 1.2, 0), (88, 48, 1, .8), (140, 14, 1.4, 1.6), (210, 30, 1, .4), (262, 62, 1.3, 2.2),
          (320, 18, 1.1, 1.2), (372, 44, 1.5, .2), (404, 96, 1, 2.6), (350, 120, 1.2, 1.8), (110, 96, 1, 2.9)]
_X0, _Y0, _L, _H, _N, _FLIGHT = 50, 163, 320, 118, 12, 2.8


def _dots():
    out = []
    for i in range(_N + 1):
        t = i / _N
        x, y = _X0 + _L * t, _Y0 - 4 * _H * t * (1 - t)
        colour = "#7DD3FC" if i % 3 else "#A9BCE6"
        out.append(f"<circle class='dot' cx='{x:.1f}' cy='{y:.1f}' r='{3.2 if i % 3 else 4.2}' fill='{colour}' "
                   f"style='animation-delay:{t * _FLIGHT:.3f}s'/>")
    return "".join(out)


HERO_ART = (
    "<svg class='hero-art' viewBox='0 0 420 200' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>"
    + "".join(f"<circle class='star' cx='{x}' cy='{y}' r='{r}' style='animation-delay:{d}s'/>" for x, y, r, d in _STARS)
    + f"<path class='guide' d='M {_X0} {_Y0} Q {_X0 + _L / 2} {_Y0 - 2 * _H} {_X0 + _L} {_Y0}'/>"
    + "<line x1='10' y1='170' x2='410' y2='170' stroke='rgba(169,188,230,.35)' stroke-width='2'/>"
    + "".join(f"<line x1='{x}' y1='170' x2='{x}' y2='175' stroke='rgba(169,188,230,.3)' stroke-width='1.5'/>" for x in range(50, 411, 40))
    + _dots()
    + f"<ellipse class='ripple' cx='{_X0 + _L}' cy='171' rx='12' ry='3.5'/><ellipse class='ripple r2' cx='{_X0 + _L}' cy='171' rx='12' ry='3.5'/>"
    + f"<g class='ballwrap'><g class='hx'><ellipse class='shadow' cx='{_X0}' cy='171' rx='10' ry='2.8' fill='#7DD3FC'/>"
    + f"<g class='hy'><circle cx='{_X0}' cy='{_Y0}' r='7.5' fill='#E4572E' stroke='#fff' stroke-width='2.2' style='filter:drop-shadow(0 0 6px rgba(228,87,46,.75))'/></g></g></g>"
    + f"<rect class='pad' x='{_X0 - 11}' y='164' width='22' height='7' rx='3' fill='#E4572E' opacity='.85'/>"
    + "</svg>"
)

TRY = ["throw a golf ball on the Moon", "cross a river the fastest way", "keep dry under a tilted umbrella", "read a vernier calliper"]
STATS = [(50, "target levels"), (4, "worlds to throw on"), (5, "lab instruments"), (40, "moments in history")]


def apply_style():
    st.markdown(CSS, unsafe_allow_html=True)
    ticker = "".join(f"<span>{t}</span>" for t in TRY)
    stats = "".join(f"<div><b style='--to:{n}'></b><small>{label}</small></div>" for n, label in STATS)
    st.markdown(
        "<div class='hero'><div class='hero-text'>"
        "<div class='hero-kicker'><i></i>Interactive Physics Lab - Initiative by Aayush Mishra</div>"
        f"<div class='hero-title'>Trajectory <span>Lab</span></div>"
        "<div class='hero-sub'>Launch anything, anywhere, and watch how speed, angle, gravity, "
        "air and wind shape its path. Every number is worked out live, step by step.</div>"
        f"<div class='hero-try'><b>Try:</b><div class='ticker'>{ticker}</div></div>"
        f"<div class='hero-stats'>{stats}</div>"
        "</div>" + HERO_ART + "</div>",
        unsafe_allow_html=True,
    )


def footer():
    st.markdown(f"<div class='pe-footer'>{APP_NAME} · Physics Made Easy "
                "Initiative by Aayush Mishra</div>", unsafe_allow_html=True)
