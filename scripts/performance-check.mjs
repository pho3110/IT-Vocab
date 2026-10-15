import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Local Chromium diagnostics, not a real-device FPS or field INP benchmark.
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.auditTasks = [];
    new PerformanceObserver(list => window.auditTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('http://localhost:4173/');
  await expect(page.locator('.game-buddy')).toBeVisible();
  const report = { environment: 'Headless Edge, 390x844, CPU slowdown 4x, localhost; not real-device or network-speed measurement' };
  async function sample(name, action) {
    await page.evaluate(() => {
      window.auditStart = performance.now(); window.auditFrames = []; window.auditRunning = true;
      let last;
      function tick(t) { if (!window.auditRunning) return; if (last) window.auditFrames.push(t - last); last = t; requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    });
    await action();
    report[name] = await page.evaluate(() => {
      window.auditRunning = false;
      const frames = window.auditFrames.sort((a, b) => a - b);
      const tasks = window.auditTasks.filter(t => t.start >= window.auditStart);
      return { frames: frames.length, frameIntervalP95Ms: +(frames[Math.floor(frames.length * .95)] || 0).toFixed(1), framesOver50Ms: frames.filter(n => n > 50).length, longTasks: tasks.length, longestTaskMs: +Math.max(0, ...tasks.map(t => t.duration)).toFixed(1) };
    });
  }
  await page.locator('.game-buddy').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
  await page.getByRole('button', { name: 'Từ điển của bạn', exact: true }).click();
  report.initialDictionaryRows = await page.locator('.word-row').count();
  const input = page.getByRole('searchbox');
  const inputTimes = [];
  await sample('search', async () => {
    for (const query of ['a', 'at', 'att', 'attach', 'attachment', '', 'government', '', 'ma hoa', '']) {
      inputTimes.push(await input.evaluate(async (el, value) => {
        const start = performance.now();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return +(performance.now() - start).toFixed(1);
      }, query));
    }
  });
  report.search.inputToTwoFramesMs = inputTimes;
  // Every word must remain reachable while the mounted list stays bounded.
  const seen = new Set();
  for (;;) {
    const rows = page.locator('.word-row');
    expect(await rows.count()).toBeLessThanOrEqual(24);
    // A term can occur in multiple lessons; include its source and definition.
    for (const text of await rows.allTextContents()) seen.add(text);
    const next = page.getByRole('button', { name: 'Trang sau', exact: true });
    if (await next.isDisabled()) break;
    await next.click();
  }
  expect(seen.size).toBe(350);
  report.reachableWords = seen.size;
  await page.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await sample('scroll24WordPage', async () => {
    await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight - innerHeight;
      const start = performance.now();
      await new Promise(resolve => {
        function tick(t) { const p = Math.min((t - start) / 2000, 1); scrollTo(0, height * (1 - p)); if (p < 1) requestAnimationFrame(tick); else resolve(); }
        requestAnimationFrame(tick);
      });
    });
  });
  await page.getByRole('button', { name: 'Các unit', exact: true }).click();
  await page.getByRole('button', { name: /UNIT 01/ }).click();
  await page.getByRole('button', { name: 'Học flashcard', exact: true }).first().click();
  await page.locator('.flashcard').scrollIntoViewIfNeeded();
  await sample('flipTenTimes', async () => {
    for (let i = 0; i < 10; i++) {
      await page.locator('.flashcard').click();
      await page.locator('.flashcard-inner').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
    }
  });
  report.overflow = [];
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const side of [false, true]) {
      if ((await page.locator('.flashcard').getAttribute('aria-pressed')) !== String(side)) await page.locator('.flashcard').click();
      await page.locator('.flashcard-inner').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      report.overflow.push({ width, back: side, overflow }); expect(overflow).toBe(false);
    }
  }
  report.errors = errors; expect(errors).toEqual([]);
  await mkdir('qa', { recursive: true });
  await writeFile('qa/performance-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
