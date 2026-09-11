# Maintenance Guide — Portfolio Site

A practical guide for keeping the site alive, healthy, and secure. Written for the
site owner — no engineering background assumed. If you only read one section, read
**§1 The big picture** and keep **§12 Quick reference card** handy.

> Companion docs: `README.md` (project overview) · `DEPLOY.md` (original deployment
> record) · `qa/README.md` (automated test suites) · `backend/README.md` and
> `frontend/README.md` (code-level setup).

---

## 1. The big picture

Your site is assembled from five free cloud services plus GitHub. Each has one job:

```
 Visitor's browser
      │
      ▼
 ┌─────────────┐   serves the Angular app, forwards /api/* calls
 │   VERCEL    │──────────────────────────────────────┐
 └─────────────┘                                      ▼
                                              ┌──────────────┐
        Images are loaded directly            │    RENDER    │  Spring Boot API
        from Cloudinary by the browser        │ portfolio-api│  (all business logic)
                                              └──────┬───────┘
      ┌──────────────┐        ┌───────────┐          │
      │  CLOUDINARY  │◀───────│  RESEND   │◀── emails│
      │ image storage│ uploads└───────────┘  (password resets)
      └──────────────┘                               │
                                              ┌──────▼───────┐
                                              │    NEON      │  PostgreSQL database
                                              │  (all data)  │  (content, admin account)
                                              └──────────────┘

 Source code: github.com/Mahabub618/portfolio  (public repo — contains NO secrets)
```

| Service | What it does | What breaks if it dies |
|---|---|---|
| **Vercel** | Hosts the website (frontend) | Site won't load at all |
| **Render** | Runs the API (backend) | Site loads but is empty; admin can't log in |
| **Neon** | Stores all data (projects, blogs, profile, admin account) | API errors; nothing can be read or saved |
| **Cloudinary** | Stores all uploaded images | Images break; uploads fail |
| **Resend** | Sends password-reset emails | Only the "forgot password" flow stops working |
| **GitHub** | Stores the source code | Nothing breaks today; you lose the ability to rebuild/change |

**Key mental model:** editing content in the admin panel (`/admin`) changes the
**database** — it goes live instantly and needs *no deployment*. Deployments are
only needed when the *code itself* changes.

---

## 2. Your accounts and dashboards

| Service | Dashboard | Sign in with |
|---|---|---|
| Vercel | `vercel.com/mahabub-rahmans-projects/portfolio` | your Vercel account |
| Render | `dashboard.render.com` → service **portfolio-api** | your Render account |
| Neon | `console.neon.tech` → project **ep-fragrant-art-axwmm6ga** (US East, Ohio) | your Neon account |
| Cloudinary | `console.cloudinary.com` → cloud **n4vjfxzr** | your Cloudinary account |
| Resend | `resend.com` → dashboard | `gravityanti028@gmail.com` |
| GitHub | `github.com/Mahabub618/portfolio` | your GitHub account |

Live URLs:

- Site: `https://portfolio-mahabub-rahmans-projects.vercel.app`
- Admin panel: `https://portfolio-mahabub-rahmans-projects.vercel.app/admin`
- API: `https://portfolio-api-698b.onrender.com`
- API health check: `https://portfolio-api-698b.onrender.com/api/health`
  → a healthy response looks like `{"data":{"status":"ok",...,"db":"up"}}`

> **Tip:** log into all six dashboards once now and bookmark them. If you ever
> forget an account password, every one of these services has its own account
> recovery — that is separate from your portfolio admin password.

---

## 3. Day-to-day: updating content (no deploy needed)

All content lives in the database and is edited in the admin panel:

1. Go to `/admin` and sign in.
2. Edit profile, projects, education, achievements, activities, travel blogs,
   and images from the sidebar pages.
3. Changes are live the moment you save.

Related admin tasks:

- **Change your password:** sidebar → **Security (⚙)**.
- **Forgot your password:** on the sign-in page click **Forgot password?** — a
  one-time link is emailed to `gravityanti028@gmail.com` (valid 15 minutes,
  single use, max 3 emails per 10 minutes).

Nothing else in this guide is needed for routine content work.

---

## 4. Know your free-tier limits

