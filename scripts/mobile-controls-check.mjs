import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const failures = [];
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4173/');
  async function audit(route) {
    for (const width of [320, 360, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(350);
      const small = await page.locator('button, a.btn, select, input:not([type="file"]):not([type="radio"]):not([type="checkbox"])').evaluateAll(elements => elements.filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').flatMap(e => {
        const r = e.getBoundingClientRect();
        return r.width < 43.5 || r.height < 43.5 ? [{ label: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 45), width: Math.round(r.width), height: Math.round(r.height), class: e.className }] : [];
      }));
      if (small.length) failures.push({ route, width, small });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`).toBe(true);
      const nav = await page.locator('.liquid-nav .nav-item').evaluateAll(es => es.map(e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; }));
      for (let i=1;i<nav.length;i++) expect(nav[i].x >= nav[i-1].x + nav[i-1].w - 1).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await audit('home');
  for (const name of ['Các unit', 'Ôn tập', 'Từ điển của bạn', 'Luyện dịch', 'Cài đặt & offline']) {
    if (!await page.getByRole('button', { name, exact: true }).isVisible()) await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await audit(name);
  }
  await page.getByRole('button', { name: 'Các unit', exact: true }).click();
  await page.getByRole('button', { name: /UNIT 01/ }).click();
  await audit('lessons');
  await page.getByRole('button', { name: 'Học flashcard', exact: true }).first().click();
  await audit('flashcard');
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await page.getByRole('button', { name: 'Đề thi', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo đề trộn & bắt đầu' }).click();
  await audit('exam-reading');
  await page.getByRole('button', { name: 'Viết', exact: true }).click();
  await audit('exam-writing');
  await page.getByRole('button', { name: 'Nói', exact: true }).click();
  await page.getByRole('button', { name: 'Hội thoại', exact: true }).click();
  await audit('exam-dialogue');
  await page.screenshot({ path: 'qa/mobile-controls-dialogue.png', fullPage: true });
  console.log(JSON.stringify(failures, null, 2));
  expect(failures, 'Every visible control needs a 44×44 CSS pixel target').toEqual([]);
  expect(errors).toEqual([]);
  console.log('Mobile controls passed across 320, 360, 390, 430 and 768px.');
} finally { await browser.close(); }

