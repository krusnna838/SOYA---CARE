import sqlite3
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from flask import g
from werkzeug.security import generate_password_hash
from config import Config

logger = logging.getLogger(__name__)

def get_db():
    if "db" not in g:
        from flask import current_app
        try:
            db_path = Path(current_app.config.get("DB_PATH", Config.DB_PATH))
        except RuntimeError:
            db_path = Config.DB_PATH
        db_path.parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(db_path, timeout=20)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db

def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db(app=None):
    """Initialize database tables and seed baseline diseases and default admin if missing."""
    from flask import current_app
    try:
        app_ctx = app or (current_app._get_current_object() if current_app else None)
        db_path = Path(app_ctx.config.get("DB_PATH", Config.DB_PATH)) if app_ctx else Config.DB_PATH
    except RuntimeError:
        db_path = Config.DB_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path, timeout=20) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        
        # 1. Users table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                role TEXT NOT NULL DEFAULT 'FARMER',
                phone TEXT,
                village TEXT,
                district TEXT,
                state TEXT,
                avatar TEXT,
                created_at TEXT NOT NULL
            );
        """)

        # 2. Reports table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                disease TEXT NOT NULL,
                confidence REAL NOT NULL DEFAULT 0.0,
                explanation TEXT,
                causes_json TEXT NOT NULL DEFAULT '[]',
                actions_json TEXT NOT NULL DEFAULT '[]',
                fertilizer_note TEXT,
                verification_status TEXT DEFAULT 'SOYBEAN_LEAF',
                verification_reason TEXT,
                image_thumbnail_b64 TEXT,
                latitude REAL,
                longitude REAL,
                location_name TEXT,
                model_id TEXT,
                status TEXT DEFAULT 'completed',
                expert_notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. Known Disease Catalog table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS diseases (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                scientific_name TEXT NOT NULL,
                severity TEXT NOT NULL,
                affected_stage TEXT,
                symptoms TEXT NOT NULL,
                causes TEXT NOT NULL,
                chemical_treatment TEXT,
                organic_solution TEXT,
                preventive_tips TEXT NOT NULL DEFAULT '[]',
                recommended_pesticides TEXT NOT NULL DEFAULT '[]',
                images TEXT NOT NULL DEFAULT '[]'
            );
        """)

        # 4. Support Tickets
        conn.execute("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_code TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                farmer_name TEXT NOT NULL,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Medium',
                status TEXT NOT NULL DEFAULT 'Open',
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 5. Ticket Messages
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ticket_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                sender_name TEXT NOT NULL,
                sender_role TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
            );
        """)

        # 6. Audit Logs
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            );
        """)

        conn.commit()

        # Safe migration for user profile extension columns
        for col_name in ["farm_size", "crop_variety", "soil_type", "language", "nationality"]:
            try:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} TEXT DEFAULT '';")
            except sqlite3.OperationalError:
                pass
        conn.commit()

        # Seed Diseases Catalog if empty
        cur = conn.execute("SELECT COUNT(*) FROM diseases")
        if cur.fetchone()[0] == 0:
            seed_diseases(conn)

        # Seed initial admin if specified
        import os
        admin_email = os.getenv("ADMIN_EMAIL", "admin@soybeancare.ai").strip().lower()
        admin_pass = os.getenv("ADMIN_PASSWORD", "SoybeanAdmin2026!")
        admin_name = os.getenv("ADMIN_NAME", "SoybeanCare Admin").strip()
        
        if admin_email and admin_pass:
            existing = conn.execute("SELECT id FROM users WHERE LOWER(email) = ?", (admin_email,)).fetchone()
            if not existing:
                conn.execute(
                    """INSERT INTO users (name, email, password_hash, role, created_at)
                       VALUES (?, ?, ?, 'ADMIN', ?)""",
                    (admin_name, admin_email, generate_password_hash(admin_pass), datetime.now(timezone.utc).isoformat())
                )
                conn.commit()
                logger.info(f"Default administrator initialized: {admin_email}")

