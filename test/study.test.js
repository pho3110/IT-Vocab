import test from 'node:test';
import assert from 'node:assert/strict';
import { units, words, workbookWords, wordById } from '../src/data.js';
import { readFileSync } from 'node:fs';
import { DAY, emptyProgress, recordAnswer, setLearned, isDue, isLearned, validateProgress, quizOptions, normalize, dayKey } from '../src/study.js';

test('manual mastery updates review schedule without inventing practice or losing backups', () => {
  const word = words[0], now = 1700000000000, original = emptyProgress();
  let p = setLearned(original, word.id, true, now);
  assert.ok(isLearned(word, p)); assert.ok(!isDue(word, p, now));
  assert.equal(p.cards[word.id].dueAt, now + 3 * DAY);
  assert.equal(p.cards[word.id].reviews, 0); assert.equal(p.cards[word.id].lastReviewed, 0);
  assert.deepEqual(p.daily, {}); assert.deepEqual(original, emptyProgress());
  p = validateProgress(JSON.parse(JSON.stringify(p)), new Set([word.id]));
  assert.ok(isLearned(word, p));
  p = recordAnswer(p, word.id, false, now + DAY);
  assert.ok(!isLearned(word, p));
  const reviews = p.cards[word.id].reviews, daily = { ...p.daily };
  p = setLearned(p, word.id, true, now + DAY);
  p = setLearned(p, word.id, false, now + DAY);
  assert.ok(!isLearned(word, p)); assert.ok(isDue(word, p, now + DAY));
  assert.equal(p.cards[word.id].reviews, reviews); assert.deepEqual(p.daily, daily);
});

const validIds = new Set(words.map(w => w.id));
test('8 units, 32 lessons and 349 workbook entries plus one preserved supplemental card', () => {
  assert.equal(units.length, 8); assert.equal(units.flatMap(u => u.lessons).length, 32);
  assert.equal(workbookWords.length, 349); assert.equal(words.length, 350); assert.equal(validIds.size, 350);
  for (const word of words) { assert.ok(word.term && word.meaning && word.definition && word.partOfSpeech); assert.ok(word.lessonId.startsWith(String(word.unitId))); }
});
test('every extracted source entry is represented exactly once with its definition and page', () => {
  const source = JSON.parse(readFileSync(new URL('../content/workbook-extracted.json', import.meta.url)));
  assert.equal(source.length, workbookWords.length);
  for (const row of source) {
    const matches = workbookWords.filter(word => word.lessonId === row.lessonId && word.term === row.term);
    assert.equal(matches.length, 1, `${row.lessonId}:${row.term}`);
    assert.equal(matches[0].definition, row.definition);
    assert.equal(matches[0].partOfSpeech, row.partOfSpeech);
    assert.equal(matches[0].sourcePage, row.page);
  }
});
test('independently checked per-lesson counts include embedded and split entries', () => {
  const expected = [[14,16,11,5],[19,13,12,11],[8,9,18,11],[9,11,11,10],[7,9,10,11],[11,11,10,11],[6,8,5,17],[8,8,13,16]];
  for (const unit of units) for (const [index, lesson] of unit.lessons.entries()) assert.equal(lesson.words.filter(w => w.source === 'workbook').length, expected[unit.id - 1][index]);
  for (const term of ['supply cloud computing','virtual reality goggles','Ethernet connector','remotely','jam']) assert.ok(workbookWords.some(w => w.term === term));
  assert.ok(!workbookWords.find(w => w.term === 'electronic version').definition.includes('remotely'));
  assert.ok(!workbookWords.find(w => w.term === 'input device').definition.includes('jam (n)'));
});
test('all 160 original IDs retain the same vocabulary and saved progress', () => {
  const old = JSON.parse(readFileSync(new URL('../content/legacy-words.json', import.meta.url)));
  let p = emptyProgress();
  for (const word of old) {
    assert.equal(wordById[word.id].term, word.term === 'lock someone out' ? 'lock (someone) out of (something)' : word.term);
    p = recordAnswer(p, word.id, true, 1700000000000); p.favorites.push(word.id);
  }
  const restored = validateProgress(JSON.parse(JSON.stringify(p)), validIds);
  assert.equal(Object.keys(restored.cards).length, 160); assert.equal(restored.favorites.length, 160);
  assert.equal(wordById['7C-5'].lessonId, '7B');
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
