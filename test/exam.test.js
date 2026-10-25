import test from 'node:test';
import assert from 'node:assert/strict';
import { BANK_VERSION, bankCounts, createExam, objectiveQuestions, examAnswerIds, gradeObjective, restoreExam, countWords, usableLanguage, EXAM_DURATION } from '../src/exam.js';
import { readingPassages } from '../content/exam-reading.js';
import { emailTasks, examTranslations } from '../content/exam-writing.js';
import { speakingQuestions } from '../content/exam-speaking.js';

test('source bank covers six units, ten complete reading groups and authored open-answer references', () => {
  assert.deepEqual(bankCounts, { language: 117, reading: 50, passages: 10, translations: 80, email: 6, speaking: 22 });
  assert.deepEqual([...new Set(usableLanguage.map(q => q.unit))].sort(), [2, 3, 4, 5, 6, 7]);
  assert.ok(!usableLanguage.some(q => ['u2-language-11', 'u5-language-6', 'u5-language-17'].includes(q.id)));
  const questions = [...usableLanguage, ...readingPassages.flatMap(p => p.questions)];
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
  for (const task of emailTasks) {
    assert.ok(countWords(task.sample) >= task.minWords && countWords(task.sample) <= task.maxWords, task.id);
    assert.ok(task.steps.length >= 3 && task.source);
  }
  assert.ok(speakingQuestions.every(q => q.prompt && q.sample && q.source));
});

test('mixed exams are reproducible, balanced, unique and keep questions attached to their passages', () => {
  const start = 1700000000000;
  assert.deepEqual(createExam(123, start), createExam(123, start));
  assert.notDeepEqual(createExam(123, start).language, createExam(124, start).language);
  for (let seed = 0; seed < 80; seed++) {
    const exam = createExam(seed, start);
    assert.equal(exam.language.length, 20);
    assert.equal(exam.language.filter(q => q.kind === 'matching').length, 5);
    assert.equal(new Set(exam.language.map(q => q.unit)).size, 6);
    assert.equal(exam.reading.length, 2);
    assert.notEqual(exam.reading[0].unit, exam.reading[1].unit);
    assert.deepEqual(exam.reading.map(p => p.kind), ['choice', 'true-false']);
    for (const p of exam.reading) {
      const original = readingPassages.find(row => row.id === p.id);
      assert.equal(p.text, original.text);
      assert.deepEqual(new Set(p.questions.map(q => q.id)), new Set(original.questions.map(q => q.id)));
    }
    assert.equal(exam.translations.length, 5);
    assert.equal(exam.speaking.length, 3);
    assert.equal(examAnswerIds(exam).length, 39);
    assert.equal(new Set(examAnswerIds(exam)).size, 39);
    assert.equal(exam.deadline - exam.startedAt, EXAM_DURATION);
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
  assert.equal(restoreExam(JSON.stringify({ ...draft, startedAt: startedAt - EXAM_DURATION - 1000 })).submitted, true);
  for (const changed of [{ version: 999 }, { seed: -1 }, { seed: 2 ** 32 }, { startedAt: 'bad' }, { submitted: 1 }, { answers: [] }, { answers: { unknown: 'text' } }, { answers: { [exam.email.id]: 'x'.repeat(16001) } }]) {
    assert.throws(() => restoreExam(JSON.stringify({ ...draft, ...changed })));
  }
});