def seed_diseases(conn):
    diseases = [
        {
            "id": "d1",
            "name": "Septoria Brown Spot",
            "scientific_name": "Septoria glycines",
            "severity": "medium",
            "affected_stage": "V3 to R6 (Vegetative to Pod Fill)",
            "symptoms": "Small, dark brown irregular spots on lower unifoliate and trifoliate leaves. Leaves gradually turn yellow and drop prematurely from the lower canopy.",
            "causes": "Ascomycete fungus overwintering in unburied crop residues. Promoted by prolonged leaf wetness (rainfall/dew) and warm temperatures between 25°C to 30°C.",
            "chemical_treatment": "Apply strobilurin or triazole fungicides (e.g. Azoxystrobin, Pyraclostrobin) at first appearance during flowering/pod initiation.",
            "organic_solution": "Foliar spray of Copper Octanoate organic soap or biological fungicide Bacillus subtilis (strain QST 713).",
            "preventive_tips": json.dumps([
                "Perform 2-year crop rotation with non-leguminous crops like maize, wheat, or sorghum.",
                "Incorporate crop residue post-harvest through clean tillage to accelerate residue breakdown.",
                "Use certified disease-free, high-vigor soybean seed."
            ]),
            "recommended_pesticides": json.dumps([
                {"name": "Headline EC (Pyraclostrobin)", "dosage": "6-12 fl oz/acre", "timing": "R1 to R3 Growth Stage"},
                {"name": "Quadris (Azoxystrobin)", "dosage": "6.0-15.5 fl oz/acre", "timing": "Early disease onset"}
            ]),
            "images": json.dumps(["https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80"])
        },
        {
            "id": "d2",
            "name": "Asian Soybean Rust",
            "scientific_name": "Phakopsora pachyrhizi",
            "severity": "critical",
            "affected_stage": "R1 to R7 (Flowering to Full Maturity)",
            "symptoms": "Pinpoint reddish-brown to tan polygonal lesions predominantly on leaf undersides, forming raised pustules (uredinia) that release powdery spores.",
            "causes": "Obligate biotrophic fungal spores transported over thousands of kilometers by regional weather fronts. Favored by 12+ hours of dew and 18-28°C temperatures.",
            "chemical_treatment": "Immediate preventive or early curative dual-action fungicide spray containing SDHI + Triazole (e.g., Priaxor or Delaro SC).",
            "organic_solution": "Micronized elemental wettable sulfur foliar sprays or chitosan bio-stimulants applied preventively before spore arrival.",
            "preventive_tips": json.dumps([
                "Plant recommended early-maturing cultivars to escape late-season regional spore peaks.",
                "Scout lower canopy weekly beginning at V5 stage.",
                "Consult regional agricultural university rust alert bulletins."
            ]),
            "recommended_pesticides": json.dumps([
                {"name": "Priaxor (Fluxapyroxad + Pyraclostrobin)", "dosage": "4-8 fl oz/acre", "timing": "Preventive at R1-R3"},
                {"name": "Delaro 325 SC (Prothioconazole + Trifloxystrobin)", "dosage": "8-11 fl oz/acre", "timing": "At first confirmed regional detection"}
            ]),
            "images": json.dumps(["https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80"])
        },
        {
            "id": "d3",
            "name": "Frogeye Leaf Spot",
            "scientific_name": "Cercospora sojina",
            "severity": "high",
            "affected_stage": "V6 to R5 (Late Vegetative to Seed Enlargement)",
            "symptoms": "Circular to angular lesions with tan-to-gray centers bordered by narrow, dark reddish-brown to purple margins. Spots may coalesce under high pressure.",
            "causes": "Fungus surviving in infected seed and crop debris. Spores splash-dispersed by rain during warm, humid weather (28-32°C).",
            "chemical_treatment": "Foliar application of Quinone Outside Inhibitor (QoI) or methyl benzimidazole carbamate (MBC) fungicides where no resistance is documented.",
            "organic_solution": "Foliar neem seed kernel extract (NSKE 5%) or copper hydroxide bio-protective wash.",
            "preventive_tips": json.dumps([
                "Select frogeye-resistant soybean varieties carrying Rcs resistance genes.",
                "Rotate with non-host crops for at least 1-2 seasons.",
                "Ensure thorough seed treatment with registered fungicides."
            ]),
            "recommended_pesticides": json.dumps([
                {"name": "Miravis Top (Pydiflumetofen + Difenoconazole)", "dosage": "13.7 fl oz/acre", "timing": "R3 Growth Stage"}
            ]),
            "images": json.dumps(["https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"])
        },
        {
            "id": "d4",
            "name": "Bacterial Blight",
            "scientific_name": "Pseudomonas savastanoi pv. glycinea",
            "severity": "medium",
            "affected_stage": "Emergence to Pod Filling",
            "symptoms": "Small, water-soaked translucent yellow-brown spots with chlorotic halos. Centres become brown, dry, tear easily, creating a tattered or ragged leaf canopy.",
            "causes": "Seedborne bacterium favored by cool, stormy, rainy weather (22-26°C) and strong winds that cause plant micro-abrasions.",
            "chemical_treatment": "Copper hydroxide or copper oxychloride preventive sprays during vegetative stage if disease threatens young stands.",
            "organic_solution": "Certified organic copper soaps or plant immunity inducers (salicylic acid / seaweed foliar sprays).",
            "preventive_tips": json.dumps([
                "Avoid cultivating or moving machinery through soybean fields while foliage is wet.",
                "Plant certified pathogen-free seed stock.",
                "Avoid overhead sprinkler irrigation where bacterial pressure is chronic."
            ]),
            "recommended_pesticides": json.dumps([
                {"name": "Kocide 3000 (Copper Hydroxide)", "dosage": "0.75-1.25 lbs/acre", "timing": "Early vegetative stage upon symptom appearance"}
            ]),
            "images": json.dumps(["https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80"])
        },
        {
            "id": "d5",
            "name": "Healthy Soybean Leaf",
            "scientific_name": "Glycine max (L.) Merr.",
            "severity": "low",
            "affected_stage": "All Growth Stages",
            "symptoms": "Clean, vibrant green trifoliate leaves with intact margins, uniform chlorophyll distribution, and no necrotic lesions, rust pustules, or chlorotic mottling.",
            "causes": "Well-nourished crop grown under favorable agronomic conditions with adequate drainage, balanced nutrition, and active root nodulation.",
            "chemical_treatment": "No fungicide or bactericide treatment required. Maintain regular field scouting.",
            "organic_solution": "Maintain active soil microbiome through organic matter management and biological nitrogen fixation (Bradyrhizobium japonicum).",
            "preventive_tips": json.dumps([
                "Continue standard integrated pest management (IPM) scouting weekly.",
                "Maintain balanced soil fertility according to a recent ICAR/soil-testing laboratory report.",
                "Avoid prophylactic chemical applications to protect natural beneficial predators."
            ]),
            "recommended_pesticides": json.dumps([]),
            "images": json.dumps(["https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80"])
        }
    ]

    for d in diseases:
        conn.execute("""
            INSERT OR REPLACE INTO diseases 
            (id, name, scientific_name, severity, affected_stage, symptoms, causes, chemical_treatment, organic_solution, preventive_tips, recommended_pesticides, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            d["id"], d["name"], d["scientific_name"], d["severity"], d["affected_stage"],
            d["symptoms"], d["causes"], d["chemical_treatment"], d["organic_solution"],
            d["preventive_tips"], d["recommended_pesticides"], d["images"]
        ))
    conn.commit()
