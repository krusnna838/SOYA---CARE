import json
import logging
from config import Config

logger = logging.getLogger(__name__)

# ICAR (Indian Council of Agricultural Research) and State Agricultural University Reference Knowledge Base
ICAR_DISEASE_KNOWLEDGE = {
    "Septoria Brown Spot": {
        "scientific_name": "Septoria glycines",
        "explanation": "Septoria Brown Spot is an early to mid-season fungal foliar infection that primarily affects the lower plant canopy under humid, warm microclimates.",
        "symptoms": "Irregular, angular dark-brown spots ranging from 1 to 5 mm on unifoliate and lower trifoliate leaves. Surrounding tissue exhibits yellowing (chlorosis), leading to early defoliation.",
        "causes": [
            "Fungal inoculum overwintering on unburied soybean crop residue from the previous harvest.",
            "Splash dispersal of conidia spores from soil level onto lower leaves during rainfall or overhead irrigation.",
            "Prolonged leaf wetness exceeding 6-8 continuous hours at temperatures between 24°C and 30°C."
        ],
        "environmental_factors": "High canopy humidity (>80%), frequent rain showers, dense plant spacing restricting canopy airflow.",
        "monitoring_steps": [
            "Scout lower leaves every 5-7 days starting from early vegetative (V3) through flowering (R1).",
            "Check whether brown spots are restricted to the bottom 1/3 of the plant or advancing upward.",
            "Record recent rain events and leaf wetness duration."
        ],
        "crop_management": [
            "Practice a 2-year field crop rotation with non-hosts such as maize, sorghum, or pearl millet.",
            "Utilize certified pathogen-free seed treated with bio-fungicides or registered seed dressings.",
            "Incorporate crop residues after harvest via tillage where soil conservation practices permit."
        ],
        "expert_contact": "Consult your local Krishi Vigyan Kendra (KVK) or state agricultural extension officer if lesions ascend into the upper reproductive canopy (R3-R5 stage).",
        "fertilizer_note": "CRITICAL SOIL NOTE: Do not apply synthetic fertilizers or fungicides without confirming symptoms. Soybean fixes its own nitrogen through root nodules; excess nitrogen application suppresses nodulation and exacerbates foliar fungal susceptibility. Base all phosphorus, potassium, and sulfur applications strictly on a certified soil test report."
    },
    "Asian Soybean Rust": {
        "scientific_name": "Phakopsora pachyrhizi",
        "explanation": "Asian Soybean Rust is an aggressive, airborne fungal disease that causes rapid yellowing, severe premature defoliation, and significant yield loss if left unmanaged.",
        "symptoms": "Minute, tan to reddish-brown polygonal lesions on leaf undersides with tiny raised blister-like pustules (uredinia) that erupt and shed powdery spores.",
        "causes": [
            "Windborne fungal spores transported across regional agro-climatic corridors.",
            "Extended leaf moisture (minimum 6-10 hours) combined with moderate temperatures between 18°C and 28°C.",
            "Presence of alternative leguminous host plants in surrounding field borders."
        ],
        "environmental_factors": "Persistent cloud cover, high atmospheric humidity (>75%), and intermittent light rainfall during flowering and pod development.",
        "monitoring_steps": [
            "Inspect the underside of leaves in the middle and lower canopy using a 10x-20x hand lens.",
            "Monitor regional agricultural university rust sentinel plot bulletins and weather warnings weekly.",
            "Check field borders and low-lying, humid depressions first."
        ],
        "crop_management": [
            "Plant recommended early-maturing cultivars to reach pod maturity before peak regional spore showers.",
            "Ensure optimal plant row spacing to improve canopy ventilation and reduce humidity buildup.",
            "Coordinate preventive management timing with neighboring farmers and extension alerts."
        ],
        "expert_contact": "URGENT ACTION: Asian Soybean Rust spreads rapidly. Contact your nearest agricultural university plant pathology department or district extension officer immediately for physical sample verification.",
        "fertilizer_note": "CRITICAL SOIL NOTE: Rust cannot be cured or prevented with fertilizers. Over-fertilizing with nitrogen promotes lush foliage that creates an ideal microclimate for rust proliferation. Ensure adequate soil potassium and sulfur levels as verified by soil testing to support overall plant structural resilience."
    },
    "Frogeye Leaf Spot": {
        "scientific_name": "Cercospora sojina",
        "explanation": "Frogeye Leaf Spot is a foliar fungal disease that causes circular to angular lesions with distinctive colored borders on upper leaves during warm, wet weather.",
        "symptoms": "Lesions begin as small dark spots, expanding into circular or angular spots (1-5 mm) with grayish-tan centres and narrow, dark reddish-purple borders.",
        "causes": [
            "Seedborne infection or fungal survival in infected soybean crop debris.",
            "Rain-splash dispersal onto emerging vegetative and reproductive foliage.",
            "Warm, humid weather (28°C to 32°C) coupled with frequent dews."
        ],
        "environmental_factors": "Warm daytime temperatures, high relative humidity, and canopy condensation.",
        "monitoring_steps": [
            "Scout upper canopy leaves during flowering (R1) through beginning seed (R5).",
            "Note the diameter and margin color of spots to distinguish from herbicide injury or Septoria."
        ],
        "crop_management": [
            "Plant certified soybean varieties carrying resistance genes (e.g. Rcs3).",
            "Adopt minimum 1-2 year crop rotation with non-host grain crops.",
            "Avoid planting farm-saved seed harvested from infected fields."
        ],
        "expert_contact": "Consult your agricultural extension agent to verify whether QoI fungicide resistance is present in your local district before planning foliar interventions.",
        "fertilizer_note": "CRITICAL SOIL NOTE: Fertilizer adjustments cannot remedy an active Frogeye fungal infection. Maintain balanced soil phosphorus and potassium according to lab soil analysis. Never spray foliar chemical mixtures based on visual suspicion alone."
    },
    "Bacterial Blight": {
        "scientific_name": "Pseudomonas savastanoi pv. glycinea",
        "explanation": "Bacterial Blight is a bacterial infection of soybean leaves that frequently appears following cool, stormy, or windy weather that creates plant micro-wounds.",
        "symptoms": "Small, water-soaked, translucent angular yellow spots that turn brown and necrotic with distinct chlorotic halos. Centres fall out, giving leaves a tattered, torn appearance.",
        "causes": [
            "Seedborne bacteria and bacterial survival on crop residue.",
            "Infection entering leaves through stomata and wind-induced mechanical abrasions.",
            "Cool, wet weather conditions (20°C to 26°C)."
        ],
        "environmental_factors": "Heavy rainstorms, high winds, hail, and extended periods of cool overcast weather.",
        "monitoring_steps": [
            "Inspect new vegetative growth following severe rain or wind events.",
            "Check for characteristic water-soaked leaf appearance when viewed against sunlight."
        ],
        "crop_management": [
            "Strictly avoid field cultivation or spray operations when leaves are wet to prevent spreading bacteria.",
            "Use certified pathogen-tested seed.",
            "Rotate crops and incorporate infected residues post-harvest."
        ],
        "expert_contact": "Show leaf samples to your local agronomy extension center. Bacterial diseases do not respond to fungal sprays; expert confirmation prevents costly unnecessary treatments.",
        "fertilizer_note": "CRITICAL SOIL NOTE: Never apply extra nitrogen to diseased foliage. Excess vegetative nitrogen makes tissue softer and more vulnerable to bacterial entry. Rely on certified soil test guidelines for soil health maintenance."
    },
    "Healthy Soybean Leaf": {
        "scientific_name": "Glycine max (L.) Merr.",
        "explanation": "The submitted specimen displays healthy soybean foliar characteristics without visible signs of severe fungal, bacterial, or viral pathogens.",
        "symptoms": "Uniform chlorophyll distribution, smooth leaf margins, clean unblemished trifoliate leaflets, and absence of pustules, necrosis, or chlorosis.",
        "causes": [
            "Proper seed selection, adequate soil moisture, and favorable climatic conditions.",
            "Active biological nitrogen fixation via healthy root nodule bacteria (Bradyrhizobium japonicum).",
            "Effective baseline integrated crop and pest management."
        ],
        "environmental_factors": "Balanced solar radiation, adequate soil drainage, and moderate canopy temperature.",
        "monitoring_steps": [
            "Maintain regular weekly field scouting across random field quadrants.",
            "Monitor soil moisture levels and inspect leaf undersides for early pest presence (aphids, mites)."
        ],
        "crop_management": [
            "Avoid unnecessary prophylactic fungicide or insecticide sprays to conserve natural beneficial insect populations.",
            "Maintain weed-free field borders to minimize alternative hosts for plant viruses.",
            "Ensure proper drainage to avoid root hypoxia."
        ],
        "expert_contact": "Continue regular coordination with your district agricultural advisory for seasonal weather forecasts and pest monitoring bulletins.",
        "fertilizer_note": "CRITICAL SOIL NOTE: A healthy leaf photograph reflects current foliar status but cannot assess subsoil nutrient reserves. Obtain a routine biennial soil test for pH, organic carbon, phosphorus, potassium, sulfur, and micronutrients."
    }
}

