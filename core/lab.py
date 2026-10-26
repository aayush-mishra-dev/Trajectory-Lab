"""Loads the browser-side app (HTML, CSS and JavaScript in the assets folder)
and registers it as a Streamlit component.

The simulator runs entirely in the visitor's browser, so moving a slider or
playing the animation never waits for the server.
"""

from pathlib import Path

import streamlit as st
from streamlit.components.v2 import component

ASSETS = Path(__file__).resolve().parent.parent / "assets"

# The JavaScript files are joined into one module, in this order
JS_FILES = ["physics.js", "draw.js", "trivia.js", "stage2d.js", "stage3d.js", "charts.js", "maths.js", "history.js",
            "instruments.js", "relative.js", "challenges.js", "quiz.js", "play.js", "visitors.js", "ui.js"]


@st.cache_resource
def _component():
    html = (ASSETS / "app.html").read_text(encoding="utf-8")
    css = (ASSETS / "app.css").read_text(encoding="utf-8")
    js = "\n".join((ASSETS / "js" / name).read_text(encoding="utf-8") for name in JS_FILES)
    return component("trajectory_lab", html=html, css=css, js=js)


def trajectory_lab(data=None):
    _component()(key="trajectory_lab", data=data or {})
