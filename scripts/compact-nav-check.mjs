import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4173/');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  await expect(nav.getByRole('button')).toHaveCount(4);
  for (const name of ['Từ điển của bạn', 'Luyện dịch', 'Đề thi', 'Cài đặt & offline']) {
    await nav.getByRole('button', { name: 'Thêm', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).tap();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(nav.getByRole('button', { name: 'Thêm', exact: true })).toHaveAttribute('aria-current', 'page');
  }
  await nav.getByRole('button', { name: 'Thêm', exact: true }).tap();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await nav.getByRole('button', { name: 'Tổng quan', exact: true }).tap();
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(600);
    const sizes = await nav.getByRole('button').evaluateAll(es => es.map(e => ({ w:e.getBoundingClientRect().width, h:e.getBoundingClientRect().height, f:parseFloat(getComputedStyle(e.querySelector('span')).fontSize) })));
    expect(sizes.every(s => s.w >= 68 && s.h >= 44 && s.f >= 12)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `qa/compact-nav-${width}.png` });
  }
  await nav.getByRole('button', { name: 'Thêm', exact: true }).tap();
  await page.setViewportSize({ width: 1000, height: 844 });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(nav.getByRole('button')).toHaveCount(7);
  expect(errors).toEqual([]);
  console.log('Compact navigation passed: four roomy tabs, all extra routes, modal dismissal, resizing and 320–430px layouts.');
} finally { await browser.close(); }
