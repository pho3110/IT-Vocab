import { chromium, expect } from '@playwright/test';

// Mock the OS voice engine: verifies app behavior, not audible voice quality.
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    const engine = new EventTarget();
    const local = { name: 'English device', lang: 'en-US', localService: true, voiceURI: 'local-en' };
    const remote = { name: 'English online', lang: 'en-GB', localService: false, voiceURI: 'remote-en' };
    window.voiceList = [remote, local]; window.spoken = []; window.cancelCount = 0;
    engine.getVoices = () => window.voiceList;
    engine.cancel = () => { window.cancelCount++; window.lastUtterance?.onerror?.({ error: 'canceled' }); };
    engine.speak = u => { window.lastUtterance = u; window.spoken.push({ text: u.text, rate: u.rate, voice: u.voice.voiceURI }); };
    Object.defineProperty(window, 'speechSynthesis', { value: engine });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('button', { name: /Sẵn sàng offline/ })).toBeVisible();
  await page.getByRole('button', { name: 'Từ điển của bạn', exact: true }).click();
  const listen = page.locator('.speak-button').first();
  await listen.click();
  await expect(listen).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.spoken.at(-1).voice)).toBe('local-en');
  await listen.click();
  await expect(listen).toHaveAttribute('aria-pressed', 'false');
  await listen.click();
  await page.getByRole('searchbox').fill('government');
  await expect(page.locator('.speak-button')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.speak-button').click();
  expect(await page.evaluate(() => window.spoken.at(-1).text)).toBe('government');
  await page.getByRole('button', { name: 'Các unit', exact: true }).click();
  await page.getByRole('button', { name: /UNIT 01/ }).click();
  await page.getByRole('button', { name: 'Học flashcard', exact: true }).first().click();
  await page.locator('.speak-button').click();
  await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.flashcard').click();
  await page.getByRole('button', { name: 'Đã nhớ', exact: true }).click();
  await expect(page.locator('.speak-button')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Cài đặt & offline', exact: true }).click();
  await page.getByLabel('Tốc độ', { exact: true }).selectOption('0.7');
  await page.locator('.speak-button').click();
  expect(await page.evaluate(() => window.spoken.at(-1).rate)).toBe(.7);
  await page.evaluate(() => window.lastUtterance.onend());
  await expect(page.locator('.speak-button')).toHaveAttribute('aria-pressed', 'false');
  await context.setOffline(true);
  await page.locator('.speak-button').click();
  await expect(page.locator('.speak-button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Giọng đọc', { exact: true }).selectOption('remote-en');
  const spokenCount = await page.evaluate(() => window.spoken.length);
  await page.locator('.speak-button').click();
  await expect(page.getByRole('alert')).toContainText('cần mạng');
  expect(await page.evaluate(() => window.spoken.length)).toBe(spokenCount);
  await page.evaluate(() => { window.voiceList = []; speechSynthesis.dispatchEvent(new Event('voiceschanged')); });
  await page.locator('.speak-button').click();
  await expect(page.getByRole('alert')).toContainText('Chưa tìm thấy giọng tiếng Anh');
  await page.evaluate(() => { window.voiceList = [{ name: 'New voice', lang: 'en-US', localService: true, voiceURI: 'new' }]; speechSynthesis.dispatchEvent(new Event('voiceschanged')); });
  await page.locator('.speak-button').click();
  await page.evaluate(() => window.lastUtterance.onerror({ error: 'audio-busy' }));
  await expect(page.getByRole('alert')).toContainText('Chưa phát được âm thanh');
  await expect(page.locator('.speak-button')).toHaveAttribute('aria-pressed', 'false');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
  await context.close();
  console.log('Speech UI checks passed with mocked engine: local preference, stop/replay, search/navigation/card cancellation, speed, offline local/remote, missing/late voices, engine errors, responsive settings. Real-device audio still needs listening verification.');
} finally { await browser.close(); }
