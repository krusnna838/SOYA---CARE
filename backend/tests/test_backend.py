import io
import json
import uuid
import pytest
from PIL import Image
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from database import init_db, get_db
from werkzeug.security import generate_password_hash

@pytest.fixture
def client(tmp_path):
    test_db = tmp_path / f"test_soybeancare_{uuid.uuid4().hex[:6]}.db"
    test_config = {
        "TESTING": True,
        "DB_PATH": test_db,
        "JWT_SECRET_KEY": "test-jwt-secret-key-12345678901234567890",
        "SECRET_KEY": "test-secret-key-12345678901234567890",
        "MIN_PREDICTION_CONFIDENCE": 0.40
    }
    app = create_app(test_config=test_config)
    with app.app_context():
        init_db(app)
    with app.test_client() as client:
        yield client

def create_test_image_bytes(color=(34, 139, 34), size=(200, 200)):
    """Creates an in-memory sample JPEG image for testing."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

# -------------------------------------------------------------
# 1. CORE & HEALTH TESTS
# -------------------------------------------------------------
def test_root_endpoint_not_404(client):
    """Ensure GET / returns 200 and valid JSON service info, preventing 404."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "online"
    assert "health_endpoint" in data

def test_health_check(client):
    """Ensure GET /api/health returns healthy and database connected."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["database_connected"] is True

# -------------------------------------------------------------
# 2. AUTHENTICATION & AUTHORIZATION TESTS
# -------------------------------------------------------------
def test_user_registration_and_login(client):
    """Test farmer registration, duplicate prevention, and login."""
    unique_email = f"ramesh_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "name": "Ramesh Patel",
        "email": unique_email,
        "password": "StrongPassword123!",
        "role": "FARMER",
        "village": "AgriPur",
        "district": "Indore",
        "state": "Madhya Pradesh"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.get_json()
    assert "token" in reg_data
    assert reg_data["user"]["email"] == unique_email
    token = reg_data["token"]

    # Duplicate registration should return 409
    dup_resp = client.post("/api/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409

    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "StrongPassword123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.get_json()
    assert "token" in login_data

    # Login with wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # Protected me endpoint
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.get_json()["user"]["name"] == "Ramesh Patel"

def test_admin_rbac_protection(client):
    """Ensure farmer cannot access admin endpoints, but admin can."""
    joe_email = f"joe_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/register", json={
        "name": "Farmer Joe",
        "email": joe_email,
        "password": "Password123!",
        "role": "FARMER"
    })
    f_login = client.post("/api/auth/login", json={"email": joe_email, "password": "Password123!"})
    farmer_token = f_login.get_json()["token"]

    # Provision an administrator through the database, not public registration.
    admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    with client.application.app_context():
        conn = get_db()
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'ADMIN', ?)",
            ("Admin Chief", admin_email, generate_password_hash("Password123!"), "2026-01-01T00:00:00+00:00")
        )
        conn.commit()
    a_login = client.post("/api/auth/login", json={"email": admin_email, "password": "Password123!"})
    admin_token = a_login.get_json()["token"]

    # Farmer attempts admin summary
    denied_resp = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {farmer_token}"})
    assert denied_resp.status_code == 403

    # Admin accesses admin summary
    ok_resp = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert ok_resp.status_code == 200
    assert "users" in ok_resp.get_json()


def test_public_registration_cannot_assign_privileged_role(client):
    email = f"role_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post("/api/auth/register", json={
        "name": "Untrusted User", "email": email, "password": "Password123!", "role": "ADMIN"
    })
    assert response.status_code == 400
    assert "Choose either Farmer or Expert" in response.get_json()["error"]
    with client.application.app_context():
        assert get_db().execute(
            "SELECT id FROM users WHERE LOWER(email) = ?", (email,)
        ).fetchone() is None


def test_expert_registration_requires_admin_approval(client):
    email = f"expert_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post("/api/auth/register", json={
        "name": "Pending Expert", "email": email,
        "password": "StrongExpertPass123!", "role": "EXPERT"
    })
    assert response.status_code == 202
    assert response.get_json()["pendingApproval"] is True
    assert response.get_json()["user"]["role"] == "PENDING_EXPERT"

    login = client.post("/api/auth/login", json={
        "email": email, "password": "StrongExpertPass123!", "role": "EXPERT"
    })
    assert login.status_code == 403


def test_login_rejects_mismatched_selected_role(client):
    email = f"farmer_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/auth/register", json={
        "name": "Farmer User", "email": email,
        "password": "StrongFarmerPass123!", "role": "FARMER"
    })
    response = client.post("/api/auth/login", json={
        "email": email, "password": "StrongFarmerPass123!", "role": "ADMIN"
    })
    assert response.status_code == 403


def test_scan_history_requires_authentication(client):
    response = client.get("/api/scans")
    assert response.status_code == 401

# -------------------------------------------------------------
# 3. PREDICTION & IMAGE PIPELINE TESTS
# -------------------------------------------------------------
def test_predict_empty_image(client):
    """Reject empty/missing image."""
    resp = client.post("/api/predict", json={})
    assert resp.status_code == 400

def test_predict_with_valid_image(client, monkeypatch):
    """Test upload prediction without requiring a live external AI key."""
    import app as backend_app
    monkeypatch.setattr(backend_app, "verify_soybean_leaf", lambda image: {
        "status": "UNCERTAIN", "reason": "Test verifier fallback.", "confidence": 0.5,
        "provider": "local_heuristic"
    })
    monkeypatch.setattr(backend_app, "run_disease_inference", lambda image: {
        "success": True, "provider": "test_ai", "model_id": "test-model",
        "predictions": [{"class": "Healthy Soybean Leaf", "confidence": 0.95,
                         "confidence_percent": 95.0}],
        "top_prediction": {"class": "Healthy Soybean Leaf", "confidence": 0.95,
                           "confidence_percent": 95.0}
    })
    img_buf = create_test_image_bytes(color=(34, 139, 34), size=(240, 240))
    data = {
        "image": (img_buf, "test_leaf.jpg"),
        "location": "Indore Agri Zone",
        "latitude": "22.7196",
        "longitude": "75.8577"
    }
    resp = client.post("/api/predict", data=data, content_type="multipart/form-data")
    assert resp.status_code == 200
    res_data = resp.get_json()
    assert "verification" in res_data
    assert "predictions" in res_data
    assert "decision" in res_data
    assert res_data["detected"] is True
    assert res_data["scan"]["predictedDisease"] == "Healthy Soybean Leaf"
    assert res_data["scan"]["farmerId"] == "guest"
    assert "report_id" not in res_data

# -------------------------------------------------------------
# 4. REPORTS & PDF DOWNLOAD TESTS
# -------------------------------------------------------------
def test_pdf_report_download(client, monkeypatch):
    """Test generating a report and downloading its PDF without live AI credentials."""
    import app as backend_app
    monkeypatch.setattr(backend_app, "verify_soybean_leaf", lambda image: {
        "status": "UNCERTAIN", "reason": "Test verifier fallback.", "confidence": 0.5,
        "provider": "local_heuristic"
    })
    monkeypatch.setattr(backend_app, "run_disease_inference", lambda image: {
        "success": True, "provider": "test_ai", "model_id": "test-model",
        "predictions": [{"class": "Asian Soybean Rust", "confidence": 0.95,
                         "confidence_percent": 95.0}],
        "top_prediction": {"class": "Asian Soybean Rust", "confidence": 0.95,
                           "confidence_percent": 95.0}
    })
    pdf_email = f"pdf_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/register", json={
        "name": "PDF Farmer",
        "email": pdf_email,
        "password": "Password123!"
    })
    f_login = client.post("/api/auth/login", json={"email": pdf_email, "password": "Password123!"})
    token = f_login.get_json()["token"]

    img_buf = create_test_image_bytes(color=(34, 139, 34))
    pred_resp = client.post(
        "/api/predict",
        data={"image": (img_buf, "leaf.jpg")},
        headers={"Authorization": f"Bearer {token}"},
        content_type="multipart/form-data"
    )
    pred_data = pred_resp.get_json()
    assert pred_resp.status_code == 200
    assert pred_data.get("report_id")
    report_id = pred_data["report_id"]

    # Download PDF
    pdf_resp = client.get(
        f"/api/reports/{report_id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pdf_resp.status_code == 200
    assert pdf_resp.mimetype == "application/pdf"
    assert len(pdf_resp.data) > 500


# -------------------------------------------------------------
# 7. DIAGNOSIS DECISION SAFETY TESTS
# -------------------------------------------------------------
def test_uncertain_leaf_verification_can_use_explicit_ai_classifier_result():
    """When the heuristic is uncertain, a valid vision-classifier result is preliminary evidence."""
    from services.decision_service import evaluate_final_decision

    result = evaluate_final_decision(
        {
            "status": "UNCERTAIN",
            "reason": "Foliage-like colors detected; species not verified.",
            "confidence": 0.50,
            "provider": "local_heuristic",
        },
        {
            "success": True,
            "predictions": [{"class": "Asian Soybean Rust", "confidence": 0.99}],
        },
    )

    assert result["detected"] is True
    assert result["decision"] == "PRELIMINARY_PREDICTION"
    assert result["disease"] == "Asian Soybean Rust"
    assert result["predictions"][0]["class"] == "Asian Soybean Rust"
