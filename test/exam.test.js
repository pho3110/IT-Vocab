import test from 'node:test';
import { reviewReading, reviewEmail, reviewSpeaking, reviewDialogues, reviewLanguage } from '../content/exam-master-review.js';
import assert from 'node:assert/strict';
import { BANK_VERSION, bankCounts, createExam, objectiveQuestions, examAnswerIds, gradeObjective, restoreExam, countWords, usableLanguage } from '../src/exam.js';
import { readingPassages } from '../content/exam-reading.js';
import { emailTasks, examTranslations } from '../content/exam-writing.js';
import { speakingQuestions } from '../content/exam-speaking.js';

test('source bank includes master review and authored open-answer references', () => {
  assert.deepEqual(bankCounts, { language: 146, reading: 60, passages: 12, translations: 80, email: 7, speaking: 30, dialogues: 4 });
  assert.deepEqual([...new Set(usableLanguage.map(q => q.unit))].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(!usableLanguage.some(q => ['u2-language-11', 'u5-language-6', 'u5-language-17'].includes(q.id)));
  const questions = [...usableLanguage, ...[...readingPassages, ...reviewReading].flatMap(p => p.questions)];
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const q of questions) {
    assert.ok(q.options.includes(q.answer), q.id);
    assert.equal(new Set(q.options).size, q.options.length, q.id);
    assert.ok(q.explanation && q.source, q.id);
  }
  for (const p of readingPassages) {
    assert.equal(p.questions.length, 5);
    assert.ok(p.text.length > 700, p.id);
    assert.ok(p.questions.every(q => q.unit === p.unit));
  }
  assert.equal(examTranslations.length, 30);
  assert.ok(examTranslations.every(q => q.reference.length > 30));
  for (const task of [...emailTasks, ...reviewEmail]) {
    assert.ok(countWords(task.sample) >= task.minWords && countWords(task.sample) <= task.maxWords, task.id);
    assert.ok(task.steps.length >= 3 && task.source);
  }
  assert.ok(speakingQuestions.every(q => q.prompt && q.sample && q.source));
});

test('legacy drafts retain the old bank while all new sources are reachable', () => {
  const exam = createExam(123, 1700000000000, 1);
  const answers = { [exam.language[0].id]: exam.language[0].answer };
  assert.deepEqual(restoreExam(JSON.stringify({ version: 1, seed: exam.seed, startedAt: exam.startedAt, answers, submitted: false })).exam, exam);
  assert.equal(exam.speaking.length, 3);
  assert.ok(exam.language.every(q => !q.id.startsWith('review-')));
  const seen = new Set();
  for (let seed = 0; seed < 600; seed++) {
    const current = createExam(seed, 1700000000000);
    for (const q of [...current.language, ...current.reading, current.email, ...current.speaking]) seen.add(q.id);
  }
  for (const q of [...reviewLanguage, ...reviewReading, ...reviewEmail, ...reviewSpeaking, ...reviewDialogues]) assert.ok(seen.has(q.id), q.id);
  assert.ok(!reviewLanguage.some(q => q.id === 'review-language-7'));
});

test('mixed exams are reproducible, balanced, unique and keep questions attached to their passages', () => {
  const start = 1700000000000;
  assert.deepEqual(createExam(123, start), createExam(123, start));
  assert.notDeepEqual(createExam(123, start).language, createExam(124, start).language);
  for (let seed = 0; seed < 80; seed++) {
    const exam = createExam(seed, start);
    assert.equal(exam.language.length, 20);
    assert.equal(exam.language.filter(q => q.kind === 'matching').length, 5);
    assert.equal(new Set(exam.language.map(q => q.unit)).size, 8);
    assert.equal(exam.reading.length, 2);
    assert.notEqual(exam.reading[0].unit, exam.reading[1].unit);
    assert.deepEqual(exam.reading.map(p => p.kind), ['choice', 'true-false']);
    for (const p of exam.reading) {
      const original = [...readingPassages, ...reviewReading].find(row => row.id === p.id);
      assert.equal(p.text, original.text);
      assert.deepEqual(new Set(p.questions.map(q => q.id)), new Set(original.questions.map(q => q.id)));
    }
    assert.equal(exam.translations.length, 5);
    assert.equal(exam.speaking.length, 4);
    assert.equal(exam.speaking[3].kind, 'dialogue');
    assert.equal(examAnswerIds(exam).length, 40);
    assert.equal(new Set(examAnswerIds(exam)).size, 40);
    assert.equal(exam.deadline, undefined);
    const matching = exam.language.slice(0, 5);
    assert.equal(matching[0].options.length, 6);
    assert.equal(new Set(matching[0].options).size, 6);
    assert.equal(new Set(matching.map(q => q.answer)).size, 5);
    for (const q of matching) {
      assert.ok(q.term);
      assert.deepEqual(q.options, matching[0].options);
      assert.ok(q.options.includes(q.answer));
    }
    const correct = Object.fromEntries(objectiveQuestions(exam).map(q => [q.id, q.answer]));
    assert.deepEqual(gradeObjective(exam, correct), { correct: 30, total: 30, score: 10 });
    assert.deepEqual(gradeObjective(exam, {}), { correct: 0, total: 30, score: 0 });
  }
});

test('draft restore reproduces an exam without trusting imported question text or accepting malformed answers', () => {
  const startedAt = Date.now();
  const seed = 456;
  const exam = createExam(seed, startedAt);
  const answers = { [exam.language[0].id]: exam.language[0].answer, [exam.email.id]: 'My email draft' };
  const draft = { version: BANK_VERSION, seed, startedAt, answers, submitted: false };
  assert.deepEqual(restoreExam(JSON.stringify(draft)), { exam, answers, submitted: false });
  assert.equal(restoreExam(JSON.stringify({ ...draft, startedAt: startedAt - 7 * 86400000 })).submitted, false);
  assert.equal(restoreExam(JSON.stringify({ ...draft, submitted: true })).submitted, true);
  for (const changed of [{ version: 999 }, { seed: -1 }, { seed: 2 ** 32 }, { startedAt: 'bad' }, { submitted: 1 }, { answers: [] }, { answers: { unknown: 'text' } }, { answers: { [exam.email.id]: 'x'.repeat(16001) } }]) {
    assert.throws(() => restoreExam(JSON.stringify({ ...draft, ...changed })));
  }
});
