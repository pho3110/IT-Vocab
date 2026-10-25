import test from 'node:test';
import assert from 'node:assert/strict';
import { translationQuestions, TRANSLATION_PAGE_SIZE, validateGrade } from '../src/translations.js';
import handoutParagraphs from '../content/translation-handout-paragraphs.json' with { type: 'json' };
import vietnamese from '../content/handout01-vietnamese.json' with { type: 'json' };

test('all 50 handout sentences retain exact source order and have Vietnamese reference answers', () => {
  const sourcePairs = handoutParagraphs.slice(4);
  assert.equal(sourcePairs.length, 100);
  assert.equal(translationQuestions.length, 50);
  assert.equal(vietnamese.length, 50);
  assert.equal(new Set(translationQuestions.map(q => q.id)).size, 50);
  for (let i = 0; i < 50; i++) {
    const question = translationQuestions[i];
    assert.equal(question.number, i + 1);
    assert.equal(String(question.number), sourcePairs[i * 2]);
    assert.equal(question.english, sourcePairs[i * 2 + 1]);
    assert.match(question.id, /^handout-01-\d{2}$/);
    assert.ok(question.reference.length > 30, `missing answer ${i + 1}`);
    assert.match(question.reference, /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/);
  }
  assert.match(translationQuestions[7].reference, /số học và logic/);
  assert.match(translationQuestions[28].reference, /TCP\/IP/);
  assert.match(translationQuestions[49].reference, /khóa chính/);
});

test('ten-question pagination includes the near-duplicate source sentences with separate IDs', () => {
  const pages = Array.from({ length: Math.ceil(translationQuestions.length / TRANSLATION_PAGE_SIZE) }, (_, index) => translationQuestions.slice(index * TRANSLATION_PAGE_SIZE, (index + 1) * TRANSLATION_PAGE_SIZE));
  assert.ok(pages.every(page => page.length === 10));
  assert.deepEqual(pages.flat(), translationQuestions);
  assert.notEqual(translationQuestions[29].id, translationQuestions[30].id);
  assert.equal(translationQuestions[29].reference, translationQuestions[30].reference);
  assert.ok(translationQuestions[29].note);
  assert.ok(translationQuestions[30].note);
});

test('grading covers only submitted questions and validates bounded criteria', () => {
  const questions = [translationQuestions[0], translationQuestions[8]];
  const results = questions.map(q => ({ id: q.id, meaning: 5, terminology: 1.5, expression: 2, feedback: 'Đủ ý.', suggestion: 'Bản dịch sửa.' }));
  assert.equal(validateGrade({ results, score: 100 }, questions).score, 8.5);
  assert.throws(() => validateGrade({ results: [] }, []));
  assert.throws(() => validateGrade({ results: results.slice(1) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, meaning: 7 })) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, meaning: '5' })) }, questions));
  assert.throws(() => validateGrade({ results: results.map(r => ({ ...r, id: results[0].id })) }, questions));
  assert.throws(() => validateGrade({ results: [null, results[1]] }, questions));
});
