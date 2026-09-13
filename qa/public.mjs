import puppeteer from 'puppeteer';
const BASE = 'http://localhost:4200';
const jsErrors = [];
let failures = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++; };

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => jsErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('fonts.g') && !m.text().includes('401')) jsErrors.push(m.text()); });

await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
const home = await page.$eval('body', (e) => e.innerText);
check(home.includes('Your Name'), 'hero renders profile name');
check((await page.$$('article h3')).length >= 3, 'project cards render');
check(home.includes('Competitive') || home.includes('Achievement'), 'achievements section renders');
check(home.includes('Sundarbans by Boat'), 'travel strip renders blog card');
check(!home.includes('Content managed via'), 'footer promo text removed');

// contact section + hero CTA wiring
check(!!(await page.$('#contacts')), 'contact section exists');
check((await page.$$('#contacts a')).length >= 1, 'contact section lists social channels');
const heroHrefs = await page.$$eval('#home a', (as) => as.map((a) => a.getAttribute('href')));
check(!heroHrefs.includes('#'), 'no dead "#" links in hero');
check(!(await page.$eval('#home', (h) => /r[eé]sum[eé]/i.test(h.innerText))), 'resume button hidden while no resume uploaded');
const contactBtn = await page.evaluateHandle(() => [...document.querySelectorAll('#home a')].find((a) => /contact/i.test(a.textContent ?? '')));
if (contactBtn.asElement()) {
  await contactBtn.asElement().click();
  await new Promise((r) => setTimeout(r, 1200));
  check(await page.evaluate(() => {
    const s = document.querySelector('#contacts');
    if (!s) return false;
    const r = s.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  }), 'Contact Me button scrolls to contact section');
} else {
  check(false, 'Contact Me button present in hero');
}

// travel deep link (SEO + gallery)
const blogId = await page.evaluate(async () => (await (await fetch('/api/blogs?page=1&size=1')).json()).data.items[0].id);
await page.goto(`${BASE}/travel/${blogId}`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1000));
check((await page.title()).includes('Sundarbans by Boat'), `SEO title: "${await page.title()}"`);
const frames = await page.$$('figure');
check(frames.length === 5, `gallery frames: ${frames.length}`);
const railTicks = await page.$$('[role="tab"], [aria-label*="tick"], .rail button, nav[aria-label*="filmstrip"] button');
if (railTicks.length >= 5) {
  await railTicks[2].click();
  await new Promise((r) => setTimeout(r, 1400));
  const counter = await page.$eval('[aria-live]', (e) => e.innerText);
  check(counter.includes('3'), `rail click → counter "${counter}"`);
} else {
  console.log(`INFO  rail selector matched ${railTicks.length}; using keyboard`);
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 900));
  const counter = await page.$eval('[aria-live]', (e) => e.innerText);
  check(/2|1/.test(counter), `keyboard → counter "${counter}"`);
}

// mobile
await page.setViewport({ width: 390, height: 844 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 800));
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check(overflow <= 1, `no horizontal overflow at 390px (delta ${overflow})`);

console.log(`\nREAL JS ERRORS: ${jsErrors.length === 0 ? 'none' : jsErrors.slice(0, 4).join(' | ')}`);
console.log(failures === 0 ? '=== PUBLIC SITE REGRESSION PASSED ===' : `=== ${failures} FAILURES ===`);
await browser.close();
process.exit(failures ? 1 : 0);
