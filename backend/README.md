# Portfolio API (Spring Boot)

Dynamic portfolio CMS backend: public content endpoints + JWT-protected admin CRUD.
Spring Boot 4.1 · Java 21 · PostgreSQL 17 · Flyway · Spring Security (JWT) · Hibernate 7.

## Run locally

```bash
# 1. Postgres (or: docker compose up -d db  from the repo root)
createdb portfolio

# 2. Configure
cp .env.example .env       # fill in JWT_SECRET (openssl rand -base64 48), ADMIN_EMAIL, ADMIN_PASSWORD
set -a; source .env; set +a

# 3. Run (Flyway migrates + seeds sample content on first boot)
mvn spring-boot:run
```

API on `http://localhost:8080`. Health: `GET /api/health`.

## Tests

```bash
createdb portfolio_test    # once; tests use the "test" Spring profile
mvn test                   # 24 integration tests (auth, CRUD, uploads, validation, cascade)
```

## Docker

```bash
docker build -t portfolio-api .
docker run -p 8080:8080 --env-file .env portfolio-api
```

## API overview

All responses use the envelope `{ "data": …, "error": null }` / `{ "data": null, "error": { code, message, details } }`.

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /api/health` | public | `{status, version, db}` |
| `POST /api/auth/login` | public | `{email,password}` → `{token, expiresAt, user}` |
| `GET /api/auth/me` | JWT | token check |
| `GET/PUT /api/profile` | GET public, PUT JWT | single-row hero content |
| `GET /api/projects?page&size&tag` | public | paginated; `tag` uses Postgres array containment |
| `GET/POST/PUT/DELETE /api/projects[/{id}]` | GET public, rest JWT | |
| `GET /api/education` + CRUD | GET public, rest JWT | |
| `GET /api/achievements?category` + CRUD | GET public, rest JWT | |
| `GET /api/extracurricular` + CRUD | GET public, rest JWT | |
| `GET /api/blogs?page&size` | public | paginated summaries |
| `GET /api/blogs/{id}` | public | detail incl. ordered `photos[]` |
| `POST/PUT/DELETE /api/blogs[/{id}]` | JWT | delete cascades photos |
| `POST/PUT/DELETE /api/blogs/{id}/photos[/{photoId}]` | JWT | nested photo management |
| `PATCH /api/blogs/{id}/photos/reorder` | JWT | `{orderedIds:[…]}` |
| `POST /api/uploads` | JWT | multipart `file`; jpeg/png/webp/gif, ≤5 MB |

## Storage drivers

`STORAGE_DRIVER=local` (dev; files in `UPLOAD_DIR`, served at `/uploads/**`) or
`STORAGE_DRIVER=cloudinary` (production — Render's free tier has no persistent disk).
Cloudinary needs `CLOUDINARY_URL=cloudinary://key:secret@cloud-name`.

## Configuration

Every setting comes from the environment — see `.env.example` for the full list.
Required for a real deployment: `DATABASE_URL`, `JWT_SECRET` (≥32 chars),
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ALLOWED_ORIGINS`, `STORAGE_DRIVER` (+ Cloudinary vars).

## Notes

- Single seeded admin (`SeedService`); no public registration. Sample content is inserted
  on first boot when `SEED_SAMPLE_DATA=true` and the DB is empty.
- Migrations: `src/main/resources/db/migration` (Flyway). Hibernate runs with `ddl-auto: validate`.
- Spring Boot 4 specifics: web starter is `spring-boot-starter-webmvc`, Flyway auto-config comes
  from the `spring-boot-flyway` module, MockMvc test annotations live in `spring-boot-webmvc-test`.