DEFAULT_GUIDANCE = {
    "scientific_name": "Glycine max foliar pathogen",
    "explanation": "The model has detected foliar symptoms that require on-site confirmation by an agronomy specialist.",
    "symptoms": "Foliar discoloration, necrotic spots, or atypical leaf pigmentation observed in the sample.",
    "causes": [
        "Potential foliar pathogen, insect feeding, or environmental microclimate stress.",
        "Favorable micro-environmental humidity or temperature promoting symptom development."
    ],
    "environmental_factors": "Field moisture, ambient humidity, and temperature variations.",
    "monitoring_steps": [
        "Inspect multiple plants across different areas of the field to determine if symptoms are localized or widespread.",
        "Check both upper and lower leaf surfaces.",
        "Take clear photos of entire plants and root zones for agricultural advisor evaluation."
    ],
    "crop_management": [
        "Follow general integrated crop management guidelines.",
        "Avoid handling or working in the field while plants are wet.",
        "Do not apply chemicals without expert confirmation."
    ],
    "expert_contact": "Take fresh leaf samples to your nearest Krishi Vigyan Kendra (KVK) or university extension office for microscopic confirmation.",
    "fertilizer_note": "CRITICAL SOIL NOTE: A leaf image alone cannot identify soil nutrient deficiencies or safe fertilizer dosages. Soybean is a legume that fixes nitrogen. Always consult a soil test report and official agronomy recommendations before applying any fertilizer."
}

