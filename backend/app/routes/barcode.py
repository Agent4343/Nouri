"""Barcode lookup against Open Food Facts (§22).

Free, no API key required, global coverage. USDA FoodData Central is also
free but US-only and needs a key — defer to V2 if accuracy on US brands is
a problem.
"""

import logging
import re

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter()
log = logging.getLogger("nouri.barcode")

OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{}.json"
USER_AGENT = "Nouri/0.1 (https://nouri.app)"


class ProductOut(BaseModel):
    barcode: str
    label: str
    brand: str | None
    serving_size_g: float | None
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    per: str  # "serving" or "100g" — tells the client which adjustment UI to show


@router.get("/{barcode}", response_model=ProductOut)
async def lookup(barcode: str) -> ProductOut:
    code = "".join(c for c in barcode if c.isdigit())
    if not code or len(code) > 14:
        raise HTTPException(400, "invalid barcode")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(OFF_URL.format(code), headers={"User-Agent": USER_AGENT})
    except Exception as e:
        log.warning("OFF lookup failed: %s", e)
        raise HTTPException(503, "lookup unavailable")

    if resp.status_code == 404:
        raise HTTPException(404, "product not found")
    if resp.status_code >= 400:
        log.warning("OFF returned %d for %s", resp.status_code, code)
        raise HTTPException(503, "lookup error")

    data = resp.json()
    if data.get("status") != 1:
        raise HTTPException(404, "product not found")

    product = data.get("product") or {}
    nutriments = product.get("nutriments") or {}
    label = (product.get("product_name") or "").strip() or "Unknown product"
    brand = (product.get("brands") or "").split(",")[0].strip() or None
    serving_size_g = _parse_grams(product.get("serving_size"))

    serving_cal = nutriments.get("energy-kcal_serving")
    if serving_size_g and serving_cal is not None:
        return ProductOut(
            barcode=code,
            label=label[:120],
            brand=brand[:60] if brand else None,
            serving_size_g=serving_size_g,
            calories=int(serving_cal),
            protein_g=float(nutriments.get("proteins_serving") or 0),
            carbs_g=float(nutriments.get("carbohydrates_serving") or 0),
            fat_g=float(nutriments.get("fat_serving") or 0),
            per="serving",
        )

    # Fall back to per-100g if serving data is missing.
    return ProductOut(
        barcode=code,
        label=label[:120],
        brand=brand[:60] if brand else None,
        serving_size_g=serving_size_g,
        calories=int(nutriments.get("energy-kcal_100g") or 0),
        protein_g=float(nutriments.get("proteins_100g") or 0),
        carbs_g=float(nutriments.get("carbohydrates_100g") or 0),
        fat_g=float(nutriments.get("fat_100g") or 0),
        per="100g",
    )


def _parse_grams(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r"([\d.]+)\s*g\b", s)
    if not m:
        return None
    try:
        v = float(m.group(1))
        return v if 0 < v < 5000 else None
    except ValueError:
        return None
