# SOYA-CARE security and reliability audit

Audit branch: `soyacare-complete-repair`
Base branch: `main`
Scope reviewed: tracked frontend and backend source files visible in the repository tree, with targeted inspection of authentication, scan/report APIs, expert review, support tickets, admin APIs, image verification, inference fallback, and dashboard error handling.

## Changes made on this branch

1. **Prevented public privilege escalation**: public registration always creates a FARMER. EXPERT and ADMIN roles must be assigned through protected administrator provisioning/role-management.
2. **Protected scan history**: scan/report list now requires authentication; farmers are scoped to their own records, while EXPERT/ADMIN can review the wider queue.
3. **Protected expert review requests**: a signed-in farmer can request review only for their own report.
4. **Protected expert decisions**: review endpoint requires EXPERT or ADMIN; it validates the report ID and only accepts pending review records. A negative decision is stored as rejected rather than reviewed.
5. **Protected report detail and PDF**: requires authentication and report ownership, except EXPERT/ADMIN.
6. **Protected support operations**: ticket list/create/reply/status endpoints require authentication; only ticket owners or EXPERT/ADMIN can reply; only EXPERT/ADMIN can change ticket status.
7. **Restricted map data**: map report endpoint requires EXPERT/ADMIN and synthetic example map points were removed.
8. **Removed a known default administrator password**: database initialization no longer seeds an account with a hard-coded password. Use a configured secret for bootstrap or the management CLI.
9. **Removed fabricated AI outputs**: frontend no longer returns a hard-coded disease diagnosis when backend is offline; backend no longer reports a color heuristic as a trained disease classifier; local color screening now returns UNCERTAIN instead of claiming soybean species verification.
10. **Corrected misleading UI success states**: farmer expert-request and expert-review screens now show API errors instead of claiming failed actions succeeded. Admin dashboard no longer displays fabricated analytics when API loading fails.
11. **Updated backend authorization tests**: admin test account is provisioned directly in test setup, and tests cover public role escalation and unauthenticated scan-history access.

## Important findings still requiring configuration or follow-up

- **AI models are not verified by this code audit.** Configure valid Groq Vision and Roboflow credentials/model IDs in the backend hosting environment. Without them, the application will now return uncertain/unavailable rather than inventing a disease label.
- **Species verification requires a real trained/hosted model.** A green-colour heuristic cannot distinguish soybean from other plants.
- **Expert workflow needs end-to-end UI testing.** Confirm the expert queue displays only pending requests, the approve/reject controls match the backend semantics, and the farmer sees the final decision only after the expert action. Existing UI components still need a full browser run against the deployed database.
- **Admin feature coverage is not complete.** Existing backend supports summary, user listing, role changes, and audit logs. User deletion, expert credential verification, system settings, backup/restore, and other privileged operations were not added because they need explicit product rules and careful safeguards.
- **Persistence on Render must be checked.** If SQLite is stored on an ephemeral filesystem, records can be lost on redeploy/restart. Configure a persistent disk or move to managed PostgreSQL and migrate data before relying on production records.
- **Secrets must be set in Render environment variables**: stable high-entropy `SECRET_KEY` and `JWT_SECRET`, Groq/Roboflow API keys, correct frontend origin/CORS, and database path. Never commit real secrets.
- **Third-party OAuth** needs provider-side verification and configured client IDs; do not rely on placeholder/fallback identity payloads for production.
- **Agronomic treatment content** should be reviewed against current local agricultural extension/ICAR recommendations and registered product labels before farmers act on it.

## Verification status

- GitHub source edits were committed to the repair branch.
- Automated tests, TypeScript production build, live API authorization checks, and Render deployment have **not** been run from this environment.
- Therefore this is a targeted code remediation and audit report, **not a certification that every application bug or vulnerability is fixed**.

## Local validation commands

Backend (from repository root):
```cmd
cd backend
python -m pip install -r requirements.txt
python -m pytest -q
```

Frontend:
```cmd
cd frontend
npm ci
npm run build
```

Test with separate FARMER, EXPERT, and ADMIN accounts. Confirm unauthenticated requests return 401, farmer access to another farmer's report returns 403, only EXPERT/ADMIN can approve/reject, and a failed API call never produces a success message.
