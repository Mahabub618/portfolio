// Feature QA: public mobile menu + admin password rotation (/admin/security).
// Env: BASE (default http://localhost:4200), EMAIL, PASSWORD.
// ROUNDTRIP=1 additionally changes the password and reverts it (OLD_PW/NEW_PW override) —
// only enable against environments where a temporary password change is acceptable.
import puppeteer from 'puppeteer';
const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = process.env.EMAIL || 'dev@portfolio.local';
const PASSWORD = process.env.PASSWORD || 'DevPass#2026!';
const OLD_PW = process.env.OLD_PW || PASSWORD;
const NEW_PW = process.env.NEW_PW || 'Brand-New-Secret-77';
const ROUNDTRIP = process.env.ROUNDTRIP === '1';
let fails = 0, passes = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? passes++ : fails++; };
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));

/* ---- mobile menu ---- */
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1000));
const burger = await page.$('button[aria-controls="mobile-menu"]');
check(!!burger, 'hamburger visible on mobile');
await burger.click();
await new Promise((r) => setTimeout(r, 400));
check(!!(await page.$('#mobile-menu')), 'menu panel opens');
check((await page.$$('#mobile-menu a')).length === 5, 'menu lists 5 section links');
check((await burger.evaluate((b) => b.getAttribute('aria-expanded'))) === 'true', 'aria-expanded=true when open');
await page.click('#mobile-menu a[href*="projects"]');
await new Promise((r) => setTimeout(r, 1200));
check(!(await page.$('#mobile-menu')), 'menu closes after link click');
check(await page.evaluate(() => scrollY > 300), 'menu link scrolls to section');
// hidden on desktop
await page.setViewport({ width: 1440, height: 900 });
await new Promise((r) => setTimeout(r, 400));
check(await page.evaluate(() => {
  const b = document.querySelector('button[aria-controls="mobile-menu"]');
  return b ? getComputedStyle(b).display === 'none' : true;
}), 'hamburger hidden on desktop');

/* ---- security page (non-mutating checks) ---- */
await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
const type = async (l, v, r) => {
  const el = await page.evaluateHandle(({ x, s }) => {
    const scope = s ? document.querySelector(s) : document;
    const spans = [...scope.querySelectorAll('label span')].filter((y) => y.textContent.trim().startsWith(x)).sort((a, b) => a.textContent.length - b.textContent.length);
    return spans.length ? spans[0].closest('label').querySelector('input') : null;
  }, { x: l, s: r });
  await el.asElement().evaluate((e) => e.select());
  await el.asElement().type(v, { delay: 3 });
};
await type('Email', EMAIL);
await type('Password', PASSWORD);
await page.click('form button[type=submit]');
await page.waitForFunction(() => location.pathname === '/admin');
check(!!(await page.$('nav a[href="/admin/security"]')), 'Security nav item present');
await page.click('nav a[href="/admin/security"]');
await page.waitForFunction(() => location.pathname === '/admin/security');
await new Promise((r) => setTimeout(r, 500));
// validation: too short
await type('Current password', OLD_PW);
await type('New password', 'short');
await type('Confirm', 'short');
await page.click('form button[type=submit]');
await new Promise((r) => setTimeout(r, 400));
check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('12'), 'short password rejected client-side');
// wrong current (server rejects, no mutation)
await type('New password', NEW_PW);
await type('Confirm', NEW_PW);
await type('Current password', 'wrong-current-pass');
await page.click('form button[type=submit]');
await new Promise((r) => setTimeout(r, 1200));
check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('incorrect'), 'wrong current password rejected by API');

if (ROUNDTRIP) {
  // success (MUTATES the password, reverts at the end)
  await type('Current password', OLD_PW);
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1500));
  check((await page.$eval('app-toast-host', (e) => e.innerText)).includes('Password updated'), 'password updated toast');
  // old fails, new works
  await page.evaluate(() => localStorage.removeItem('portfolio.jwt'));
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
  await type('Email', EMAIL);
  await type('Password', OLD_PW);
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1200));
  check((await page.$('[role=alert]')) !== null, 'old password no longer logs in');
  await type('Password', NEW_PW);
  await page.click('form button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/admin', { timeout: 10000 });
  check(true, 'new password logs in');
  // revert
  await page.goto(BASE + '/admin/security', { waitUntil: 'networkidle2' });
  await type('Current password', NEW_PW);
  await type('New password', OLD_PW);
  await type('Confirm', OLD_PW);
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1500));
  check((await page.$eval('app-toast-host', (e) => e.innerText)).includes('Password updated'), 'password reverted for dev sanity');
}

console.log(`\n=== FEATURE QA: ${passes} passed, ${fails} failed ===`);
await browser.close();
process.exit(fails ? 1 : 0);
