import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/');
  await page.getByRole('button', { name: 'Luyện dịch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Luyện dịch IT' })).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(5);
  await expect(page.locator('.translation-source').first()).toHaveText('Skype is an online service which allows to carry out video calls between Skype users over the Internet.');
  await expect(page.locator('.translation-provenance').first()).toContainText('Handout 01 · Câu 24');
  await expect(page.locator('.translation-source-note').first()).toContainText('an online service');
  await expect(page.locator('.translation-provenance').nth(1)).toContainText('dựng lại');
  await expect(page.getByRole('button', { name: 'Chấm bài / 10' })).toBeDisabled();
  await page.locator('textarea').first().fill('Bản dịch nháp của tôi');
  await page.reload();
  await page.getByRole('button', { name: 'Luyện dịch', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('Bản dịch nháp của tôi');
  await page.getByRole('button', { name: 'Đề 04', exact: true }).click();
  await expect(page.locator('textarea')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Câu 35 · Thiếu dữ liệu' })).toBeVisible();
  for (const textarea of await page.locator('textarea').all()) await textarea.fill('Bản dịch thử nghiệm.');
  // Mock response verifies the rendering contract, not live AI quality.
  await page.route('**/api/grade-translation', async route => {
    const request = route.request().postDataJSON();
    await route.fulfill({ json: { results: request.answers.map(answer => ({ id: answer.id, meaning: 5, terminology: 2, expression: 1, feedback: 'Nhận xét thử nghiệm.', suggestion: 'Gợi ý thử nghiệm.' })) } });
  });
  await page.getByRole('button', { name: 'Chấm bài / 10' }).click();
  await expect(page.getByRole('status')).toContainText('8/10');
  await page.locator('textarea').first().fill('Bản dịch đã sửa');
  await expect(page.locator('.translation-total')).toHaveCount(0);
  await page.unroute('**/api/grade-translation');
  await page.getByRole('button', { name: 'Chấm bài / 10' }).click();
  await expect(page.getByRole('alert')).toContainText('chưa được cấu hình');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await mkdir('qa', { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'qa/translation-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('Translation UI passed: drafts, incomplete source, mock grade, edits, unavailable AI, responsive widths.');
} finally { await browser.close(); }
