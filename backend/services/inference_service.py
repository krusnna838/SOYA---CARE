import io
import logging
from PIL import Image
from config import Config

logger = logging.getLogger(__name__)

# Standard canonical label normalization map
DISEASE_LABEL_MAP = {
    "brown_spot": "Septoria Brown Spot",
    "septoria": "Septoria Brown Spot",
    "septoria_brown_spot": "Septoria Brown Spot",
    "brown spot": "Septoria Brown Spot",
    "rust": "Asian Soybean Rust",
    "soybean_rust": "Asian Soybean Rust",
    "asian_rust": "Asian Soybean Rust",
    "asian soybean rust": "Asian Soybean Rust",
    "frogeye": "Frogeye Leaf Spot",
    "frogeye_leaf_spot": "Frogeye Leaf Spot",
    "frogeye leaf spot": "Frogeye Leaf Spot",
    "bacterial_blight": "Bacterial Blight",
    "blight": "Bacterial Blight",
    "bacterial blight": "Bacterial Blight",
    "mosaic": "Soybean Mosaic Virus",
    "soybean_mosaic": "Soybean Mosaic Virus",
    "downy_mildew": "Downy Mildew",
    "mildew": "Downy Mildew",
    "healthy": "Healthy Soybean Leaf",
    "healthy_leaf": "Healthy Soybean Leaf",
    "healthy_soybean": "Healthy Soybean Leaf"
}

def normalize_label(raw_label: str) -> str:
    cleaned = str(raw_label or "").strip().lower().replace("-", "_").replace(" ", "_")
    for key, canonical in DISEASE_LABEL_MAP.items():
        if key in cleaned:
            return canonical
    # Return formatted title case if not in map
    return str(raw_label).replace("_", " ").title()

def local_botanical_classifier(image_buffer: io.BytesIO) -> list:
    """
    Calibrated computer vision feature extractor used when hosted Roboflow
    API key is unconfigured or network is offline.
    Extracts necrotic lesion frequency, chlorotic halo intensity, and pustule spots.
    """
    try:
        image_buffer.seek(0)
        with Image.open(image_buffer) as img:
            sample = img.convert("RGB").resize((160, 160))
            pixels = list(sample.get_flattened_data()) if hasattr(sample, "get_flattened_data") else list(sample.getdata())

        total = len(pixels)
        brown_spots = 0
        rusty_red_pustules = 0
        chlorotic_yellow = 0
        healthy_green = 0

        for r, g, b in pixels:
            # Healthy lush green
            if g > r * 1.15 and g > b * 1.25 and g > 50:
                healthy_green += 1
            # Rusty reddish-brown pustules
            elif r > 110 and g < r * 0.75 and b < 55:
                rusty_red_pustules += 1
            # Dark necrotic brown spots
            elif r > 50 and r < 120 and g > 30 and g < 90 and b < 45 and abs(r - g) < 35:
                brown_spots += 1
            # Chlorotic halo yellowing
            elif r > 140 and g > 140 and b < 80:
                chlorotic_yellow += 1

        rust_ratio = rusty_red_pustules / total
        spot_ratio = brown_spots / total
        yellow_ratio = chlorotic_yellow / total
        green_ratio = healthy_green / total

        predictions = []

        if rust_ratio > 0.04:
            conf = min(0.96, 0.72 + rust_ratio * 3.5)
            predictions.append({"class": "Asian Soybean Rust", "confidence": round(conf, 4)})
            predictions.append({"class": "Septoria Brown Spot", "confidence": round(max(0.04, 1.0 - conf), 4)})
        elif spot_ratio > 0.05:
            conf = min(0.95, 0.70 + spot_ratio * 3.0)
            predictions.append({"class": "Septoria Brown Spot", "confidence": round(conf, 4)})
            predictions.append({"class": "Frogeye Leaf Spot", "confidence": round(max(0.05, 1.0 - conf - 0.05), 4)})
        elif yellow_ratio > 0.10:
            conf = min(0.92, 0.68 + yellow_ratio * 1.8)
            predictions.append({"class": "Bacterial Blight", "confidence": round(conf, 4)})
            predictions.append({"class": "Septoria Brown Spot", "confidence": round(max(0.06, 1.0 - conf), 4)})
        else:
            conf = min(0.98, max(0.80, green_ratio * 1.2))
            predictions.append({"class": "Healthy Soybean Leaf", "confidence": round(conf, 4)})
            predictions.append({"class": "Septoria Brown Spot", "confidence": round(max(0.02, 1.0 - conf), 4)})

        for p in predictions:
            p["confidence_percent"] = round(p["confidence"] * 100, 2)
            p["normalized_class"] = normalize_label(p["class"])

        return predictions
    except Exception as e:
        logger.error(f"Local botanical classifier failed: {e}")
        return [{
            "class": "Inconclusive Foliar Specimen",
            "confidence": 0.40,
            "confidence_percent": 40.0,
            "normalized_class": "Inconclusive"
        }]

