import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 850 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  const lens = nav.locator('.liquid-nav-lens');
  const home = nav.getByRole('button', { name: 'Tổng quan', exact: true });
  const library = nav.getByRole('button', { name: 'Từ điển của bạn', exact: true });
  async function aligned(button) {
    await expect.poll(async () => {
      const [a, b] = await Promise.all([lens.boundingBox(), button.boundingBox()]);
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width), Math.abs(a.height - b.height));
    }).toBeLessThan(1);
  }
  await aligned(home);
  await library.hover();
  await expect(home).toHaveAttribute('aria-current', 'page');
  // The lens moves through intermediate positions instead of jumping.
  await page.waitForTimeout(80);
  const [moving, origin, target] = await Promise.all([lens.boundingBox(), home.boundingBox(), library.boundingBox()]);
  expect(moving.x).toBeGreaterThan(origin.x + 1);
  expect(moving.x).toBeLessThan(target.x - 1);
  await aligned(library);
  await page.mouse.move(20, 20);
  await aligned(home);
  await library.focus();
  await aligned(library);
  await page.keyboard.press('Enter');
  await expect(library).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Cài đặt & offline' }).click();
  await expect(lens).toHaveAttribute('data-visible', 'false');
  await home.click();
  await page.mouse.move(20, 20);
  await aligned(home);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await aligned(home);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await library.hover();
  await aligned(library);
  await expect(lens).toHaveCSS('transition-duration', '0s');
  expect(await lens.locator('.liquid-nav-surface').evaluate(el => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 850 });
  await mkdir('qa', { recursive: true });
  await page.screenshot({ path: 'qa/liquid-nav-hover.png' });
  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touch.goto('http://localhost:4173/');
  await touch.getByRole('button', { name: 'Luyện dịch', exact: true }).tap();
  await expect(touch.getByRole('button', { name: 'Luyện dịch', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(touch.getByRole('heading', { name: 'Luyện dịch IT' })).toBeVisible();
  expect(errors).toEqual([]);
  console.log('Liquid nav passed: animated hover and return, keyboard, touch, settings, responsive resize, reduced motion.');
} finally { await browser.close(); }
