// Admin mobile nav (hamburger + panel) checks — run at 390px and desktop sanity at 1440px.
import puppeteer from 'puppeteer';
const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = process.env.EMAIL || 'dev@portfolio.local';
const PASSWORD = process.env.PASSWORD || 'DevPass#2026!';
let fails = 0, passes = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? passes++ : fails++; };

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(String(e).slice(0, 150)));

// login at desktop width first
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
const type = async (l, v) => {
  const el = await page.evaluateHandle((x) => {
    const spans = [...document.querySelectorAll('label span')].filter((y) => y.textContent.trim().startsWith(x))
      .sort((a, b) => a.textContent.length - b.textContent.length);
    return spans.length ? spans[0].closest('label').querySelector('input') : null;
  }, l);
  await el.asElement().evaluate((e) => e.select());
  await el.asElement().type(v, { delay: 3 });
};
await type('Email', EMAIL);
await type('Password', PASSWORD);
await page.click('form button[type=submit]');
await page.waitForFunction(() => location.pathname === '/admin');

/* ---- mobile: 390px ---- */
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + '/admin', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 800));

const burger = await page.$('header button[aria-controls="admin-mobile-menu"]');
check(!!burger, 'hamburger visible on mobile');
// panel closed by default: links not rendered/visible
const visibleLinksClosed = await page.$$eval('#admin-mobile-menu a', (as) => as.filter((a) => a.offsetParent !== null).length);
check(visibleLinksClosed === 0, 'panel closed by default (no visible links)');
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow with panel closed');

await burger.click();
await new Promise((r) => setTimeout(r, 300));
const visibleLinksOpen = await page.$$eval('#admin-mobile-menu a', (as) => as.filter((a) => a.offsetParent !== null).length);
check(visibleLinksOpen === 8, `panel opens with all 8 links visible (got ${visibleLinksOpen})`);
check((await burger.evaluate((b) => b.getAttribute('aria-expanded'))) === 'true', 'aria-expanded=true when open');
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow with panel open');
// links laid out in grid (at least 2 columns): two first links share the same row
const sameRow = await page.$$eval('#admin-mobile-menu a', (as) => {
  const r1 = as[0].getBoundingClientRect(), r2 = as[1].getBoundingClientRect();
  return Math.abs(r1.top - r2.top) < 5;
});
check(sameRow, 'links arranged in a multi-column grid (no sliding)');

// click a link: navigates and closes the panel
await page.click('#admin-mobile-menu a[href="/admin/projects"]');
await page.waitForFunction(() => location.pathname === '/admin/projects');
await new Promise((r) => setTimeout(r, 500));
const visibleAfterNav = await page.$$eval('#admin-mobile-menu a', (as) => as.filter((a) => a.offsetParent !== null).length);
check(visibleAfterNav === 0, 'panel closes after link click');

// reopen + backdrop closes
await (await page.$('header button[aria-controls="admin-mobile-menu"]')).click();
await new Promise((r) => setTimeout(r, 300));
await page.click('header button[aria-label="Close admin menu"]');
await new Promise((r) => setTimeout(r, 300));
const visibleAfterBackdrop = await page.$$eval('#admin-mobile-menu a', (as) => as.filter((a) => a.offsetParent !== null).length);
check(visibleAfterBackdrop === 0, 'backdrop tap closes panel');

/* ---- desktop: 1440px — sidebar untouched ---- */
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/admin', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 600));
check(await page.evaluate(() => {
  const b = document.querySelector('header button[aria-controls="admin-mobile-menu"]');
  return b ? (b.offsetParent === null || getComputedStyle(b).display === 'none') : true;
}), 'hamburger hidden on desktop');
check(await page.evaluate(() => {
  const side = document.querySelector('aside nav a[href="/admin/projects"]');
  return side && getComputedStyle(side.closest('aside')).display !== 'none';
}), 'desktop sidebar still visible and functional');
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow @1440');

check(jsErrors.length === 0, `no JS errors (${jsErrors.slice(0, 2).join(' | ') || 'none'})`);
console.log(`\n=== ADMIN MOBILE NAV QA: ${passes} passed, ${fails} failed ===`);
await browser.close();
process.exit(fails ? 1 : 0);
