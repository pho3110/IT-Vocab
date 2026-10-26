import { chromium, expect } from '@playwright/test';
import { createExam, EXAM_STORAGE_KEY } from '../src/exam.js';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function load(seed, version = 2) {
    await page.goto('http://localhost:4173/');
    await page.evaluate(({ key, seed, version }) => localStorage.setItem(key, JSON.stringify({ version, seed, startedAt: 1700000000000, answers: {}, submitted: false })), { key: EXAM_STORAGE_KEY, seed, version });
    await page.reload();
    await page.getByRole('button', { name: 'Đề thi', exact: true }).click();
  }
  const seeds = new Map();
  let readingSeed, emailSeed;
  for (let seed = 0; seed < 300; seed++) {
    const exam = createExam(seed);
    seeds.set(exam.speaking[3].id, seed);
    if (exam.reading.some(p => p.id.startsWith('review-'))) readingSeed = seed;
    if (exam.email.id.startsWith('review-')) emailSeed = seed;
  }
  expect(seeds.size).toBe(4);
  for (const [id, seed] of seeds) {
    await load(seed);
    await page.getByRole('button', { name: 'Nói', exact: true }).click();
    await page.getByRole('button', { name: 'Hội thoại', exact: true }).click();
    const dialogue = createExam(seed).speaking[3];
    expect(dialogue.id).toBe(id);
    await expect(page.getByRole('heading', { name: dialogue.title, exact: true })).toBeVisible();
    const roles = page.getByRole('group', { name: 'Vai hội thoại' });
    await expect(roles.getByRole('button')).toHaveCount(2);
    await roles.getByRole('button').nth(1).click();
    await expect(page.locator('.exam-passage')).toContainText(dialogue.roles[1][1][0]);
    await page.locator('#exam-speaking-notes').fill('My dialogue notes');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.reload();
    await page.getByRole('button', { name: 'Đề thi', exact: true }).click();
    await page.getByRole('button', { name: 'Nói', exact: true }).click();
    await page.getByRole('button', { name: 'Hội thoại', exact: true }).click();
    await expect(page.locator('#exam-speaking-notes')).toHaveValue('My dialogue notes');
    await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.exam-feedback')).toContainText(dialogue.sample);
  }
  await load(readingSeed);
  await expect(page.locator('.exam-passage')).toHaveCount(2);
  expect(await page.locator('.exam-source').allTextContents()).toEqual(expect.arrayContaining([expect.stringContaining('Phiếu Tổng Ôn')]));
  await load(emailSeed);
  await page.getByRole('button', { name: 'Viết', exact: true }).click();
  await expect(page.getByText(/screen brightness to Power saver/)).toBeVisible();
  await load(123, 1);
  await page.getByRole('button', { name: 'Nói', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hội thoại', exact: true })).toHaveCount(0);
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), EXAM_STORAGE_KEY)).version).toBe(1);
  expect(errors).toEqual([]);
  console.log('Master review: all four dialogues, role switching, draft restore, references, reading, email, responsive layouts and legacy drafts passed.');
} finally { await browser.close(); }
