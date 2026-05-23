"""
Forgiving copy for daily totals (Story Bible §6, §9).

No punishment phrasing. Softer language, not lower standards.
Recovery copy specifically targets §30's "Recovery rate after missed days"
— the strongest retention predictor.

Goal-aware: framing differs for `lose` / `maintain` / `gain`. Same numbers,
different emotional register, because "a little over today" reads very
differently depending on what the user is working toward.
"""

from __future__ import annotations


def daily_message(
    total: int,
    target: int | None,
    days_since_last_log: int = 0,
    goal: str | None = None,
) -> str:
    # Recovery beats today's calorie framing — the emotional message of
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
    g = (goal or "maintain").lower()

    if g == "lose":
        if pct <= 1.0:
            return "Solid pace toward your goal."
        if delta <= 200:
            return "A little over today. One day doesn't change the goal."
        return "Heavier day. Tomorrow resets — the goal still stands."

    if g == "gain":
        if pct < 0.75:
            return "Light day. A snack or shake might help."
        if pct <= 1.15:
            return "On pace for today."
        return "Strong day. Recovery and sleep matter just as much."

    # maintain (or anything else)
    if pct < 0.5:
        return "Light day so far. Listen to your body."
    if pct <= 1.05:
        return "On track for today."
    if delta <= 250:
        return "A little over today. Tomorrow resets."
    return "Today was heavier than usual. Tomorrow resets."
