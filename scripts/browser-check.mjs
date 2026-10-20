import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { units } from '../src/data.js';
const firstLessonLength = units[0].lessons[0].words.length;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('heading', { name: /Chào bạn/ })).toBeVisible();
  await expect(page.getByText(/HALLOWEEN STUDY CLUB/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Sẵn sàng offline/ })).toBeVisible({ timeout: 20000 });
  await mkdir('qa', { recursive: true });
  await page.screenshot({ path: 'qa/mobile-home.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Các unit', exact: true }).click();
  await page.getByRole('button', { name: /UNIT 01/ }).click();
  await page.getByRole('button', { name: 'Học flashcard', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Đã nhớ', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Chưa nhớ', exact: true })).toBeEnabled();
  const flashcard = page.locator('.flashcard');
  const cardHeight = await flashcard.evaluate(el => el.offsetHeight);
  await flashcard.focus();
  await page.keyboard.press('Enter');
  await expect(flashcard).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('.flashcard-inner').evaluate(el => Number(new DOMMatrix(getComputedStyle(el).transform).m11.toFixed(4)))).toBe(-1);
  expect(await flashcard.evaluate(el => el.offsetHeight)).toBe(cardHeight);
  await page.screenshot({ path: 'qa/mobile-flashcard-back.png', fullPage: true });
  await page.keyboard.press('Space');
  await expect(flashcard).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.locator('.flashcard-inner').evaluate(el => Number(new DOMMatrix(getComputedStyle(el).transform).m11.toFixed(4)))).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.flashcard-inner')).toHaveCSS('transition-duration', '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (let i = 0; i < firstLessonLength; i++) {
    // Both ratings work on the front face; remaining cards exercise flipping.
    if (i > 1) await page.getByRole('button', { name: 'Lật thẻ để xem nghĩa', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đã nhớ', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: i === 0 ? 'Chưa nhớ' : 'Đã nhớ', exact: true }).click();
    if (i === 3) await expect(page.locator('.streak-badge')).toContainText('3 từ đúng liên tiếp');
    if (i === 5) await expect(page.locator('.streak-badge')).toContainText('5 từ đúng liên tiếp');
  }
  await expect(page.getByRole('heading', { name: 'Thêm một bước tiến!' })).toBeVisible();
  await expect(page.locator('.celebration-pumpkin')).toBeVisible();
  await page.screenshot({ path: 'qa/mobile-celebration.png', fullPage: true, animations: 'disabled' });
  await expect(page.locator('.celebration-stars')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Luyện lại 1 từ chưa nhớ' })).toBeVisible();
  await page.getByRole('button', { name: 'Về bài học', exact: true }).click();
  await page.getByRole('button', { name: 'Làm quiz', exact: true }).first().click();
  for (let i = 0; i < firstLessonLength; i++) {
    const term = await page.locator('.quiz-card h2').evaluate(el => el.firstChild.textContent.trim());
    const meaning = units[0].lessons[0].words.find(word => word.term === term).meaning;
    const options = page.locator('.quiz-option');
    const labels = await options.locator('span:nth-child(2)').allTextContents();
    await options.nth(labels.findIndex(label => i === 3 ? label !== meaning : label === meaning)).click();
    await expect(page.locator('.quiz-option.correct')).toHaveCount(1);
    if (i === 2) {
      await expect(page.locator('.streak-badge')).toContainText('3 từ đúng liên tiếp');
      await page.screenshot({ path: 'qa/mobile-quiz-streak.png', fullPage: true, animations: 'disabled' });
    }
    if (i === 3) {
      await expect(page.locator('.streak-badge')).toHaveCount(0);
      await expect(page.locator('.quiz-option.incorrect')).toHaveCount(1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.quiz-option.incorrect')).toHaveCSS('animation-name', 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    await page.getByRole('button', { name: i === firstLessonLength - 1 ? 'Xem kết quả' : 'Từ tiếp theo', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Thêm một bước tiến!' })).toBeVisible();
  await page.getByRole('button', { name: 'Từ điển của bạn', exact: true }).click();
  await expect(page.locator('.word-row')).toHaveCount(24);
  const libraryNodes = await page.locator('*').count();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.locator('.word-row')).toHaveCount(24);
  await expect(page.locator('.result-count')).toContainText('25–48');
  await page.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await expect(page.locator('.result-count')).toContainText('1–24');
  await page.getByRole('searchbox').fill('government');
  await expect(page.locator('.word-row')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'government (n)', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('');
  await expect(page.locator('.word-row')).toHaveCount(24);
  await page.getByRole('searchbox').fill('ma hoa');
  await expect(page.locator('.word-row')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'encrypt (v)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu từ encrypt', exact: true }).click();
  await page.getByRole('button', { name: 'Đã lưu (1)', exact: true }).click();
  await expect(page.locator('.word-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Đã lưu (1)', exact: true }).click();
  await page.getByRole('searchbox').fill('');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Cài đặt & offline', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('it-words-progress-v1'));
  expect(JSON.parse(before).favorites).toContain('3D-5');
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByRole('status')).toContainText('không đúng định dạng');
  // The entrance animation must preserve the toast's horizontal centering.
  const toastCenterError = await page.locator('.toast').evaluate(el => {
    const animations = el.getAnimations();
    for (const animation of animations) { animation.pause(); animation.currentTime = 100; }
    const rect = el.getBoundingClientRect();
    const error = Math.abs(rect.left + rect.width / 2 - innerWidth / 2);
    for (const animation of animations) animation.play();
    return error;
  });
  expect(toastCenterError).toBeLessThan(1);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('it-words-progress-v1')))).toEqual(JSON.parse(before));
  await page.reload();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('it-words-progress-v1')))).toEqual(JSON.parse(before));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Chào bạn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Đang offline/ })).toBeVisible();
  await page.getByRole('button', { name: 'Từ điển của bạn', exact: true }).click();
  await page.getByRole('searchbox').fill('government');
  await expect(page.getByRole('heading', { name: 'government (n)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Các unit', exact: true }).click();
  await page.getByRole('button', { name: /UNIT 07/ }).click();
  await page.getByRole('button', { name: 'Học flashcard', exact: true }).first().click();
  await page.getByRole('button', { name: 'Lật thẻ để xem nghĩa', exact: true }).click();
  await page.getByRole('button', { name: 'Đã nhớ', exact: true }).click();
  await page.screenshot({ path: 'qa/mobile-offline-study.png', fullPage: true });
  expect(errors).toEqual([]);
  await context.close();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto('http://localhost:4173/');
  await desktopPage.screenshot({ path: 'qa/desktop-home.png', fullPage: true });
  // Isolate CDP performance emulation from the separate offline context.
  const cdp = await desktop.newCDPSession(desktopPage);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await desktopPage.setViewportSize({ width: 390, height: 844 });
  await desktopPage.getByRole('button', { name: 'Từ điển của bạn', exact: true }).click();
  await desktopPage.getByRole('searchbox').fill('attachment');
  await expect(desktopPage.getByRole('heading', { name: 'attachment (n)', exact: true })).toBeVisible();
  await cdp.detach();
  await desktop.close();
  console.log(`Browser QA passed: Halloween theme; 320/390/768px layouts; dictionary 24-row pagination and global search, including at 4x CPU slowdown; favorites; flashcards; quiz; backup; progress persistence; real offline search and learning. Initial dictionary: 24 rows, ${libraryNodes} DOM elements (previously 350 rows / 4285 elements).`);
} finally { await browser.close(); }
