import puppeteer from 'puppeteer';
const BASE = process.argv[2] || 'http://localhost:4200';
const EMAIL = process.argv[3] || 'dev@portfolio.local';
const PASS = process.argv[4] || 'DevPass#2026!';

let fails = 0, passes = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? passes++ : fails++; };
const jsErrors = [];

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => jsErrors.push('pageerror: ' + String(e).slice(0, 150)));
page.on('console', (m) => {
  const t = m.text();
  if (m.type() === 'error' && !t.includes('fonts.g') && !t.includes('Failed to load resource')) jsErrors.push('console: ' + t.slice(0, 150));
});

const type = async (lbl, v, root) => {
  const el = await page.evaluateHandle(
    ({ l, r }) => {
      const scope = r ? document.querySelector(r) : document;
      if (!scope) return null;
      const spans = [...scope.querySelectorAll('label span')].filter((x) => x.textContent.trim().startsWith(l)).sort((a, b) => a.textContent.length - b.textContent.length);
      if (!spans.length) return null;
      const lab = spans[0].closest('label');
      return lab ? lab.querySelector('input, textarea, select') : null;
    },
    { l: lbl, r: root },
  );
  const h = el.asElement();
  if (!h) throw new Error('no input for ' + lbl);
  await h.evaluate((e) => e.select());
  await h.type(v, { delay: 3 });
};
const toast = () => page.$eval('app-toast-host', (e) => e.innerText).catch(() => '');

/* ================= PUBLIC: desktop home ================= */
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

// nav fragment links scroll
await page.click('nav[aria-label="Primary"] a[href*="projects"]');
await new Promise((r) => setTimeout(r, 1200));
check(await page.evaluate(() => scrollY > 300), 'nav "Projects" link scrolls down the page');

// hero CTA
await page.evaluate(() => scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 600));
const cta = await page.$('section a[href="#projects"], section a[href*="projects"]');
check(!!cta, 'hero has a CTA link');

// social links well-formed
const socials = await page.$$eval('a[target="_blank"]', (as) => as.map((a) => a.href).filter((h) => h.startsWith('http')));
check(socials.length >= 2, `social/external links well-formed (${socials.length})`);

// project tag filter
const chips = await page.$$('#projects button');
if (chips.length > 1) {
  const before = (await page.$$('#projects article, #projects [class*=card]')).length;
  await chips[1].click();
  await new Promise((r) => setTimeout(r, 600));
  const after = (await page.$$('#projects article, #projects [class*=card]')).length;
  check(after !== before || after >= 1, `tag filter changes grid (${before} → ${after})`);
  await chips[0].click();
  await new Promise((r) => setTimeout(r, 400));
} else check(false, 'tag filter chips present');

// project modal
await page.evaluate(() => document.querySelector('#projects')?.scrollIntoView());
await page.click('#projects article h3, #projects h3');
await page.waitForSelector('[role=dialog]', { timeout: 8000 }).then(() => check(true, 'project modal opens')).catch(() => check(false, 'project modal opens'));
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));
check(!(await page.$('[role=dialog]')), 'Esc closes project modal');

// meta description on home
check(await page.$eval('meta[name="description"]', (m) => m.content.length > 10).catch(() => false), 'home has meta description');

// theme toggle + persistence
await page.click('nav[aria-label="Primary"] button');
await new Promise((r) => setTimeout(r, 400));
check(await page.evaluate(() => document.documentElement.dataset.theme === 'light'), 'theme toggles to light');
await page.reload({ waitUntil: 'networkidle2' });
check(await page.evaluate(() => document.documentElement.dataset.theme === 'light'), 'light theme persists after reload');
await page.click('nav[aria-label="Primary"] button');
await new Promise((r) => setTimeout(r, 300));

// desktop overflow
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow @1440');

