// Recovery flow E2E (local/dev-email mode).
// phase1: login page link -> forgot page -> submit -> success + cooldown
// phase2 (TOKEN env): reset page validation -> reset -> success -> login with new pw
import puppeteer from 'puppeteer';

const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = process.env.EMAIL || 'dev@portfolio.local';
const NEW_PW = process.env.NEW_PW || 'Recovered-Secret-42';
const PHASE = process.argv[2] || 'phase1';
const TOKEN = process.env.TOKEN || '';

let fails = 0, passes = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? passes++ : fails++; };

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));

const type = async (l, v) => {
  const el = await page.evaluateHandle((x) => {
    const spans = [...document.querySelectorAll('label span')].filter((y) => y.textContent.trim().startsWith(x))
      .sort((a, b) => a.textContent.length - b.textContent.length);
    return spans.length ? spans[0].closest('label').querySelector('input') : null;
  }, l);
  await el.asElement().evaluate((e) => e.select());
  await el.asElement().type(v, { delay: 3 });
};

if (PHASE === 'phase1') {
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
  const link = await page.$('a[href="/admin/forgot-password"]');
  check(!!link, 'login page has Forgot password? link');
  await page.click('a[href="/admin/forgot-password"]');
  await page.waitForFunction(() => location.pathname === '/admin/forgot-password');
  check(true, 'forgot-password page opens');
  await type('Email', EMAIL);
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1200));
  check((await page.$('[role=status]')) !== null, 'generic success message shown');
  const btn = await page.$eval('form button[type=submit]', (b) => b.innerText);
  check(/Resend in \d+s/.test(btn), 'resend cooldown active (' + btn.trim() + ')');
  // unknown email gets the identical response (no enumeration)
  await page.goto(BASE + '/admin/forgot-password', { waitUntil: 'networkidle2' });
  await type('Email', 'nobody@nowhere.test');
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1200));
  check((await page.$('[role=status]')) !== null, 'unknown email gets same generic response');
} else {
  // tokenless link shows the invalid message
  await page.goto(BASE + '/admin/reset-password', { waitUntil: 'networkidle2' });
  check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('invalid'), 'tokenless link shows invalid message');

  await page.goto(BASE + '/admin/reset-password?token=' + TOKEN, { waitUntil: 'networkidle2' });
  await type('New password', 'short');
  await type('Confirm new password', 'short');
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 400));
  check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('12'), 'short password rejected client-side');
  await type('New password', NEW_PW);
  await type('Confirm new password', 'mismatch-mismatch-1');
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 400));
  check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('match'), 'mismatch rejected client-side');
  await type('Confirm new password', NEW_PW);
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1500));
  check((await page.$('[role=status]')) !== null, 'reset success panel shown');

  // same token again -> invalid (single use)
  await page.goto(BASE + '/admin/reset-password?token=' + TOKEN, { waitUntil: 'networkidle2' });
  await type('New password', 'Another-Valid-One-99');
  await type('Confirm new password', 'Another-Valid-One-99');
  await page.click('form button[type=submit]');
  await new Promise((r) => setTimeout(r, 1200));
  check((await page.$eval('[role=alert]', (e) => e.innerText).catch(() => '')).includes('invalid'), 'token single-use enforced in UI');

  // login with the new password
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle2' });
  await type('Email', EMAIL);
  await type('Password', NEW_PW);
  await page.click('form button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/admin', { timeout: 10000 });
  check(true, 'new password logs in');
}

console.log(`\n=== RECOVERY ${PHASE}: ${passes} passed, ${fails} failed ===`);
await browser.close();
process.exit(fails ? 1 : 0);
