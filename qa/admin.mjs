import puppeteer from 'puppeteer';

const BASE = 'http://localhost:4200';
const EMAIL = 'dev@portfolio.local';
const PASS = 'DevPass#2026!';
const jsErrors = [];

const log = (ok, msg) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
let failures = 0;
const check = (cond, msg) => { log(cond, msg); if (!cond) failures++; };

// 1x1 red PNG for the upload test
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
import { writeFileSync } from 'node:fs';
writeFileSync('/tmp/test-upload.png', Buffer.from(PNG_B64, 'base64'));

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => jsErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error' && !String(m.text()).includes('fonts.g')) jsErrors.push(m.text());
});

/** Scope-aware: only labels inside `root` (defaults to whole document). */
const typeIntoLabel = async (labelText, value, root = 'document') => {
  const el = await page.evaluateHandle(
    ({ lbl, rootSel }) => {
      const scope = rootSel === 'document' ? document : document.querySelector(rootSel);
      if (!scope) return null;
      const spans = [...scope.querySelectorAll('label span')];
      const matches = spans
        .filter((x) => x.textContent.trim().startsWith(lbl))
        .sort((a, b) => a.textContent.length - b.textContent.length);
      if (matches.length === 0) return null;
      const label = matches[0].closest('label');
      return label ? label.querySelector('input, textarea, select') : null;
    },
    { lbl: labelText, rootSel: root },
  );
  const h = el.asElement();
  if (!h) throw new Error(`no input found for label "${labelText}" in ${root}`);
  await h.evaluate((e) => e.select());
  await h.type(value, { delay: 5 });
};

const setText = (labelText, value, root) => typeIntoLabel(labelText, value, root);

const waitForText = (text, timeout = 15000) =>
  page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    { timeout },
    text,
  );

const toastText = () =>
  page.$eval('app-toast-host', (el) => el.innerText).catch(() => '');

const rowText = () => page.$eval('table tbody', (el) => el.innerText).catch(() => '');

/* ---------------- 1. login page ---------------- */
await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle2' });
check(await page.waitForSelector('input[type=email]') !== null, 'login form renders');
check((await page.title()).includes('Sign in'), `login route title: "${await page.title()}"`);
await page.screenshot({ path: '/tmp/rendercheck/shot-admin-login.png' });

/* ---------------- 2. wrong password ---------------- */
await typeIntoLabel('Email', EMAIL);
await typeIntoLabel('Password', 'wrong-password');
await Promise.all([
  page.click('button[type=submit]'),
  page.waitForSelector('[role=alert]', { timeout: 10000 }),
]);
const errTxt = await page.$eval('[role=alert]', (e) => e.innerText);
check(/credential|invalid|wrong/i.test(errTxt), `wrong password rejected: "${errTxt.slice(0, 60)}"`);
check(page.url().includes('/admin/login'), 'stays on login after failure');

/* ---------------- 3. successful login → dashboard ---------------- */
await typeIntoLabel('Password', PASS);
await Promise.all([
  page.click('button[type=submit]'),
  page.waitForFunction(() => location.pathname === '/admin', { timeout: 10000 }),
]);
check(page.url().endsWith('/admin'), 'redirects to /admin after login');
const token = await page.evaluate(() => localStorage.getItem('portfolio.jwt'));
check(!!token && token.split('.').length === 3, 'JWT stored in localStorage');

// wait for the dashboard tiles to resolve to numbers
await page.waitForFunction(
  () => {
    const t = document.querySelector('main')?.innerText ?? '';
    return /Projects/.test(t) && !/[\u2026]/.test(t) && /database/i.test(t);
  },
  { timeout: 20000 },
);
const dash = await page.$eval('main', (e) => e.innerText);
check(dash.includes('3') && dash.includes('Projects'), 'dashboard shows project count');
check(/database\s*up/i.test(dash.replace(/\s+/g, ' ')), 'dashboard health card shows db up');
await page.screenshot({ path: '/tmp/rendercheck/shot-admin-dashboard.png' });

/* ---------------- 4. guard: bad token bounces to login ---------------- */
const p2 = await browser.newPage();
await p2.evaluate(() => {});
await p2.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
await p2.evaluate(() => localStorage.setItem('portfolio.jwt', 'garbage.token.here'));
await p2.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
check(p2.url().includes('/admin/login'), 'invalid token → redirected to login');
await p2.close();
// p2 shares localStorage with page, so put the valid token back
await page.evaluate((t) => localStorage.setItem('portfolio.jwt', t), token);