These were verified at launch (September 2026). Free tiers change — re-check the
pricing pages once in a while.

| Service | Free allowance | What happens at the limit |
|---|---|---|
| **Render** | 750 instance-hours/month (one service running 24/7 ≈ 730 h — fits, barely); **sleeps after 15 min idle**; 500 build-minutes/month | First visitor after idle waits ~30–60 s for wake-up (normal!). Out of build minutes → deploys blocked until next month |
| **Neon** | 0.5 GB storage, 100 compute-hours/month; scales to zero after ~5 min idle | **Hard suspend** at the limit — the API can't reach the DB until you upgrade or delete data. A portfolio uses a tiny fraction of this |
| **Vercel** (Hobby) | 100 GB transfer/month | Site keeps working; overage may be blocked — a portfolio won't come close |
| **Cloudinary** | ~25 credits/month (≈ 25 GB of storage/bandwidth or 25k transformations — check your dashboard's Usage page) | Uploads and/or image delivery fail. Deleting unused images frees storage credit |
| **Resend** | 3,000 emails/month, 100/day; free plan sends **only to the account owner's email** — which is exactly this use case | Reset emails stop; everything else unaffected |

**The only limit worth remembering:** Render's sleep = the *first* visit after a
quiet period is slow. That is expected behavior, not a bug.

---

## 5. Common maintenance tasks

### 5.1 Check that everything is healthy (2 minutes)

1. Open the site → does the homepage show your projects?
2. Open `https://portfolio-api-698b.onrender.com/api/health` → `"status":"ok"` and `"db":"up"`?
3. Sign in to `/admin` → dashboard loads?

If all three pass, you're healthy.

### 5.2 Look at backend logs (when something misbehaves)

Render dashboard → **portfolio-api** → **Logs** tab. You'll see every request
error, upload failure, and startup message. This is the first place to look for
API problems.

### 5.3 Restart the backend

Render dashboard → **portfolio-api** → **Restart** (top right). Fixes a stuck
service; takes ~1 minute. Data is untouched.

### 5.4 Deploy new backend code

The backend does **not** auto-deploy (the Render service was created from a
public repo URL). After code changes are pushed to GitHub:

- **Easy way:** Render dashboard → **portfolio-api** → **Manual Deploy** →
  **Deploy latest commit**. Wait ~3–4 minutes until status is **Live**.
- **Or** ask your AI assistant/developer to trigger it (they can do it via the
  Render API without dashboard access).

Database schema changes apply themselves automatically on startup (Flyway
migrations run before the API opens).

### 5.5 Deploy new frontend code

The frontend also deploys on demand via the Vercel CLI. This is fiddly to do by
hand — in practice, ask your assistant/developer. The manual recipe (needs the
Vercel token from your Vercel account settings):

```bash
cd frontend && npm install && npx ng build      # produces dist/frontend/browser
cd dist/frontend/browser
cp ../../../vercel.json .                        # routing config must ship with it
vercel deploy --prod --yes --scope mahabub-rahmans-projects --token <TOKEN>
```

After deploying, hard-refresh the site (Ctrl/Cmd+Shift+R) to be sure you see the
new version.

> Optional future improvement: connecting the GitHub repo to Vercel (root
> directory `frontend`) would make every push auto-deploy the frontend. Ask your
> assistant if you want this set up.

### 5.6 Inspect the database (Neon)

Neon console → your project → **SQL Editor**. Useful peek queries:

```sql
SELECT title, created_at FROM project ORDER BY created_at DESC;
SELECT email, created_at FROM admin_user;
SELECT count(*) FROM travel_blog_photo;
```

Tables: `admin_user`, `profile`, `project`, `education_entry`, `achievement`,
`extracurricular`, `travel_blog`, `travel_blog_photo`, `password_reset_token`.
You normally never need to change data here — the admin panel does it safely.

### 5.7 Manage images (Cloudinary)

Cloudinary console → **Media Library** → folder `portfolio`. You can see storage
usage and delete orphaned images (e.g. photos removed from a blog but still
stored). Deleting is permanent — when in doubt, leave it.

### 5.8 Check password-reset emails (Resend)

Resend dashboard → **Emails** shows every reset email: delivered / bounced /
failed. If you ever don't receive one, look here first, then in Gmail's spam
folder.

---

## 6. Backups and recovery

### 6.1 Code — GitHub *is* the backup

The repo `Mahabub618/portfolio` contains the entire application (backend,
frontend, deploy configs, QA suites). It's public and contains **no secrets**,
so there's nothing to protect and nothing more to do.

### 6.2 Database — take a snapshot before risky changes

The connection string is in `deploy/render.env` (see §7). Convert the JDBC URL
for command-line tools by removing the `jdbc:` prefix:

```bash
# Backup (creates a .sql file with ALL data)
pg_dump "postgresql://<user>:<password>@<neon-host>/portfolio?sslmode=require" \
  > backup-$(date +%F).sql

# Restore into an EMPTY database (overwrites everything — be careful)
psql "postgresql://<user>:<password>@<neon-host>/portfolio?sslmode=require" \
  < backup-2026-09-11.sql
```

Also available in the Neon console: **branching** (instant copy of the DB for
experiments) and a short point-in-time history. For a real safety net, take a
`pg_dump` monthly or before any bulk content work.

### 6.3 Images — Cloudinary

There's no one-click bulk export on the free tier. The admin panel's blog/project
editors reference Cloudinary URLs, so as long as you don't delete images in the
Cloudinary console, nothing is lost. If images are precious, download originals
from the Media Library occasionally.

### 6.4 Secrets — make your own copy NOW

The complete set of production secrets is stored in two files in this workspace
(both gitignored, never committed):

- `deploy/prod-secrets.env` — JWT secret, admin email + password
- `deploy/render.env` — **every** environment variable the live backend uses
  (database, Cloudinary, Resend, …)

**Action item:** open both files, copy their contents into your password manager
as two secure notes ("portfolio — prod secrets" / "portfolio — render env").
This workspace is not permanent; your password manager is.

---

## 7. Security: what the secrets are and how to rotate them

| Secret | What it protects | Stored in | If leaked… | How to rotate |
|---|---|---|---|---|
| **Admin password** | The admin panel | Your head + `deploy/prod-secrets.env` | Someone can edit all content | `/admin/security`, or Forgot-password flow |
| **JWT_SECRET** | Login token signatures | Render env + both local files | Attacker could forge login tokens | Generate new (`openssl rand -base64 48`), update Render env var, redeploy → everyone is logged out, nothing else changes |
| **DATABASE_PASSWORD** (in `DATABASE_URL` too) | The whole database | Render env + `deploy/render.env` | Full data access | Neon console → Roles → reset password → update **both** `DATABASE_URL` and `DATABASE_PASSWORD` in Render env → redeploy |
| **CLOUDINARY_URL** (contains key+secret) | Image storage | Render env + `deploy/render.env` | Someone could delete/replace images | Cloudinary console → Settings → regenerate keys → update env var → redeploy |
| **RESEND_API_KEY** | Email sending | Render env + `deploy/render.env` | Someone could send email as you (to your address only) | resend.com → API Keys → revoke + create → update env var → redeploy |
| **GitHub PAT / Render key / Vercel token** | Accounts/automation (used by your assistant) | Your assistant's environment; regenerate anytime | Repo/deploy control | Regenerate in each account's settings; give the new value only to whom you trust |

How to change a Render env var: Render dashboard → **portfolio-api** →
**Environment** tab → edit → **Save changes** (this redeploys automatically).

Rules that keep you safe:

1. The GitHub repo is **public** — never put a secret in any committed file.
   (`.gitignore` already blocks the local secret files.)
2. Rotate the admin password immediately if you ever suspect it leaked.
3. After rotating any secret, the old one dies instantly — update every place
   listed in the table before redeploying.

---

## 8. Troubleshooting playbook

| Symptom | Most likely cause | Fix |
|---|---|---|
| First visit slow, then fine | Render service was asleep (normal) | Wait 30–60 s, refresh |
| Site loads but no content; admin can't log in | API down or DB unreachable | Check `/api/health`. If it doesn't answer: Render dashboard → Logs → Restart. If `"db":"down"`: check Neon console (suspended at limit?) |
| Admin login says "Invalid email or password" but you're sure it's right | Password changed / caps lock | Use **Forgot password?** on the sign-in page |
| Image upload fails | File > 5 MB or wrong format, or Cloudinary out of credits | Use JPEG/PNG/WebP under 5 MB; check Cloudinary usage page |
| Images broken across the site | Cloudinary issue | Check Media Library + Render logs for upload/delivery errors |
| Reset email never arrives | Spam folder; or Resend daily limit; or wrong address | Check spam, then Resend dashboard → Emails log |
| Whole site shows an error page | Bad frontend deploy | Vercel dashboard → Deployments → open the last **working** deploy → **Promote to Production** |
| You pushed code but nothing changed | Deploys are manual | Backend: Render → Manual Deploy. Frontend: Vercel CLI deploy (§5.5) |
| API returns 500 errors | Backend bug or DB issue | Render Logs show the exact error; send it to your assistant/developer |
| Everything is dead | Account/billing issue on some service | Check each dashboard for banners/emails; see §9 worst case |

When in doubt, the order of investigation is always:
**health endpoint → Render logs → Neon console → Cloudinary → Vercel.**

---

## 9. Worst case: rebuilding from scratch

If a service account were ever lost, everything can be rebuilt because three
things together describe the entire system:

1. **GitHub repo** — all code + `backend/Dockerfile` + `frontend/vercel.json`
2. **`deploy/render.env`** — the full production environment (in your password manager per §6.4)
3. **A recent `pg_dump`** — the data (§6.2)

Rebuild sketch: create a new Render web service from the repo (Docker), paste
the env vars, point `DATABASE_URL` at the (existing or restored) Neon database —
schema migrations apply automatically — then deploy the frontend to Vercel with
the shipped `vercel.json`. Your assistant/developer can execute all of this;
total time ~1 hour.

---

## 10. Costs: when free stops being enough

You should comfortably stay on free tiers for a personal portfolio. Revisit if:

- **Render:** the site needs to be fast for visitors at all times (no sleep), or
  you add more services → paid starter plan removes sleeping.
- **Neon:** storage grows past 0.5 GB (thousands of records) → entry paid plan.
- **Cloudinary:** heavy image traffic or >25 GB → paid plan.
- **Vercel / Resend:** realistically never for this use case.

No card is required on any current free plan; nothing will silently charge you.

---

## 11. Working with an assistant or developer

- **Safe to share:** the GitHub repo (already public), the live URLs, screenshots
  of dashboards with sensitive values hidden.
- **Share only when needed, and rotate after:** individual secrets from §7
  (e.g. the Render API key so they can deploy). Prefer giving one key over many.
- **Never share:** the passwords to your Vercel/Render/Neon/Cloudinary/Resend/
  GitHub *accounts* themselves.
- Before handing work to anyone, take a `pg_dump` (§6.2). It's your undo button.
- The repo contains automated tests (`qa/`) — ask any developer to run them
  before and after changes; they must all pass.

---

## 12. Quick reference card

```
SITE      https://portfolio-mahabub-rahmans-projects.vercel.app
ADMIN     https://portfolio-mahabub-rahmans-projects.vercel.app/admin
HEALTH    https://portfolio-api-698b.onrender.com/api/health
REPO      https://github.com/Mahabub618/portfolio

DASHBOARDS
  Vercel      vercel.com/mahabub-rahmans-projects/portfolio
  Render      dashboard.render.com  (service: portfolio-api)
  Neon        console.neon.tech     (project: ep-fragrant-art-axwmm6ga)
  Cloudinary  console.cloudinary.com (cloud: n4vjfxzr, folder: portfolio)
  Resend      resend.com

SECRETS (local, gitignored — keep a password-manager copy!)
  deploy/prod-secrets.env   admin credentials + JWT secret
  deploy/render.env         ALL live backend environment variables

REMEMBER
  • Content edits = instant, no deploy.  Code changes = manual deploy.
  • Slow first load = Render waking up. Normal.
  • Backend redeploy: Render → Manual Deploy → Deploy latest commit.
  • Forgot admin password? Sign-in page → "Forgot password?" → Gmail link.
  • Investigate in order: health → Render logs → Neon → Cloudinary → Vercel.
```
