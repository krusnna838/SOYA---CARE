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
from database import init_db

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

    # Register Admin
    admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/register", json={
        "name": "Admin Chief",
        "email": admin_email,
        "password": "Password123!",
        "role": "ADMIN"
    })
    a_login = client.post("/api/auth/login", json={"email": admin_email, "password": "Password123!"})
    admin_token = a_login.get_json()["token"]

    # Farmer attempts admin summary
    denied_resp = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {farmer_token}"})
    assert denied_resp.status_code == 403

    # Admin accesses admin summary
    ok_resp = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert ok_resp.status_code == 200
    assert "users" in ok_resp.get_json()

# -------------------------------------------------------------
# 3. PREDICTION & IMAGE PIPELINE TESTS
# -------------------------------------------------------------
def test_predict_empty_image(client):
    """Reject empty/missing image."""
    resp = client.post("/api/predict", json={})
    assert resp.status_code == 400

def test_predict_with_valid_image(client):
    """Test full pipeline with a generated foliar image."""
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

# -------------------------------------------------------------
# 4. REPORTS & PDF DOWNLOAD TESTS
# -------------------------------------------------------------
def test_pdf_report_download(client):
    """Test generating a report and downloading its PDF."""
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
    report_id = pred_data.get("report_id") or 1

    # Download PDF
    pdf_resp = client.get(f"/api/reports/{report_id}/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.mimetype == "application/pdf"
    assert len(pdf_resp.data) > 500
