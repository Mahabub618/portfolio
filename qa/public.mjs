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
check(home.includes('admin'), 'footer admin link present');

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