def get_agricultural_guidance(disease_name: str, confidence_percent: float) -> dict:
    """
    Combines ICAR-aligned curated agricultural guidance with AI enrichment
    ensuring strict compliance with safety disclaimers and fertilizer rules.
    """
    base_info = ICAR_DISEASE_KNOWLEDGE.get(disease_name, DEFAULT_GUIDANCE)

    guidance = {
        "disease": disease_name,
        "scientific_name": base_info.get("scientific_name", "Glycine max"),
        "confidence_percent": confidence_percent,
        "explanation": base_info["explanation"],
        "symptoms": base_info["symptoms"],
        "causes": base_info["causes"],
        "environmental_factors": base_info.get("environmental_factors", "High canopy moisture and humidity."),
        "monitoring_steps": base_info["monitoring_steps"],
        "crop_management": base_info["crop_management"],
        "expert_contact": base_info["expert_contact"],
        "fertilizer_note": base_info["fertilizer_note"],
        "ai_disclaimer": (
            "SAFETY DISCLAIMER: This prediction is generated by computer vision decision support tools. "
            "It is a preliminary screening, NOT a verified laboratory or phytosanitary diagnosis. "
            "Visual leaf symptoms can overlap with environmental stress, herbicide drift, or nutritional disorders. "
            "Never apply restricted pesticides, chemical fungicides, or large fertilizer doses based solely on an automated photograph analysis. "
            "Always consult your local Krishi Vigyan Kendra (KVK), state agricultural extension officer, or certified agronomist."
        )
    }

    # If Groq is configured and available, safely enrich the explanation without violating safety rules
    if Config.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=Config.GROQ_API_KEY, timeout=10.0)

            prompt = (
                f"Disease detected: {disease_name}. Model confidence: {confidence_percent}%. "
                "Provide a brief, 2-sentence farmer-friendly explanation. "
                "RULES: 1. Do not prescribe exact chemical doses or pesticide brand names. "
                "2. State that this is a preliminary visual screening. "
                "3. Emphasize that soybean fertilizer must be guided by a soil test. "
                "4. Distinguish possible causes from confirmed facts."
            )

            resp = client.chat.completions.create(
                model=Config.GROQ_MODEL,
                temperature=0.2,
                max_tokens=180,
                messages=[
                    {"role": "system", "content": "You are a senior ICAR-trained agronomist explaining soybean health cautiously to farmers."},
                    {"role": "user", "content": prompt}
                ]
            )
            ai_text = resp.choices[0].message.content.strip()
            if ai_text:
                guidance["ai_explanation"] = ai_text
        except Exception as e:
            logger.info(f"Groq LLM explanation skipped: {e}")
            guidance["ai_explanation"] = guidance["explanation"]
    else:
        guidance["ai_explanation"] = guidance["explanation"]

    return guidance
