"""
Forgiving copy for daily totals (Story Bible §6, §9).

No punishment phrasing. Softer language, not lower standards.
Recovery copy specifically targets §30's "Recovery rate after missed days"
— the strongest retention predictor.
"""

from __future__ import annotations


def daily_message(total: int, target: int | None, days_since_last_log: int = 0) -> str:
    # Welcome-back beats today's calorie framing — the emotional message of
    # "you came back after a gap" matters more than the numbers (§6).
    if total > 0 and days_since_last_log >= 1:
        if days_since_last_log == 1:
            return "Welcome back. Picking up where you left off."
        if days_since_last_log <= 4:
            return f"Welcome back. Quiet {days_since_last_log} days — today resets things."
        return "Welcome back. Whenever you're ready, we're here."

    if target is None:
        return "You're tracking. That's the win."

    if total == 0:
        if days_since_last_log >= 2:
            return "Welcome back. Nothing logged yet — no rush."
        return "Nothing logged yet. Whenever you're ready."

    pct = total / target
    delta = total - target

    if pct < 0.5:
        return "Light day so far. Listen to your body."
    if pct <= 1.05:
        return "On track for today."
    if delta <= 250:
        return "A little over today. Tomorrow resets."
    return "Today was heavier than usual. Tomorrow resets."
