import { chromium, expect } from '@playwright/test';
import { units } from '../src/data.js';

// Mock the OS speech engine; audible quality still needs a real phone.
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    const engine = new EventTarget();
    window.voiceList = [
      { name: 'Online English', lang: 'en-GB', localService: false, voiceURI: 'remote-en' },
      { name: 'Device English', lang: 'en-US', localService: true, voiceURI: 'local-en' },
    ];
    window.spoken = []; window.speechPlaying = false;
    engine.getVoices = () => window.voiceList;
    engine.cancel = () => { window.speechPlaying = false; window.lastUtterance?.onerror?.({ error: 'canceled' }); };
    engine.speak = u => { window.lastUtterance = u; window.speechPlaying = true; window.spoken.push({ text: u.text, rate: u.rate, voice: u.voice.voiceURI }); };
    Object.defineProperty(window, 'speechSynthesis', { value: engine });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('button', { name: /Sẵn sàng offline/ })).toBeVisible();
  async function openLesson(mode) {
    await page.getByRole('button', { name: 'Các unit', exact: true }).click();
    await page.getByRole('button', { name: /UNIT 01/ }).click();
    await page.getByRole('button', { name: mode, exact: true }).first().click();
  }
  async function flip(rate = .85) {
    const term = await page.locator('.flash-term').evaluate(el => el.firstChild.textContent.trim());
    const before = await page.evaluate(() => window.spoken.length);
    await page.locator('.flashcard').click();
    expect(await page.evaluate(() => window.spoken.length)).toBe(before + 1);
    expect(await page.evaluate(() => window.spoken.at(-1))).toEqual({ text: term, rate, voice: 'local-en' });
    expect(await page.evaluate(() => window.speechPlaying)).toBe(true);
  }
  await openLesson('Học flashcard');
  expect(await page.evaluate(() => window.spoken.length)).toBe(0);
  await flip(); await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'true');
  await flip(); await expect(page.locator('.flashcard')).toHaveAttribute('aria-pressed', 'false');
  await flip();
  await page.getByRole('button', { name: 'Đã nhớ', exact: true }).click();
  expect(await page.evaluate(() => window.speechPlaying)).toBe(false);
  await page.getByRole('button', { name: 'Cài đặt & offline', exact: true }).click();
  await page.getByLabel('Tốc độ', { exact: true }).selectOption('0.7');
  await openLesson('Làm quiz');
  async function answerQuiz(correct) {
    const term = await page.locator('.quiz-card h2').evaluate(el => el.firstChild.textContent.trim());
    const meaning = units[0].lessons[0].words.find(w => w.term === term).meaning;
    const options = page.locator('.quiz-option');
    const labels = await options.locator('span:nth-child(2)').allTextContents();
    const before = await page.evaluate(() => window.spoken.length);
    await options.nth(labels.findIndex(label => correct ? label === meaning : label !== meaning)).click();
    expect(await page.evaluate(() => window.spoken.length)).toBe(before + (correct ? 1 : 0));
    if (correct) expect(await page.evaluate(() => window.spoken.at(-1))).toEqual({ text: term, rate: .7, voice: 'local-en' });
  }
  await answerQuiz(true);
  await page.getByRole('button', { name: 'Từ tiếp theo', exact: true }).click();
  expect(await page.evaluate(() => window.speechPlaying)).toBe(false);
  await answerQuiz(false);
  await context.setOffline(true);
  await openLesson('Học flashcard');
  await flip(.7); await flip(.7);
  await page.getByRole('button', { name: 'Cài đặt & offline', exact: true }).click();
  expect(await page.evaluate(() => window.speechPlaying)).toBe(false);
  await page.getByLabel('Giọng đọc', { exact: true }).selectOption('remote-en');
  await openLesson('Học flashcard');
  const count = await page.evaluate(() => window.spoken.length);
  await page.locator('.flashcard').click();
  await expect(page.getByRole('alert')).toContainText('cần mạng');
  expect(await page.evaluate(() => window.spoken.length)).toBe(count);
  await page.evaluate(() => { window.voiceList = []; speechSynthesis.dispatchEvent(new Event('voiceschanged')); });
  await page.locator('.flashcard').click();
  await expect(page.getByRole('alert')).toContainText('Chưa tìm thấy giọng tiếng Anh');
  await page.evaluate(() => { window.voiceList = [{ name: 'Device English', lang: 'en-US', localService: true, voiceURI: 'local-en' }]; speechSynthesis.dispatchEvent(new Event('voiceschanged')); });
  await flip(.7);
  await page.evaluate(() => window.lastUtterance.onerror({ error: 'audio-busy' }));
  await expect(page.getByRole('alert')).toContainText('Chưa phát được âm thanh');
  await expect(page.locator('.speak-button')).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log('Speech UI passed (mock engine): both flip directions restart the English word; no listen buttons; quiz correct/wrong; speed; cancellation; offline local voice; missing/late/remote voices and errors.');
} finally { await browser.close(); }