/* ---------------- 5. projects CRUD ---------------- */
await page.click('nav a[href="/admin/projects"]');
await page.waitForFunction(() => location.pathname === '/admin/projects');
await waitForText('Projects');
await page.waitForSelector('tbody tr', { timeout: 15000 });

// API-level cleanup of leftovers from an aborted previous run (re-runnable suite)
const cleaned = await page.evaluate(async (t) => {
  const h = { Authorization: `Bearer ${t}` };
  const list = await (await fetch('/api/projects?page=1&size=50', { headers: h })).json();
  const doomed = (list.data.items ?? []).filter((p) => p.title.includes('E2E'));
  for (const p of doomed) await fetch(`/api/projects/${p.id}`, { method: 'DELETE', headers: h });
  return doomed.length;
}, token);
if (cleaned) console.log(`INFO  cleaned ${cleaned} leftover E2E project(s) via API`);
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('tbody tr', { timeout: 15000 });

let rows = await rowText();
check((rows.match(/Edit/g) || []).length === 3, 'projects table lists 3 seeded rows');

// create
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('New project')).click());
await page.waitForSelector('form label input', { timeout: 10000 });
await setText('Title', 'E2E Test Project', '.admin-modal-overlay');
await setText('Short description', 'Created by the admin e2e harness.', '.admin-modal-overlay');
await setText('Tech tags', 'E2E, Puppeteer', '.admin-modal-overlay');
await page.screenshot({ path: '/tmp/rendercheck/shot-admin-modal.png' });
await Promise.all([
  page.evaluate(() => document.querySelector('.admin-modal-overlay form button[type=submit]').click()),
  waitForText('Created'),
]);
rows = await rowText();
check(rows.includes('E2E Test Project'), 'project created (4 rows now): ' + (rows.match(/Edit/g) || []).length);
check(rows.includes('E2E'), 'tech tags rendered as chips in table');

// edit
await page.evaluate(() => {
  const row = [...document.querySelectorAll('tbody tr')].find((r) => r.innerText.includes('E2E Test Project'));
  [...row.querySelectorAll('button')].find((b) => b.innerText === 'Edit').click();
});
await page.waitForSelector('.admin-modal-overlay form', { timeout: 10000 });
const titleInput = await page.evaluateHandle(() => {
  const spans = [...document.querySelectorAll('.admin-modal-overlay form label span')];
  return spans.find((x) => x.textContent.trim().startsWith('Title')).closest('label').querySelector('input');
});
check((await titleInput.asElement().evaluate((el) => el.value)) === 'E2E Test Project', 'edit modal prefilled');
await titleInput.asElement().evaluate((e) => e.select());
await titleInput.asElement().type('E2E Renamed', { delay: 5 });
await Promise.all([
  page.evaluate(() => document.querySelector('.admin-modal-overlay form button[type=submit]').click()),
  waitForText('Updated'),
]);
await page.waitForFunction(
  () => (document.querySelector('tbody')?.innerText ?? '').includes('E2E Renamed'),
  { timeout: 15000 },
);
rows = await rowText();
check(rows.includes('E2E Renamed') && !rows.includes('E2E Test Project'), 'project renamed via PUT');

// delete
const foundRow = await page.evaluate(() => {
  const row = [...document.querySelectorAll('tbody tr')].find((r) => r.innerText.includes('E2E Renamed'));
  if (!row) return false;
  [...row.querySelectorAll('button')].find((b) => b.innerText === 'Delete').click();
  return true;
});
check(foundRow, 'renamed row found for deletion');
await page.waitForSelector('[role=alertdialog]', { timeout: 10000 });
check(true, 'confirm dialog appears before delete');
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('[role=alertdialog] button')].find((b) => b.innerText === 'Delete').click()),
  waitForText('Deleted'),
]);
await page.waitForFunction(
  () => (document.querySelector('tbody')?.innerText ?? '').match(/Edit/g)?.length === 3,
  { timeout: 15000 },
);
rows = await rowText();
check(!rows.includes('E2E') && (rows.match(/Edit/g) || []).length === 3, 'project deleted, back to 3 rows');