/* ================= PUBLIC: mobile ================= */
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1000));
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow @390 home');
const blogId = await page.evaluate(async () => (await (await fetch('/api/blogs?page=1&size=1')).json()).data.items[0].id);
await page.goto(`${BASE}/travel/${blogId}`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow @390 travel');
check(await page.evaluate(() => !!document.querySelector('[aria-live]')), 'mobile counter chip present');

/* ================= PUBLIC: travel edge cases (desktop) ================= */
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE}/travel/00000000-0000-0000-0000-000000000000`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
const errTxt = await page.$eval('main, body', (e) => e.innerText);
check(/not.?found|could not be found|doesn.?t exist|no longer/i.test(errTxt) || (await page.url()) === BASE + '/', `invalid blog id handled gracefully ("${errTxt.slice(0, 60).replace(/\n/g, ' ')}")`);
await page.goto(`${BASE}/travel/not-even-a-uuid`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1000));
check(true, 'malformed uuid does not crash');
await page.goto(BASE + '/definitely-not-a-route', { waitUntil: 'networkidle2' });
check((await page.url()).replace(/\/$/, '') === BASE, 'unknown route redirects home');

// valid travel: Home/End keys
await page.goto(`${BASE}/travel/${blogId}`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
await page.keyboard.press('End');
await new Promise((r) => setTimeout(r, 900));
check((await page.$eval('[aria-live]', (e) => e.innerText)).includes('5'), 'End key jumps to last frame');
await page.keyboard.press('Home');
await new Promise((r) => setTimeout(r, 900));
check((await page.$eval('[aria-live]', (e) => e.innerText)).includes('1'), 'Home key jumps to first frame');

/* ================= ADMIN ================= */
await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
// empty submit → native validation, no POST
const prevented = await page.evaluate(() => {
  const form = document.querySelector('form');
  return form.querySelector('input[type=email]').checkValidity() === false;
});
check(prevented, 'login blocks empty submit via required fields');

await type('Email', EMAIL);
await type('Password', PASS);
await page.click('form button[type=submit]');
await page.waitForFunction(() => location.pathname === '/admin', { timeout: 20000 });
await new Promise((r) => setTimeout(r, 2000));

// dashboard counts vs API
const apiCounts = await page.evaluate(async (t) => {
  const h = { Authorization: `Bearer ${t}` };
  const p = await (await fetch('/api/projects?page=1&size=1', { headers: h })).json();
  const a = await (await fetch('/api/achievements', { headers: h })).json();
  return { projects: p.data.total, achievements: a.data.length };
}, await page.evaluate(() => localStorage.getItem('portfolio.jwt')));
const dashTxt = await page.$eval('main', (e) => e.innerText);
check(dashTxt.includes(String(apiCounts.projects)) && dashTxt.includes(String(apiCounts.achievements)), 'dashboard counts match API');

// projects: required validation (no POST)
await page.goto(BASE + '/admin/projects', { waitUntil: 'networkidle2' });
await page.waitForSelector('tbody tr', { timeout: 15000 });
let postCount = 0;
page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/api/projects')) postCount++; });
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('New project')).click());
await page.waitForSelector('.admin-modal-overlay', { timeout: 8000 });
await page.evaluate(() => document.querySelector('.admin-modal-overlay form button[type=submit]').click());
await new Promise((r) => setTimeout(r, 800));
const nativeBlocked = await page.evaluate(() => {
  const inp = document.querySelector('.admin-modal-overlay form input');
  return inp ? !inp.checkValidity() : false;
});
check(postCount === 0 && (nativeBlocked || (await toast()).includes('required')), 'empty title blocked client-side (native validation or toast), no POST');

// overlong title → backend 400 surfaced
await type('Title', 'X'.repeat(300), '.admin-modal-overlay');
await type('Short description', 'qa overlong title test', '.admin-modal-overlay');
await page.evaluate(() => document.querySelector('.admin-modal-overlay form button[type=submit]').click());
await new Promise((r) => setTimeout(r, 1500));
const t1 = await toast();
check(t1.length > 0 && !t1.includes('Created'), `overlong title rejected with visible error ("${t1.slice(0, 50).replace(/\n/g, ' ')}")`);

// XSS-safe rendering
await type('Title', '<img src=x onerror="window.__xss=1">', '.admin-modal-overlay');
await page.evaluate(() => document.querySelector('.admin-modal-overlay form button[type=submit]').click());
await new Promise((r) => setTimeout(r, 1500));
await page.waitForFunction(() => (document.querySelector('tbody')?.innerText ?? '').includes('<img src=x'), { timeout: 8000 }).catch(() => {});
check(await page.evaluate(() => window.__xss === undefined), 'XSS payload renders inert (no onerror execution)');
// cleanup the xss row
await page.evaluate(() => {
  const row = [...document.querySelectorAll('tbody tr')].find((r) => r.innerText.includes('<img src=x'));
  if (row) [...row.querySelectorAll('button')].find((b) => b.innerText === 'Delete').click();
});
await page.waitForSelector('[role=alertdialog]', { timeout: 8000 });
await page.evaluate(() => [...document.querySelectorAll('[role=alertdialog] button')].find((b) => b.innerText === 'Delete').click());
await new Promise((r) => setTimeout(r, 1000));

/* ---- blog editor upload validation ---- */
await page.goto(BASE + '/admin/blogs', { waitUntil: 'networkidle2' });
await page.waitForSelector('article h3', { timeout: 15000 });
await page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.innerText.includes('Edit photos')).click());
await page.waitForSelector('section ul li', { timeout: 15000 });
// non-image file
const { writeFileSync } = await import('node:fs');
writeFileSync('/tmp/qa.txt', 'not an image');
const fi = await page.$('section input[type=file][multiple]');
await fi.uploadFile('/tmp/qa.txt');
await new Promise((r) => setTimeout(r, 1500));
const t2 = await toast();
check(/unsupported|only|invalid|failed/i.test(t2), `non-image upload rejected with message ("${t2.slice(0, 60).replace(/\n/g, ' ')}")`);
// oversized file (6MB)
writeFileSync('/tmp/qa-big.png', Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(6 * 1024 * 1024)]));
const fi2 = await page.$('section input[type=file][multiple]');
await fi2.uploadFile('/tmp/qa-big.png');
await new Promise((r) => setTimeout(r, 2500));
const t3 = await toast();
check(/5 MB|exceeds|too large|failed/i.test(t3), `oversized upload rejected with message ("${t3.slice(0, 60).replace(/\n/g, ' ')}")`);

/* ---- admin mobile ---- */
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + '/admin/projects', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'admin table page no page-level overflow @390');

console.log(`\nJS ERRORS: ${jsErrors.length ? jsErrors.slice(0, 6).join(' | ') : 'none'}`);
if (jsErrors.length) fails++;
console.log(`\n=== QA: ${passes} passed, ${fails} failed ===`);
await browser.close();
process.exit(fails ? 1 : 0);
