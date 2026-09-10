# QA harness (puppeteer + python)

```bash
npm i puppeteer   # once, in this folder
node qa-full.mjs [BASE] [ADMIN_EMAIL] [ADMIN_PASSWORD]   # browser flows, defaults to localhost:4200 dev creds
python3 qa-api.py [API_BASE] [EMAIL] [PASSWORD]          # API edge cases, defaults to localhost:8080 dev creds
node admin.mjs    # deep admin CRUD suite
node public.mjs   # public-site regression
node clicktest.mjs [BASE]  # travel-card click + drag suppression
```

All suites must end with 0 failures before a frontend change ships
(backend changes are additionally covered by `mvn package`, 24 tests).
