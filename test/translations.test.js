import test from 'node:test';
import assert from 'node:assert/strict';
import { translationTests, validateGrade } from '../src/translations.js';

test('five translation tests preserve 25 answer keys and exclude the incomplete source', () => {
  assert.equal(translationTests.length, 5);
  const questions = translationTests.flatMap(t => t.questions);
  assert.equal(questions.length, 25);
  assert.equal(new Set(questions.map(q => q.id)).size, 25);
  for (const t of translationTests) assert.deepEqual(t.questions.map(q => q.number), [31, 32, 33, 34, 35]);
  assert.deepEqual(questions.filter(q => q.incomplete).map(q => q.id), ['test-4-35']);
  assert.equal(questions.filter(q => q.english).length, 24);
  assert.ok(questions.every(q => q.reference.length > 20));
});

test('grading validates coverage, bounded criteria, and computes its own average', () => {
  const questions = translationTests[3].questions;
  const results = questions.filter(q => !q.incomplete).map(q => ({ id: q.id, meaning: 5, terminology: 1.5, expression: 2, feedback: 'Đủ ý.', suggestion: 'Bản dịch sửa.' }));
  assert.equal(validateGrade({ results, score: 100 }, questions).score, 8.5);
  assert.throws(() => validateGrade({ results: results.slice(1) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, meaning: 7 })) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, meaning: '5' })) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, id: results[0].id })) }, questions));
});
