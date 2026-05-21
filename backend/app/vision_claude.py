"""
Claude Sonnet vision integration for food analysis.

The system prompt is marked for prompt caching, but Sonnet 4.6's minimum
cacheable prefix is 2048 tokens — our prompt is ~250 tokens, so the cache
won't actually hit yet. The marker is correctly placed so caching takes
effect automatically once the prompt grows (e.g. when we add a food
database lookup or richer brand/tone context).
"""

import base64
import logging

from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field

from app.config import settings


log = logging.getLogger("nouri.vision_claude")


class MealAlt(BaseModel):
    label: str = Field(..., description="Short food name, max 80 chars")
    calories: int = Field(..., ge=0, le=5000)


class MealGuess(BaseModel):
    """Structured food estimate returned by Claude vision."""

    label: str = Field(..., description="Short food name, max 80 chars")
    calories: int = Field(..., ge=0, le=5000, description="Total calories for the whole portion shown")
    protein_g: float = Field(..., ge=0, le=500)
    carbs_g: float = Field(..., ge=0, le=500)
    fat_g: float = Field(..., ge=0, le=500)
    confidence: float = Field(..., ge=0, le=1, description="0-1 — lower when food is unclear")
    alternatives: list[MealAlt] = Field(default_factory=list, max_length=3)


SYSTEM_PROMPT = """You analyze photos of food and return calorie and macro estimates.

Output rules:
- Total calories and macros for the WHOLE portion visible, not per serving
- Confidence ≤ 0.6 when the photo is blurry, partial, plate is occluded, or the food type is genuinely ambiguous
- Confidence ≤ 0.3 when you can't see food clearly — use a generic label like "Unidentified meal"
- Provide up to 3 plausible alternative interpretations if the dish could reasonably be something else
- Macros must roughly reconcile with calories (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat) within ±15%

Style:
- Labels are short, neutral, no marketing language. Prefer "Salad bowl" over "Fresh garden salad with vibrant greens"
- Round calories to nearest 10, macros to nearest gram
- Never fake precision. The product principle is honesty about uncertainty.
"""


_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


def is_configured() -> bool:
    return bool(settings.anthropic_api_key)


async def analyze_food(image_bytes: bytes, media_type: str, hint: str | None = None) -> MealGuess:
    """Send an image to Claude and return a validated MealGuess.

    Raises on transport errors, schema validation failures, or refusals.
    Callers should wrap and fall back to the mock layer (Story Bible §6:
    failures stay calm).
    """
    client = _get_client()

    user_text = "Analyze this meal. Return calories, macros, confidence, and up to 3 alternative interpretations."
    if hint:
        user_text += f"\n\nUser hint: {hint.strip()[:200]}"

    response = await client.messages.parse(
        model=settings.vision_model,
        max_tokens=600,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64.standard_b64encode(image_bytes).decode("ascii"),
                        },
                    },
                    {"type": "text", "text": user_text},
                ],
            }
        ],
        output_format=MealGuess,
    )

    if response.parsed_output is None:
        raise RuntimeError(
            f"vision parse failed: stop_reason={response.stop_reason} stop_details={response.stop_details}"
        )

    log.info(
        "vision ok: label=%r confidence=%.2f cache_read=%d cache_write=%d input=%d",
        response.parsed_output.label,
        response.parsed_output.confidence,
        response.usage.cache_read_input_tokens or 0,
        response.usage.cache_creation_input_tokens or 0,
        response.usage.input_tokens,
    )

    return response.parsed_output
