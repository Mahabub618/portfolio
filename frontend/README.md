# Portfolio Frontend (Angular)

Angular 22 (standalone, signals, zoneless) + Tailwind CSS v4 design tokens.
Midnight Violet palette (dark default, light toggle), Space Grotesk / Inter / JetBrains Mono.

## Run locally

```bash
# backend must be running on :8080 (see ../backend)
npm install
npx ng serve --proxy-config proxy.conf.json   # dev (proxies /api + /uploads to :8080)
```

Production build + local preview (same setup the live preview uses):

```bash
npx ng build                 # outputs dist/frontend/browser
node serve-dist.mjs          # static server on :4200 with /api → :8080 proxy
```

## Routes

| Path | Chunk | Content |
|---|---|---|
| `/` | main | hero, projects (+tag filter & detail modal), education timeline, achievements (stat row computed from records), extracurricular, horizontal travel strip |
| `/travel/:id` | lazy | cinematic scroll-story gallery: full-bleed ken-burns cover, alternating full/offset frames with per-photo captions, filmstrip rail + ←/→ keyboard stepping, mobile counter chip |
| `/admin/login` | lazy | JWT sign-in (single seeded admin) |
| `/admin` | lazy | dashboard: counts, site health, quick actions |
| `/admin/profile` | lazy | hero/identity editor, social links, CTAs, image upload |
| `/admin/projects`, `education`, `achievements`, `activities` | lazy | table + modal-form CRUD |
| `/admin/blogs`, `/admin/blogs/:id` | lazy | blog cards; story editor + photo manager (upload, captions, reorder, delete) |

## Verification performed

Headless-Chrome render checks against the production build (see the render-check
scripts): all home sections render API data; travel gallery counter/rail/keyboard nav
work at 1440px and 390px with no horizontal overflow; light/dark toggle persists;
per-route `Title`/`Meta`/`og:image` set from the blog record; zero console JS errors.

## Config

`src/environments/environment.ts` (dev, relative `/api` via proxy) and
`environment.prod.ts` (deploy target API URL, set at deploy time). `angular.json`
production build uses `fileReplacements`.

## Admin panel (Stage 3)

Everything under `/admin` is route-guarded by the JWT (`portfolio.jwt` in localStorage);
expired/absent tokens bounce to the login page, and 401s from the API do the same.
Local dev admin (see `backend/.env`): `dev@portfolio.local` / `DevPass#2026!` — **dev only**;
production credentials are generated at deploy time (DEPLOY.md).

Verification: `puppeteer` suite (`admin.mjs` + `public.mjs` in the render-check harness) —
27 admin checks + public-site regression, all passing against the production bundle.
