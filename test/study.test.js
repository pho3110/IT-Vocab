import test from 'node:test';
import assert from 'node:assert/strict';
import { units, words } from '../src/data.js';
import { DAY, emptyProgress, recordAnswer, isDue, isLearned, validateProgress, quizOptions, normalize, dayKey } from '../src/study.js';

const validIds = new Set(words.map(w => w.id));
test('8 units, 32 lessons and 160 complete, unique vocabulary entries', () => {
  assert.equal(units.length, 8); assert.equal(units.flatMap(u => u.lessons).length, 32);
  assert.equal(words.length, 160); assert.equal(validIds.size, 160);
  for (const word of words) { assert.ok(word.term && word.meaning && word.definition); assert.ok(word.lessonId.startsWith(String(word.unitId))); }
});
test('review schedule: unseen, 1 day, 3 days, failure, then restart', () => {
  const word = words[0], now = 1700000000000, original = emptyProgress();
  assert.ok(isDue(word, original, now));
  let p = recordAnswer(original, word.id, true, now);
  assert.equal(p.cards[word.id].dueAt, now + DAY); assert.ok(!isDue(word, p, now));
  assert.ok(isDue(word, p, now + DAY)); assert.ok(!isLearned(word, p));
  p = recordAnswer(p, word.id, true, now + DAY); assert.equal(p.cards[word.id].dueAt, now + 4 * DAY); assert.ok(isLearned(word, p));
  p = recordAnswer(p, word.id, false, now + 4 * DAY); assert.ok(!isLearned(word, p)); assert.equal(p.cards[word.id].dueAt, now + 4 * DAY + 600000);
  p = recordAnswer(p, word.id, true, now + 4 * DAY + 600000); assert.equal(p.cards[word.id].streak, 1);
  assert.deepEqual(original, emptyProgress()); assert.equal(p.cards[word.id].reviews, 4);
});
test('daily totals use device-local calendar date', () => {
  const now = new Date(2026, 9, 14, 23, 30).getTime();
  const p = recordAnswer(recordAnswer(emptyProgress(), words[0].id, false, now), words[1].id, true, now);
  assert.equal(dayKey(new Date(now)), '2026-10-14'); assert.equal(p.daily['2026-10-14'], 2);
});
test('backup round trip, deduplication and unknown ID removal', () => {
  const p = recordAnswer(emptyProgress(), words[0].id, true, Date.now());
  p.favorites = [words[0].id, words[0].id, 'missing']; p.cards.missing = {};
  const restored = validateProgress(JSON.parse(JSON.stringify(p)), validIds);
  assert.deepEqual(restored.favorites, [words[0].id]); assert.ok(!('missing' in restored.cards));
  assert.deepEqual(restored.cards[words[0].id], p.cards[words[0].id]);
});
test('malformed backups are rejected', () => {
  for (const value of [null, {}, { version: 2 }, { ...emptyProgress(), cards: [] }, { ...emptyProgress(), favorites: null }, { ...emptyProgress(), cards: { [words[0].id]: { streak: -1 } } }, { ...emptyProgress(), daily: { today: 3 } }]) assert.throws(() => validateProgress(value, validIds));
});
test('quiz offers exactly four distinct choices including correct answer', () => {
  for (const word of words) for (let i = 0; i < 10; i++) {
    const choices = quizOptions(word, words); assert.equal(choices.length, 4); assert.equal(new Set(choices).size, 4); assert.ok(choices.includes(word.meaning));
  }
});
test('Vietnamese search ignores accents and case', () => {
  assert.ok(normalize('MÃ HÓA').includes(normalize('ma hoa')));
  assert.ok(normalize('Địa chỉ IP').includes('dia chi'));
});
