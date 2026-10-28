import logging
from config import Config
from services.agri_guidance import get_agricultural_guidance

logger = logging.getLogger(__name__)

def evaluate_final_decision(verification: dict, inference: dict) -> dict:
    """
    STAGE D: Cross-Checking and Final Rule-Based Decision Engine
    Combines evidence from leaf verification, disease classifier scores, and thresholds.
    Ensures that non-soybean images are never diagnosed and uncalibrated scores are not fabricated.
    """
    verif_status = verification.get("status", "UNCERTAIN")
    verif_reason = verification.get("reason", "")
    
    # Policy Rule 1: Rejected Non-Soybean Images
    if verif_status == "NOT_SOYBEAN_LEAF":
        return {
            "success": True,
            "detected": False,
            "decision": "NOT_SOYBEAN_LEAF",
            "status": "not_soybean_leaf",
            "message": "This image was rejected because it does not appear to contain a soybean leaf. Please upload a clear photo of a soybean leaf only.",
            "verification": verification,
            "disease": None,
            "confidence": 0.0,
            "confidence_percent": 0.0,
            "predictions": [],
            "causes": [],
            "actions": [
                "Upload a close-up photograph of a soybean leaf taken in natural light.",
                "Ensure the camera is focused on the leaf surface and symptoms.",
                "Avoid photographs showing human faces, pets, vehicles, or unrelated plants."
            ],
            "fertilizer_note": "No fertilizer or crop recommendation is provided for non-soybean images.",
            "ai_disclaimer": "Automated verification rejected this image."
        }

    # Policy Rule 2: Uncertain Leaf Verification
    if verif_status == "UNCERTAIN" and verification.get("provider") == "groq_vision":
        return {
            "success": True,
            "detected": False,
            "decision": "UNCERTAIN",
            "status": "uncertain_image",
            "message": "The uploaded leaf photo could not be verified with confidence as a soybean leaf. Retake a sharp, close-up photograph.",
            "verification": verification,
            "disease": None,
            "confidence": 0.0,
            "confidence_percent": 0.0,
            "predictions": [],
            "causes": ["Image blur, poor lighting, unusual angle, or non-typical leaf structure."],
            "actions": [
                "Position the camera 15-25 cm from the affected soybean leaf.",
                "Capture the image in bright daylight without heavy shadows or glare.",
                "Inspect whether visible symptoms match soybean leaf spot, rust, or blight."
            ],
            "fertilizer_note": "Do not alter fertilizer application based on an uncertain leaf image.",
            "ai_disclaimer": "Specimen species could not be verified."
        }

    predictions = inference.get("predictions", [])
    if not predictions:
        return {
            "success": True,
            "detected": False,
            "decision": "NO_PREDICTION",
            "status": "no_prediction",
            "message": "The leaf verification passed, but the disease classifier produced no conclusive predictions.",
            "verification": verification,
            "disease": None,
            "confidence": 0.0,
            "confidence_percent": 0.0,
            "predictions": [],
            "causes": [],
            "actions": ["Retake the photo in direct daylight showing both upper and lower leaf surfaces."],
            "fertilizer_note": "No fertilizer guidance is available without a confirmed prediction."
        }

    top_pred = predictions[0]
    disease_label = top_pred.get("class", "Unspecified Condition")
    confidence = top_pred.get("confidence", 0.0)
    confidence_pct = top_pred.get("confidence_percent", round(confidence * 100, 2))

    # Policy Rule 3: Low Classifier Confidence
    min_thresh = Config.MIN_PREDICTION_CONFIDENCE
    if confidence < min_thresh:
        guidance = get_agricultural_guidance(disease_label, confidence_pct)
        return {
            "success": True,
            "detected": False,
            "decision": "LOW_CONFIDENCE",
            "status": "low_confidence",
            "message": f"The model detected possible symptoms of {disease_label}, but confidence ({confidence_pct}%) is below the reliable threshold ({min_thresh*100:.0f}%). Expert verification is advised.",
            "verification": verification,
            "disease": disease_label,
            "confidence": confidence,
            "confidence_percent": confidence_pct,
            "predictions": predictions,
            "causes": guidance.get("causes", []),
            "actions": [
                "Take 3-4 additional photos from different angles in the field.",
                "Seek on-site visual confirmation from an agricultural extension officer or agronomist.",
                "Do not apply synthetic chemical treatments based on low-confidence predictions."
            ],
            "fertilizer_note": "Never adjust fertilizer application based on a low-confidence preliminary image result.",
            "ai_disclaimer": guidance.get("ai_disclaimer", "")
        }

    # Policy Rule 4: Verified Preliminary Prediction
    guidance = get_agricultural_guidance(disease_label, confidence_pct)

    return {
        "success": True,
        "detected": True,
        "decision": "PRELIMINARY_PREDICTION",
        "status": "prediction_available",
        "disease": disease_label,
        "scientific_name": guidance.get("scientific_name"),
        "confidence": confidence,
        "confidence_percent": confidence_pct,
        "predictions": predictions,
        "verification": verification,
        "explanation": guidance.get("explanation"),
        "ai_explanation": guidance.get("ai_explanation"),
        "symptoms": guidance.get("symptoms"),
        "causes": guidance.get("causes", []),
        "environmental_factors": guidance.get("environmental_factors"),
        "actions": guidance.get("crop_management", []),
        "monitoring_steps": guidance.get("monitoring_steps", []),
        "fertilizer_note": guidance.get("fertilizer_note"),
        "expert_contact": guidance.get("expert_contact"),
        "ai_disclaimer": guidance.get("ai_disclaimer"),
        "message": f"Preliminary prediction: {disease_label} ({confidence_pct}% confidence). Review guidance and confirm symptoms before acting."
    }
