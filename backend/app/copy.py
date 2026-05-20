"""
Forgiving copy for daily totals (Story Bible §6, §9).

No punishment phrasing. Softer language, not lower standards.
"""

from __future__ import annotations


def daily_message(total: int, target: int | None) -> str:
    if target is None:
        return "You're tracking. That's the win."

    if total == 0:
        return "Nothing logged yet. Whenever you're ready."

    delta = total - target
    pct = total / target

    if pct < 0.5:
        return "Light day so far. Listen to your body."
    if pct <= 1.05:
        return "On track for today."
    if delta <= 250:
        return "A little over today. Tomorrow resets."
    return "Today was heavier than usual. Tomorrow resets."