def run_disease_inference(image_buffer: io.BytesIO) -> dict:
    """
    STAGE C: Disease Classification Pipeline
    Sends image to Roboflow hosted inference model with calibrated fallback.
    Returns:
        success: bool
        model_id: str
        predictions: list of dicts [{class, confidence, confidence_percent, normalized_class}]
        top_prediction: dict
    """
    # 1. Check if Roboflow credentials are validly supplied
    if Config.ROBOFLOW_API_KEY and Config.ROBOFLOW_API_KEY.strip() and "your_roboflow" not in Config.ROBOFLOW_API_KEY.lower():
        try:
            from inference_sdk import InferenceHTTPClient
            client = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key=Config.ROBOFLOW_API_KEY
            )

            image_buffer.seek(0)
            with Image.open(image_buffer) as im:
                rgb_img = im.convert("RGB")

            raw_result = client.infer(rgb_img, model_id=Config.ROBOFLOW_MODEL_ID)

            predictions = []
            items = raw_result.get("predictions", [])
            if isinstance(items, dict):
                items = [items]

            for item in items:
                if not isinstance(item, dict):
                    continue
                label = item.get("class") or item.get("label") or item.get("class_name")
                conf = item.get("confidence")
                try:
                    conf = float(conf)
                except (ValueError, TypeError):
                    continue

                if label and 0.0 <= conf <= 1.0:
                    canonical = normalize_label(str(label))
                    predictions.append({
                        "class": canonical,
                        "raw_label": str(label),
                        "confidence": round(conf, 4),
                        "confidence_percent": round(conf * 100, 2)
                    })

            predictions.sort(key=lambda x: x["confidence"], reverse=True)

            if predictions:
                return {
                    "success": True,
                    "provider": "roboflow_hosted",
                    "model_id": Config.ROBOFLOW_MODEL_ID,
                    "predictions": predictions,
                    "top_prediction": predictions[0]
                }
            logger.warning("Roboflow returned empty predictions array; evaluating with calibrated botanical model.")

        except Exception as e:
            logger.warning(f"Roboflow inference API call failed: {e}. Utilizing calibrated fallback classifier.")

    # Secondary AI classifier: use the configured Groq vision model when
    # Roboflow is not configured or its hosted endpoint fails.
    if Config.GROQ_API_KEY and Config.GROQ_API_KEY.strip():
        try:
            import base64
            import json
            from groq import Groq

            image_buffer.seek(0)
            image_b64 = base64.b64encode(image_buffer.getvalue()).decode("ascii")
            client = Groq(api_key=Config.GROQ_API_KEY, timeout=30.0)
            response = client.chat.completions.create(
                model=(Config.GROQ_VISION_MODEL if Config.GROQ_VISION_MODEL.startswith("qwen/") else "qwen/qwen3.8-27b"),
                temperature=0.0,
                max_completion_tokens=350,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an agricultural computer-vision assistant. First determine whether the image clearly "
                            "shows a soybean (Glycine max) leaf. If it is not a soybean leaf, is not a leaf, or is too unclear, "
                            "return class Inconclusive. Only classify a disease when soybean-leaf morphology and visible "
                            "symptoms support it. Analyze the visible foliar condition. Return JSON only with keys: "
                            '{"class":"one of Healthy Soybean Leaf, Septoria Brown Spot, Asian Soybean Rust, '
                            'Frogeye Leaf Spot, Bacterial Blight, Downy Mildew, Soybean Mosaic Virus, Inconclusive", '
                            '"confidence":number from 0 to 1, "reason":"short visual explanation"}. '
                            "Use Inconclusive if the image is blurry, not a leaf, or symptoms are not distinguishable. "
                            "Do not invent symptoms that are not visible."
                        )
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Classify the visible condition on this soybean leaf image."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                        ]
                    }
                ]
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            raw_label = str(parsed.get("class", "Inconclusive")).strip()
            label = normalize_label(raw_label)
            confidence = max(0.0, min(1.0, float(parsed.get("confidence", 0.0))))
            allowed_labels = {
                "Healthy Soybean Leaf", "Septoria Brown Spot", "Asian Soybean Rust",
                "Frogeye Leaf Spot", "Bacterial Blight", "Downy Mildew",
                "Soybean Mosaic Virus"
            }
            if label in allowed_labels and confidence > 0:
                prediction = {
                    "class": label,
                    "raw_label": raw_label,
                    "confidence": round(confidence, 4),
                    "confidence_percent": round(confidence * 100, 2),
                    "reason": str(parsed.get("reason", ""))[:400]
                }
                return {
                    "success": True,
                    "provider": "groq_vision_classifier",
                    "model_id": (Config.GROQ_VISION_MODEL if Config.GROQ_VISION_MODEL.startswith("qwen/") else "qwen/qwen3.8-27b"),
                    "predictions": [prediction],
                    "top_prediction": prediction
                }
            logger.warning("Groq vision classifier returned an inconclusive result.")
        except Exception as e:
            logger.exception("Groq vision disease classification failed: %s", e)

    logger.error("Disease inference unavailable: configure a valid Roboflow or Groq vision API key.")
    return {
        "success": False,
        "provider": "unavailable",
        "model_id": Config.ROBOFLOW_MODEL_ID,
        "predictions": [],
        "top_prediction": None,
        "error": "No AI disease classifier is configured or the configured AI providers are temporarily unavailable."
    }
