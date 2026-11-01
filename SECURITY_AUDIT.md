# SOYA-CARE security review — authentication hardening

## Changes in this commit
- Removed the hard-coded administrator password hash from application source. Admin bootstrap now requires private `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables (minimum 12 characters), or an operator must use `python manage.py create-admin`.
- Public registration offers Farmer and Expert. Farmer accounts activate immediately. Expert applicants are stored as `PENDING_EXPERT`, receive no session token, and cannot sign in until an administrator approves them by promoting the account to `EXPERT`.
- Server-side registration accepts only Farmer/Expert requests and never accepts ADMIN or arbitrary roles.
- Login authorization uses the role stored in the database. Pending experts are blocked until approved.
- Removed the Google OAuth fallback that trusted client-supplied email/name. Google login now requires a verified ID token and configured Google client ID.
- Disabled Apple login until server-side Apple identity-token verification is implemented. Client-supplied profile fields are not authentication.
- Increased public password minimum to 12 characters and maximum to 128 characters.

## Required production configuration
1. Set stable, unique, high-entropy `SECRET_KEY` and `JWT_SECRET` values in Render backend environment variables.
2. Set private `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters) in Render, or securely run the management CLI. Never commit secrets.
3. Set exact frontend origin(s) in `FRONTEND_ORIGIN` / `CORS_ORIGINS`; remove unused origins.
4. Use a persistent database volume or managed PostgreSQL. SQLite on ephemeral storage can lose users and reports on redeploy.
5. Configure HTTPS, backups, log retention, dependency updates, and provider credentials in hosting settings.

## Not certified / still needs verification
This is a targeted source-level hardening pass, not a full penetration test. Automated pytest, frontend TypeScript build, live login/role checks, rate-limit testing, hosting configuration, database persistence, OAuth provider setup, and expert workflow end-to-end checks were not run here. Add request throttling / lockout and email verification before public production use. Verify expert credentials manually before promotion.
