import pkg from '/home/khuslen/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1000, height: 850 } }).then((c) => c.newPage());
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE CRASH:', e.message));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.getByText('Add a book').click();
await page.waitForTimeout(400);

// open the date picker popover
await page.getByRole('button', { name: /Pick a publication date/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/datepicker-open.png' });

// pick a day (15th of currently shown month)
const day = page.getByRole('button', { name: '15', exact: true }).first();
await day.click();
await page.waitForTimeout(400);
const hiddenVal = await page.evaluate(() => document.querySelector('input[name="date"]')?.value);
console.log('hidden date value after pick:', hiddenVal);

// fill the rest and submit
const t = 'DateBook ' + Date.now();
await page.fill('input[name="title"]', t);
await page.fill('input[name="author"]', 'DP Author');
await page.fill('textarea[name="text"]', 'Alpha para.\n\nBeta para.');
await page.getByRole('button', { name: 'Add to library' }).click();
await page.waitForTimeout(2500);
console.log('on shelf:', (await page.getByText(t).count()) > 0 ? 'YES' : 'NO');

// verify stored json has year + published
const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g,'');
console.log('expected slug:', slug);
await browser.close();
