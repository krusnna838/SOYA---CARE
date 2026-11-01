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

## 🔐 Account provisioning and security

There are no public default administrator or demo-user credentials. To create the first administrator on Render, set the private environment variables `ADMIN_EMAIL`, `ADMIN_NAME` (optional), and `ADMIN_PASSWORD` (12–128 characters). On startup, the backend creates this account only if no administrator exists. It never promotes or overwrites an existing Farmer or Expert account, and it never resets an existing administrator's password. Alternatively, run `python manage.py create-admin --name "SoybeanCare Administrator" --email "admin@example.com"` in the trusted Render Shell; the password is entered interactively and is not exposed in shell history.

After first-admin creation, you may remove `ADMIN_PASSWORD` from Render only if the database is persistent. Configure a Render persistent disk and set `DATABASE_PATH` to a file on that disk (for example `/var/data/soybeecare.db`), otherwise SQLite accounts can be lost when the service is redeployed or restarted. Never commit passwords, API keys, or production secrets. If a password has appeared in a screenshot or chat, replace it with a new unique password.

Public registration is limited to Farmer and Expert applications. Expert accounts remain pending until an administrator verifies and approves them. Admin accounts cannot be registered publicly.

## 🧬 4-Stage Image Analysis Pipeline

1. **Stage A — Image Validation:** File magic byte inspection (`JPEG`, `PNG`, `WEBP`), EXIF phone camera rotation normalization, 10MB limit enforcement, thumbnail generation.
2. **Stage B — Soybean Leaf Verification:** Groq Vision API inspection for trifoliolate leaf structure and morphology. Rejects non-soybean images (faces, animals, vehicles, irrelevant plants).
3. **Stage C — Disease Classification:** Roboflow hosted inference first, with Groq vision (`qwen/qwen3.8-27b`) as an AI disease-classification fallback.
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


## Render Production Connection

The deployed frontend is configured to use the existing backend service by default:
- Frontend: https://soybeancare-frontend.onrender.com
- Backend API: https://soya-care-2.onrender.com/api
- Backend health: https://soya-care-2.onrender.com/api/health

For the Render frontend service, set the build-time environment variable `VITE_API_BASE_URL` to `https://soya-care-2.onrender.com/api`, then trigger a fresh deploy. For the backend service, set `FRONTEND_ORIGIN` to `https://soybeancare-frontend.onrender.com` and `CORS_ORIGINS` to `https://soybeancare-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173`. Keep existing strong `SECRET_KEY`, `JWT_SECRET`, database path, and AI provider credentials; do not commit secrets to GitHub.
