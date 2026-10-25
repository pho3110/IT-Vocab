import test from 'node:test';
import assert from 'node:assert/strict';
import { translationTests, translationSourceCounts, validateGrade } from '../src/translations.js';
import handoutParagraphs from '../content/translation-handout-paragraphs.json' with { type: 'json' };
import keys from '../content/translation-key.json' with { type: 'json' };

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

test('handout replacements retain original answer keys and disclose partial matches', () => {
  const questions = translationTests.flatMap(t => t.questions);
  assert.deepEqual(translationSourceCounts, { handout: 5, reconstructed: 19, missing: 1 });
  const matches = questions.filter(q => q.source.kind === 'handout');
  assert.deepEqual(matches.map(q => [q.id, q.source.handoutNumber]), [
    ['test-1-31', 24], ['test-2-35', 39], ['test-4-34', 35], ['test-5-33', 29], ['test-5-34', 18],
  ]);
  for (const q of matches) {
    const sourceIndex = handoutParagraphs.indexOf(String(q.source.handoutNumber));
    assert.equal(q.english, handoutParagraphs[sourceIndex + 1]);
    assert.ok(q.source.note);
  }
  assert.equal(matches.filter(q => q.source.match === 'partial').length, 3);
  assert.deepEqual(questions.map(q => q.reference), keys.flatMap(t => t.questions.map(q => q.reference)));
  assert.match(matches.find(q => q.id === 'test-5-33').english, /TCP\/IP/);
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
