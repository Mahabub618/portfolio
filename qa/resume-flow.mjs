// Resume upload round trip: admin uploads a PDF -> hero "Download Résumé" appears -> revert.
// Mutating but always restores resumeUrl to its original value. Local use (dev creds).
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4200';
const EMAIL = process.env.EMAIL || 'dev@portfolio.local';
const PASSWORD = process.env.PASSWORD || 'DevPass#2026!';
let fails = 0, passes = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? passes++ : fails++; };

// minimal valid-ish PDF for upload validation
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
fs.writeFileSync('/tmp/test-resume.pdf', PDF);

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));

// login
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

// upload resume via profile editor
await page.goto(BASE + '/admin/profile', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 800));
const fileInput = await page.$('input[type=file][accept="application/pdf"]');
check(!!fileInput, 'resume PDF input present in admin profile editor');
await fileInput.uploadFile('/tmp/test-resume.pdf');
await new Promise((r) => setTimeout(r, 2500));
const resumeUrlValue = await page.$eval('input[type=url]', (e) => e.value).catch(() => '');
check(/\.pdf/.test(resumeUrlValue), `upload filled resume URL (${resumeUrlValue.slice(0, 60)})`);

// save profile (the Save button lives in the page header, not inside the form)
const saveBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll('header button')].find((b) => /save profile/i.test(b.textContent ?? '')));
await saveBtn.asElement().click();
await new Promise((r) => setTimeout(r, 1500));
check((await page.$eval('app-toast-host', (e) => e.innerText).catch(() => '')).includes('saved'), 'profile saved toast');

// hero shows the resume button now
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
const resumeBtn = await page.evaluate(() => {
  const a = [...document.querySelectorAll('#home a')].find((x) => /r[eé]sum[eé]/i.test(x.textContent ?? ''));
  return a ? a.getAttribute('href') : null;
});
check(!!resumeBtn && /\.pdf/.test(resumeBtn), `hero resume button present -> ${(resumeBtn || '').slice(0, 60)}`);
// Cloudinary-hosted resumes get fl_attachment (forced download); disk-hosted (local dev) are served as-is
if (resumeBtn && /\/upload\//.test(resumeBtn)) {
  check(resumeBtn.includes('fl_attachment'), 'Cloudinary resume link forces download (fl_attachment)', resumeBtn);
} else {
  check(!!resumeBtn && !resumeBtn.includes('fl_attachment'), 'disk-hosted resume link served as-is');
}

// revert: resumeUrl back to null via API (keeps everything else intact)
const reverted = await page.evaluate(async () => {
  const token = localStorage.getItem('portfolio.jwt');
  const current = (await (await fetch('/api/profile')).json()).data;
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ ...current, resumeUrl: null }),
  });
  return res.ok;
});
check(reverted, 'resumeUrl reverted to null');
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
check(!(await page.$eval('#home', (h) => /r[eé]sum[eé]/i.test(h.innerText))), 'resume button hidden again after revert');

console.log(`\n=== RESUME FLOW QA: ${passes} passed, ${fails} failed ===`);
await browser.close();
process.exit(fails ? 1 : 0);
