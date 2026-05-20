"""
Mock vision layer.

Per Story Bible §20, the real Layer 1 will be a third-party vision API.
For the minimum loop this returns plausible canned results so the rest of
the loop can be built and tested without spending on API calls.

Confidence is deliberately variable so the low-confidence fallback UX
(Story Bible §15) gets exercised.
"""

import hashlib
import random
from dataclasses import dataclass


@dataclass
class VisionGuess:
    label: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: float
    alternatives: list[tuple[str, int]]


_CANNED = [
    ("Salad bowl", 380, 14, 28, 22),
    ("Chicken sandwich", 540, 32, 48, 22),
    ("Pasta with tomato sauce", 620, 18, 92, 16),
    ("Smoothie", 290, 8, 54, 4),
    ("Eggs and toast", 410, 22, 36, 18),
    ("Burrito", 720, 26, 78, 32),
    ("Stir fry with rice", 580, 24, 76, 18),
    ("Greek yogurt with berries", 220, 16, 28, 4),
    ("Avocado toast", 340, 10, 32, 20),
    ("Burger and fries", 880, 32, 84, 44),
]


def guess(seed: str | None = None, hint: str | None = None) -> VisionGuess:
    rng = random.Random(_seed(seed))
    primary = rng.choice(_CANNED)
    label, cal, p, c, f = primary

    # Hint nudges label without faking certainty.
    if hint:
        label = f"{label} ({hint.strip()[:40]})"

    confidence = round(rng.uniform(0.55, 0.95), 2)

    alts = rng.sample([x for x in _CANNED if x[0] != primary[0]], 2)
    alternatives = [(a[0], a[1]) for a in alts]

    return VisionGuess(
        label=label,
        calories=cal,
        protein_g=float(p),
        carbs_g=float(c),
        fat_g=float(f),
        confidence=confidence,
        alternatives=alternatives,
    )


def _seed(s: str | None) -> int:
    if not s:
        return random.randint(0, 2**31 - 1)
    return int(hashlib.sha256(s.encode()).hexdigest(), 16) % (2**31 - 1)
