# Dynamic Personal Portfolio

Single-page Angular portfolio with a full CMS admin panel, backed by a Spring Boot API
and PostgreSQL. All content (projects, education, achievements, extracurricular, travel
blogs + photos) is managed through `/admin` — nothing is hardcoded in the frontend.

| Piece | Stack | Path |
|---|---|---|
| API | Spring Boot 4.1 · Java 21 · PostgreSQL 17 · Flyway · JWT | [`backend/`](backend/) |
| Web | Angular (standalone, signals) · Tailwind | `frontend/` (stage 2) |

## Status

- [x] **Stage 1 — Backend**: full API + auth + admin CRUD + uploads, 24 integration tests passing, verified locally
- [x] **Stage 2 — Frontend**: public site (hero, sections, travel strip, cinematic travel-detail gallery) — verified headless at desktop + mobile, dark + light
- [x] **Stage 3 — Admin panel**: `/admin` login (JWT guard), dashboard, CRUD for profile /
      projects / education / achievements / activities / travel blogs + photo manager
      (upload ≤ 5 MB, captions, reorder, delete) — 27 headless checks passing
- [~] **Stage 4 — Polish**: public + admin regression green, bundle audited, screenshots;
      deploy configs ready (`backend/Dockerfile`, `frontend/vercel.json`, `DEPLOY.md`) —
      live deploy pending hosting accounts (see DEPLOY.md §0)

## Quick start (backend)

```bash
docker compose up -d db
cd backend && cp .env.example .env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
set -a; source .env; set +a
mvn spring-boot:run                  # http://localhost:8080/api/health
```

See `PLAN.md` in the workspace root for the full agreed plan (schema, API contract,
gallery UX direction, palette, hosting).
