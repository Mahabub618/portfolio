# QA harness (puppeteer + python)

```bash
npm i puppeteer   # once, in this folder
node qa-full.mjs [BASE] [ADMIN_EMAIL] [ADMIN_PASSWORD]   # browser flows, defaults to localhost:4200 dev creds
python3 qa-api.py [API_BASE] [EMAIL] [PASSWORD]          # API edge cases, defaults to localhost:8080 dev creds
node admin.mjs    # deep admin CRUD suite
node public.mjs   # public-site regression
node clicktest.mjs [BASE]  # travel-card click + drag suppression
BASE=... EMAIL=... PASSWORD=... node feat-test.mjs   # mobile menu + /admin/security
#   add ROUNDTRIP=1 to also change the password and revert it (mutating)
node recovery-test.mjs phase1                        # forgot-password UI (dev-email mode)
TOKEN=<token-from-backend-log> node recovery-test.mjs phase2   # reset-password UI + login
```

All suites must end with 0 failures before a frontend change ships
(backend changes are additionally covered by `mvn package`, 34 tests).

## Running against production

Prod admin credentials live in `deploy/prod-secrets.env` (gitignored — never commit them).

```bash
SITE=https://portfolio-mahabub-rahmans-projects.vercel.app
API=https://portfolio-api-698b.onrender.com
EMAIL=$(grep ADMIN_EMAIL ../deploy/prod-secrets.env | cut -d= -f2)
PW=$(grep ADMIN_PASSWORD ../deploy/prod-secrets.env | cut -d= -f2)

python3 qa-api.py "$API" "$EMAIL" "$PW"
node qa-full.mjs "$SITE" "$EMAIL" "$PW"
BASE=$SITE EMAIL=$EMAIL PASSWORD=$PW node feat-test.mjs          # non-mutating
BASE=$SITE EMAIL=$EMAIL PASSWORD=$PW node recovery-test.mjs phase1
```

Never run `feat-test.mjs` with `ROUNDTRIP=1` against prod: it changes the real
admin password (the owner deliberately keeps the current one for QA access).
If it ever gets rotated, use the Forgot-password flow or ask the owner.
