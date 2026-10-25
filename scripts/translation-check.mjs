import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { translationQuestions } from '../src/translations.js';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4173/');
  const legacyDraft = JSON.stringify({ 'test-1-31': 'Bản nháp bộ đề cũ' });
  await page.evaluate(value => localStorage.setItem('it-words-translations-v1', value), legacyDraft);
  await page.getByRole('button', { name: 'Luyện dịch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Luyện dịch IT' })).toBeVisible();
  await expect(page.getByText(/50 câu nguyên văn Handout 01/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Đề \d/ })).toHaveCount(0);
  await expect(page.locator('textarea')).toHaveCount(10);
  await expect(page.locator('textarea').first()).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Chấm bài / 10' })).toBeDisabled();
  await page.locator('textarea').first().fill('Bản dịch nháp câu một');
  await page.getByRole('button', { name: 'Xem đáp án tham khảo' }).first().click();
  await expect(page.locator('.translation-reference').first()).toHaveText(translationQuestions[0].reference);
  const seen = [];
  for (let index = 0; index < 5; index++) {
    await page.getByRole('button', { name: `Câu ${index * 10 + 1}–${index * 10 + 10}`, exact: true }).click();
    const sourceTexts = await page.locator('.translation-source').allTextContents();
    expect(sourceTexts).toEqual(translationQuestions.slice(index * 10, (index + 1) * 10).map(q => q.english));
    seen.push(...sourceTexts);
    await expect(page.locator('textarea')).toHaveCount(10);
  }
  expect(seen).toHaveLength(50);
  await page.locator('textarea').last().fill('Bản dịch câu năm mươi');
  await page.getByRole('button', { name: 'Xem đáp án tham khảo' }).last().click();
  await expect(page.locator('.translation-reference').last()).toHaveText(translationQuestions[49].reference);
  await page.reload();
  await page.getByRole('button', { name: 'Luyện dịch', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('Bản dịch nháp câu một');
  await page.getByRole('button', { name: 'Câu 41–50', exact: true }).click();
  await expect(page.locator('textarea').last()).toHaveValue('Bản dịch câu năm mươi');
  expect(await page.evaluate(() => localStorage.getItem('it-words-translations-v1'))).toBe(legacyDraft);
  // Mock response verifies partial-submission and rendering, not live AI quality.
  await page.route('**/api/grade-translation', async route => {
    const request = route.request().postDataJSON();
    expect(request.handoutId).toBe('handout-01');
    expect(request.answers).toEqual([{ id: translationQuestions[49].id, text: 'Bản dịch câu năm mươi' }]);
    await route.fulfill({ json: { results: request.answers.map(answer => ({ id: answer.id, meaning: 5, terminology: 2, expression: 1, feedback: 'Nhận xét thử nghiệm.', suggestion: 'Gợi ý thử nghiệm.' })) } });
  });
  await page.getByRole('button', { name: 'Chấm bài / 10' }).click();
  await expect(page.locator('.translation-total')).toContainText('Điểm 1 câu đã chấm: 8/10');
  await page.locator('textarea').last().fill('Bản dịch đã sửa');
  await expect(page.locator('.translation-total')).toHaveCount(0);
  await page.unroute('**/api/grade-translation');
  await page.getByRole('button', { name: 'Chấm bài / 10' }).click();
  await expect(page.getByRole('alert')).toContainText('chưa được cấu hình');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await expect(page.getByRole('button', { name: 'Sẵn sàng offline' })).toBeVisible();
  await page.context().setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Luyện dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Câu 41–50', exact: true }).click();
  await expect(page.locator('textarea').last()).toHaveValue('Bản dịch đã sửa');
  await expect(page.getByRole('button', { name: 'Chấm bài / 10' })).toBeDisabled();
  await page.getByRole('button', { name: 'Xem đáp án tham khảo' }).last().click();
  await expect(page.locator('.translation-reference').last()).toHaveText(translationQuestions[49].reference);
  await mkdir('qa', { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'qa/translation-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('Translation UI passed: all 50 source sentences, answers, pagination, isolated drafts, partial mock grade, offline practice, responsive widths.');
} finally { await browser.close(); }
