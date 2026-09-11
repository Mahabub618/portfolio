# Dynamic Personal Portfolio

Single-page Angular portfolio with a full CMS admin panel, backed by a Spring Boot API
and PostgreSQL. All content (projects, education, achievements, extracurricular, travel
blogs + photos) is managed through `/admin` — nothing is hardcoded in the frontend.

| Piece | Stack | Path |
|---|---|---|
| API | Spring Boot 4.1 · Java 21 · PostgreSQL 17 · Flyway · JWT | [`backend/`](backend/) |
| Web | Angular (standalone, signals) · Tailwind | `frontend/` (stage 2) |

## Status

- [x] **Stage 1 — Backend**: full API + auth + admin CRUD + uploads — 34 integration tests passing
- [x] **Stage 2 — Frontend**: public site (hero, sections, travel strip, cinematic travel-detail gallery) — verified headless at desktop + mobile, dark + light
- [x] **Stage 3 — Admin panel**: `/admin` login (JWT guard), dashboard, CRUD for profile /
      projects / education / achievements / activities / travel blogs + photo manager
      (upload ≤ 5 MB, captions, reorder, delete)
- [x] **Stage 4 — Polish & ship**: live on Vercel + Render + Neon + Cloudinary; automated QA
      suites in [`qa/`](qa/); extras: admin password rotation, email password recovery (Resend),
      public mobile menu

**Live:** site `https://portfolio-mahabub-rahmans-projects.vercel.app` · admin `/admin` ·
API `https://portfolio-api-698b.onrender.com`

## Documentation

- **[docs/MAINTENANCE_GUIDE.md](docs/MAINTENANCE_GUIDE.md)** — the owner's guide: dashboards,
  free-tier limits, deploys, backups, secret rotation, troubleshooting playbook
- [DEPLOY.md](DEPLOY.md) — original deployment record (accounts, services, config)
- [qa/README.md](qa/README.md) — automated test suites (run before/after any change)

## Quick start (backend)

```bash
docker compose up -d db
cd backend && cp .env.example .env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
set -a; source .env; set +a
mvn spring-boot:run                  # http://localhost:8080/api/health
```

See `PLAN.md` in the workspace root for the full agreed plan (schema, API contract,
gallery UX direction, palette, hosting).
