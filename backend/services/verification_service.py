import io
import json
import base64
import logging
from PIL import Image
from config import Config

logger = logging.getLogger(__name__)

def evaluate_image_foliage_heuristics(image_buffer: io.BytesIO) -> dict:
    """
    Local heuristic fallback when cloud vision API is unavailable.
    Inspects color distributions and pixel characteristics to reject clearly non-plant images.
    """
    try:
        image_buffer.seek(0)
        with Image.open(image_buffer) as img:
            sample = img.convert("RGB").resize((120, 120))
            pixels = list(sample.get_flattened_data()) if hasattr(sample, "get_flattened_data") else list(sample.getdata())

        total = len(pixels)
        greenish = 0
        extreme_bright_or_dark = 0

        for r, g, b in pixels:
            # Check for vegetation-consistent green/yellowish spectrum
            if g > r * 1.05 and g > b * 1.15 and g > 35:
                greenish += 1
            # Check for diseased yellow-brown foliage (chlorosis/necrosis)
            elif (r > 90 and g > 75 and b < 60) and (r + g > 170):
                greenish += 1
            # Check for near black or near white (empty/blank/overexposed)
            if (r < 25 and g < 25 and b < 25) or (r > 240 and g > 240 and b > 240):
                extreme_bright_or_dark += 1

        veg_ratio = greenish / total
        extreme_ratio = extreme_bright_or_dark / total

        if extreme_ratio > 0.85:
            return {
                "status": "NOT_SOYBEAN_LEAF",
                "reason": "Image appears overexposed, underexposed, or blank without discernible foliage.",
                "confidence": 0.88,
                "provider": "local_heuristic"
            }

        if veg_ratio < 0.12:
            # Color alone cannot reliably distinguish a severely diseased,
            # yellowing, or brown soybean leaf from a non-leaf object.
            # Let the configured vision classifier make the final assessment.
            return {
                "status": "UNCERTAIN",
                "reason": "Leaf species could not be verified from color characteristics alone; AI disease classification will assess the image.",
                "confidence": 0.50,
                "provider": "local_heuristic"
            }

        # Color heuristics cannot distinguish soybean from other plant species.
        # Never claim species verification without a vision model.
        return {
            "status": "UNCERTAIN",
            "reason": "Foliage-like colors were detected, but soybean species cannot be verified without the configured vision model.",
            "confidence": 0.50,
            "provider": "local_heuristic"
        }

    except Exception as e:
        logger.warning(f"Local heuristic leaf evaluation failed: {e}")
        return {
            "status": "UNCERTAIN",
            "reason": "Could not determine leaf presence from image characteristics.",
            "confidence": 0.50,
            "provider": "local_heuristic"
        }


def verify_soybean_leaf(image_buffer: io.BytesIO) -> dict:
    """
    Stage B uses a cheap local screen only. The vision classifier in Stage C
    performs the actual soybean-leaf verification and disease classification
    together, avoiding two paid/rate-limited vision requests for one upload.
    Color heuristics never claim that a plant is a soybean.
    """
    return evaluate_image_foliage_heuristics(image_buffer)
