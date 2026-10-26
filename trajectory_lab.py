import streamlit as st

st.set_page_config(page_title="Trajectory Lab", page_icon="🎯", layout="wide")

from core.lab import trajectory_lab        # noqa: E402
from core.style import apply_style, footer  # noqa: E402
from core.visits import record_visit        # noqa: E402

apply_style()
trajectory_lab(record_visit())
footer()
