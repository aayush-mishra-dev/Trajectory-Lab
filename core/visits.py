"""Counts visits: one per browser session, saved in visits.json next to the app."""

import ipaddress
import json
import urllib.request
from datetime import date
from pathlib import Path

import streamlit as st

FILE = Path(__file__).resolve().parent.parent / "visits.json"
LOCAL_COUNTRY = "India"   # used when the app runs on your own computer or home Wi-Fi


def _country():
    """Works out the visitor's country from their IP address (best effort)."""
    try:
        headers = st.context.headers
        ip = (headers.get("X-Forwarded-For") or headers.get("X-Real-Ip") or "").split(",")[0].strip()
        if not ip or ipaddress.ip_address(ip).is_private or ipaddress.ip_address(ip).is_loopback:
            return LOCAL_COUNTRY
        with urllib.request.urlopen(f"https://ipapi.co/{ip}/country_name/", timeout=2) as r:
            name = r.read().decode().strip()
        return name if name and len(name) < 60 and "error" not in name.lower() else "Unknown"
    except Exception:
        return LOCAL_COUNTRY


def _load():
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"total": 0, "days": {}}


def record_visit():
    """Adds this visit (once per session) and returns the counts for the Visitors page."""
    data = _load()
    today = date.today().isoformat()
    if not st.session_state.get("_visit_counted"):
        st.session_state["_visit_counted"] = True
        data["total"] = data.get("total", 0) + 1
        days = data.setdefault("days", {})
        days[today] = days.get(today, 0) + 1
        countries = data.setdefault("countries", {})
        c = _country()
        countries[c] = countries.get(c, 0) + 1
        try:
            FILE.write_text(json.dumps(data), encoding="utf-8")
        except OSError:
            pass
    host = st.context.headers.get("Host", "") if hasattr(st, "context") else ""
    return {"total": data.get("total", 0), "today": data.get("days", {}).get(today, 0),
            "days": data.get("days", {}), "countries": data.get("countries", {}), "local": host.startswith(("localhost", "127.", "192.168.", "10."))}
