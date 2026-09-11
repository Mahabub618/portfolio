# Deployment guide — free tiers only

Target topology (all free, no credit card):

```
Vercel (Angular static, https) ──rewrite /api,/uploads──▶ Render (Docker, Spring Boot)
                                                              │ JDBC
                                                              ▼
                                       Neon (Postgres, scale-to-zero)
                                       Cloudinary (uploaded images)
```

Why this shape:
- Render free web services have **no persistent disk** → uploads must go to Cloudinary.
- Render free sleeps after 15 min idle (30–60 s cold start) — acceptable for a portfolio.
- Neon scales to zero and never expires its free tier (unlike Render's old free Postgres).
- Vercel rewrites keep the frontend same-origin: no CORS pain, one public URL.

---

## 0. Accounts to create (I can't do this for you)

| Service | URL | Free tier used | Notes |
|---|---|---|---|
| GitHub | github.com | repo hosting | push this folder as a private repo |
| Neon | neon.tech | 0.5 GB + 100 CU-h/mo, no card | "Skip" any upgrade prompt |
| Render | render.com | 750 h/mo web service | GitHub login |
| Vercel | vercel.com | Hobby 100 GB/mo | GitHub login |
| Cloudinary | cloudinary.com | 25 GB credits | "API Environment variable" on the dashboard |

## 1. Push the repo

```bash
cd portfolio
git init && git add -A && git commit -m "portfolio v1"
git remote add origin git@github.com:<you>/portfolio.git && git push -u origin main
```

(`.env`, `node_modules`, `target/`, `dist/` are gitignored — never commit secrets.)

## 2. Neon → PostgreSQL

1. New project `portfolio` (region closest to you).
2. Dashboard → **Connect** → copy the **pooled** connection string.
3. Create role `portfolio_app` with a strong password.
   Final JDBC URL: `jdbc:postgresql://<host>:5432/portfolio?sslmode=require` (user/password separate).
   Flyway creates the schema and seeds sample content on first boot (`SEED_SAMPLE_DATA=true`).

## 3. Cloudinary → image storage

1. New free account → dashboard → copy the **API Environment variable** (`cloudinary://key:secret@cloud`).
2. That's the whole `CLOUDINARY_URL`.

## 4. Render → API

1. **New ▸ Web Service** → your repo → root directory `backend` → runtime **Docker** (Dockerfile is included).
2. Instance: **Free**.
3. Environment variables:

| Var | Value |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://<neon-host>:5432/portfolio?sslmode=require` |
| `DATABASE_USER` | `portfolio_app` |
| `DATABASE_PASSWORD` | *(the password from step 2)* |
| `JWT_SECRET` | already generated in `deploy/prod-secrets.env` (gitignored) |
| `ADMIN_EMAIL` | your real email |
| `ADMIN_PASSWORD` | already generated in `deploy/prod-secrets.env` (stated once in chat) |
| `JWT_TTL_MINUTES` | `120` |
| `RESEND_API_KEY` | Resend API key (password-recovery emails; from resend.com) |
| `EMAIL_FROM` | `Portfolio <onboarding@resend.dev>` (free plan: sends only to the Resend account email) |
| `FRONTEND_URL` | `https://<your-vercel-domain>.vercel.app` (base for reset links) |
| `CORS_ALLOWED_ORIGINS` | `https://<your-vercel-domain>.vercel.app` |
| `STORAGE_DRIVER` | `cloudinary` |
| `CLOUDINARY_URL` | from step 3 |
| `CLOUDINARY_FOLDER` | `portfolio` |
| `PUBLIC_BASE_URL` | `https://<your-vercel-domain>.vercel.app` |
| `SEED_SAMPLE_DATA` | `true` (flip to `false` after first boot if you want) |

4. Deploy → note the URL `https://<name>.onrender.com` (first boot 1–3 min: maven build).

## 5. Vercel → frontend

1. **Add New ▸ Project** → same repo → root `frontend`, framework **Angular** auto-detected
   (build `npx ng build`, output `dist/frontend/browser`).
2. Edit `frontend/vercel.json`: replace both occurrences of
   `REPLACE_WITH_RENDER_SERVICE` with the Render service name from step 4. Commit & push — Vercel redeploys.
3. Visit the Vercel URL.

## 6. Smoke test (public, from any machine)

```bash
SITE=https://<vercel-domain>
curl -s $SITE/ | grep -o '<title>[^<]*</title>'
curl -s $SITE/api/health          # {"data":{"status":"ok",...}}
curl -s -X POST $SITE/api/auth/login -H 'Content-Type: application/json' \
     -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```

Then in a browser: home renders, open a travel blog (scroll story + rail),
`/admin/login` → dashboard, upload one photo (≤ 5 MB) and see it on the gallery.

## 7. Free-tier reality check

- Render sleeps after 15 idle minutes → first API call after a nap takes 30–60 s.
- Vercel Hobby: 100 GB transfer/mo — a portfolio uses a tiny fraction.
- Neon sleeps after ~5 min idle → first query adds ~0.5 s.
- Cloudinary free: 25 GB storage / 25 GB bandwidth/mo — plenty.
- If Render ever drops the free tier: fallbacks are Koyeb free, Fly.io (needs card), or HF Spaces docker.

## 8. After launch

- Change `ADMIN_PASSWORD` by re-seeding or via a new deploy with a different value only while the DB is empty;
  afterwards rotate by updating the bcrypt hash directly in `profile`… (simplest: keep the seeded admin until you add a change-password endpoint).
- Turn `SEED_SAMPLE_DATA=false` and edit everything from `/admin`.
