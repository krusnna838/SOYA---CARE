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
            return {
                "status": "NOT_SOYBEAN_LEAF",
                "reason": "Image lacks plant foliage or leaf color characteristics (human, animal, document, or non-plant object detected).",
                "confidence": 0.82,
                "provider": "local_heuristic"
            }

        # Foliage detected locally, but species cannot be guaranteed without vision model
        return {
            "status": "SOYBEAN_LEAF",
            "reason": "Plant foliage confirmed via local visual analysis. (Cloud vision API offline; proceed with agronomic caution).",
            "confidence": 0.70,
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
    STAGE B: Soybean Leaf Verification Pipeline
    Queries Groq Vision model with fallback to local visual heuristics.
    Returns:
        status: 'SOYBEAN_LEAF' | 'NOT_SOYBEAN_LEAF' | 'UNCERTAIN'
        reason: Plain-text explanation
        confidence: float (0.0 to 1.0)
        provider: 'groq_vision' | 'local_heuristic'
    """
    if not Config.GROQ_API_KEY:
        logger.info("Groq API key not provided; using local foliage heuristic screening.")
        return evaluate_image_foliage_heuristics(image_buffer)

    try:
        from groq import Groq
        client = Groq(api_key=Config.GROQ_API_KEY, timeout=15.0)

        image_buffer.seek(0)
        b64_data = base64.b64encode(image_buffer.getvalue()).decode("ascii")

        system_prompt = (
            "You are a strict agricultural computer vision screening assistant for a soybean health platform. "
            "Your ONLY role is to examine the uploaded photo and verify whether it contains a soybean (Glycine max) leaf. "
            "You MUST reject images showing: human faces, bodies, animals, livestock, vehicles, indoor buildings, "
            "documents, screenshots, random non-agricultural objects, or unrelated non-foliar plants (e.g. cacti, conifers, bananas). "
            "Acknowledge that vision models cannot provide 100% botanical DNA proof, but you must identify visible leaf morphology. "
            "Return valid JSON ONLY with these exact fields: "
            '{"status": "SOYBEAN_LEAF" | "NOT_SOYBEAN_LEAF" | "UNCERTAIN", '
            '"reason": "brief 1-2 sentence explanation", '
            '"confidence": float between 0.0 and 1.0}. '
            "Do NOT diagnose diseases in this stage. If unsure or blurry, return UNCERTAIN."
        )

        user_content = [
            {"type": "text", "text": "Inspect this image carefully. Is this visibly a soybean leaf suitable for disease diagnosis?"},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_data}"}}
        ]

        response = client.chat.completions.create(
            model=Config.GROQ_VISION_MODEL,
            temperature=0.0,
            max_tokens=220,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        status = data.get("status", "UNCERTAIN").strip().upper()
        if status not in {"SOYBEAN_LEAF", "NOT_SOYBEAN_LEAF", "UNCERTAIN"}:
            status = "UNCERTAIN"

        reason = str(data.get("reason", "Verification assessment completed."))[:400]
        try:
            confidence = float(data.get("confidence", 0.75))
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 0.75

        return {
            "status": status,
            "reason": reason,
            "confidence": confidence,
            "provider": "groq_vision"
        }

    except Exception as exc:
        logger.warning(f"Groq Vision verification encountered an issue: {exc}. Falling back to local heuristic.")
        # Graceful fallback to local heuristics so system never crashes
        fallback = evaluate_image_foliage_heuristics(image_buffer)
        fallback["reason"] += " (Groq vision service temporarily unavailable)."
        return fallback
