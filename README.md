# SoybeanCare AI Premium 🌿🔬
### Complete AI-Powered Soybean Leaf Disease Detection & Farmer Assistance Platform

A production-grade, full-stack agricultural AI system designed for soybean leaf verification, disease classification, ICAR-aligned management recommendations, soil & fertilizer safety guidance, and interactive dashboards for both Farmers and Administrators.

---

## 🚀 Quick Launch (1-Click)

The easiest way to start both Backend and Frontend together:
- **Windows Batch:** Double-click [`run_all.bat`](run_all.bat)
- **PowerShell:** Run `.\run_all.ps1`

Or run them individually:
- **Backend API (Port 5000):** Double-click [`run_backend.bat`](run_backend.bat) or run `.\run_backend.ps1`
- **Frontend UI (Port 5173):** Double-click [`run_frontend.bat`](run_frontend.bat) or run `.\run_frontend.ps1`
- **Run Tests:** Double-click [`run_tests.bat`](run_tests.bat) or run `.\run_tests.ps1`

---

## 🌐 URLs & Service Ports
- **Farmer Dashboard & Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **API Health Check:** [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

---

## 🔐 Default Access Credentials

The SQLite database (`backend/soybeancare.db`) includes initialized accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@soybeancare.ai` | `SoybeanAdmin2026!` | Admin Dashboard, GIS Geospatial Map, RBAC User Manager, Audit Logs, Health |
| **Demo Farmer** | `farmer@soybeancare.ai` | `Farmer123!` | Leaf Scanner, Camera Mode, GPS Tagging, Treatment Plans, PDF Reports |

---

## 🧬 4-Stage Image Analysis Pipeline

1. **Stage A — Image Validation:** File magic byte inspection (`JPEG`, `PNG`, `WEBP`), EXIF phone camera rotation normalization, 10MB limit enforcement, thumbnail generation.
2. **Stage B — Soybean Leaf Verification:** Groq Vision API inspection for trifoliolate leaf structure and morphology. Rejects non-soybean images (faces, animals, vehicles, irrelevant plants).
3. **Stage C — Disease Classification:** Roboflow Inference SDK (`soybean-crop-disease/6`) with botanical calibrated fallback.
4. **Stage D — Cross-Checking & Final Decision:** Rule-based decision engine (`PRELIMINARY_PREDICTION`, `NOT_SOYBEAN_LEAF`, `UNCERTAIN`, `LOW_CONFIDENCE`) preventing false certainty.

---

## 🧪 Automated Testing

Run the test suite directly:
```powershell
.\run_tests.ps1
```
All 7 unit & integration tests verify:
1. Root `GET /` service status
2. `GET /api/health` connectivity
3. Farmer registration and JWT login
4. Admin RBAC endpoint protection
5. Empty and corrupt upload rejection
6. 4-Stage leaf analysis inference
7. ReportLab A4 downloadable PDF generation