/* ---------------- 6. blog editor: photos, captions, reorder, upload, delete ---------------- */
await page.click('nav a[href="/admin/blogs"]');
await page.waitForFunction(() => location.pathname === '/admin/blogs');
await waitForText('Travel blogs');
await page.waitForSelector('article h3', { timeout: 15000 });
const blogCards = await page.$$eval('article h3', (els) => els.map((e) => e.innerText));
check(blogCards.length === 2, `blogs list shows 2 cards: ${JSON.stringify(blogCards)}`);
await page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.innerText.includes('Edit photos')).click());
await page.waitForFunction(() => /^\/admin\/blogs\//.test(location.pathname));
await waitForText('Gallery photos');
const photoCount = async () => (await page.$$('section ul li')).length;
let n0 = await photoCount();
check(n0 >= 1, `photo manager lists ${n0} photos`);

// edit caption
const firstRowUrl = await page.$eval('section ul li img', (img) => img.src);
const capInput = await page.$('section ul li input[placeholder^="Caption"]');
await capInput.evaluate((e) => e.select());
await capInput.type('E2E caption ✦', { delay: 5 });
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('section ul li')][0].querySelectorAll('button')[0].click()),
  waitForText('Photo updated'),
]);
check(true, 'caption saved via PUT /blogs/{id}/photos/{pid}');

// reorder down then back
await page.evaluate(() => [...document.querySelectorAll('section ul li')][0].querySelector('[aria-label="Move later"]').click());
await waitForText('Order updated');
await new Promise((r) => setTimeout(r, 300));
let nowFirst = await page.$eval('section ul li img', (img) => img.src);
check(nowFirst !== firstRowUrl, 'reorder (move later) swapped positions server-side');
await page.evaluate(() => [...document.querySelectorAll('section ul li')][1].querySelector('[aria-label="Move earlier"]').click());
await waitForText('Order updated');
nowFirst = await page.$eval('section ul li img', (img) => img.src);
check(nowFirst === firstRowUrl, 'reorder restored original order');

// upload a photo
const fileInput = await page.$('section input[type=file][multiple]');
await fileInput.uploadFile('/tmp/test-upload.png');
await page.waitForFunction(
  (n) => document.querySelectorAll('section ul li').length === n,
  { timeout: 20000 },
  n0 + 1,
);
check((await photoCount()) === n0 + 1, 'upload → new photo attached to blog');
await page.screenshot({ path: '/tmp/rendercheck/shot-admin-blog-editor.png' });

// delete the uploaded photo (last row)
await page.evaluate(() => {
  const rows = document.querySelectorAll('section ul li');
  rows[rows.length - 1].querySelector('[aria-label="Delete photo"]').click();
});
await page.waitForSelector('[role=alertdialog]');
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('[role=alertdialog] button')].find((b) => b.innerText === 'Delete').click()),
  waitForText('Photo deleted'),
]);
check((await photoCount()) === n0, 'photo deleted, count restored');

// caption persisted?
const cap = await page.$eval('section ul li input', (i) => i.value);
check(cap.includes('E2E caption'), `caption persisted after operations: "${cap}"`);
// restore caption to something neutral
const capInput2 = await page.$('section ul li input[placeholder^="Caption"]');
await capInput2.evaluate((e) => e.select());
await capInput2.type('Morning light over the mangrove channels', { delay: 5 });
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('section ul li')][0].querySelectorAll('button')[0].click()),
  waitForText('Photo updated'),
]);

/* ---------------- 7. profile editor ---------------- */
await page.click('nav a[href="/admin/profile"]');
await page.waitForFunction(() => location.pathname === '/admin/profile');
await waitForText('Profile');
await typeIntoLabel('Tagline', 'E2E Tagline');
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Save profile')).click()),
  waitForText('Profile saved'),
]);
const apiTagline = await page.evaluate(async (t) => {
  const r = await fetch('/api/profile', { headers: { Authorization: `Bearer ${t}` } });
  return (await r.json()).data.tagline;
}, token);
check(apiTagline === 'E2E Tagline', `profile PUT round-trip via API: "${apiTagline}"`);
await page.screenshot({ path: '/tmp/rendercheck/shot-admin-profile.png' });

// restore
await typeIntoLabel('Tagline', 'Software Engineer · Full-Stack & Algorithms');
await Promise.all([
  page.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Save profile')).click()),
  waitForText('Profile saved'),
]);

/* ---------------- 8. logout + public site still fine ---------------- */
await page.evaluate(() => [...document.querySelectorAll('header button')].find((b) => b.innerText.includes('Sign out')).click());
await page.waitForFunction(() => location.pathname.includes('/admin/login'));
check(!await page.evaluate(() => localStorage.getItem('portfolio.jwt')), 'logout clears token');

await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await waitForText('Your Name');
check(true, 'public home still renders after admin session');

console.log(`\nREAL JS ERRORS: ${jsErrors.length === 0 ? 'none' : jsErrors.slice(0, 5).join(' | ')}`);
console.log(failures === 0 ? '\n=== ALL ADMIN CHECKS PASSED ===' : `\n=== ${failures} FAILURES ===`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
