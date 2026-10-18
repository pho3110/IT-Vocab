export const STORAGE_KEY = 'it-words-progress-v1';
export const DAY = 86400000;
export const emptyProgress = () => ({ version: 1, cards: {}, favorites: [], daily: {} });
export const dayKey = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const shuffle = (items, random = Math.random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
};
export const isDue = (word, progress, now = Date.now()) => !progress.cards[word.id] || progress.cards[word.id].dueAt <= now;
export const isLearned = (word, progress) => (progress.cards[word.id]?.streak ?? 0) >= 2;
export function setLearned(progress, id, learned, now = Date.now()) {
  const old = progress.cards[id];
  return { ...progress, cards: { ...progress.cards, [id]: {
    streak: learned ? Math.max(2, old?.streak ?? 0) : 0,
    reviews: old?.reviews ?? 0,
    dueAt: learned ? now + 3 * DAY : now,
    lastReviewed: old?.lastReviewed ?? 0,
  } } };
}
export function recordAnswer(progress, id, remembered, now = Date.now()) {
  const old = progress.cards[id];
  const streak = remembered ? (old?.streak ?? 0) + 1 : 0;
  const interval = remembered ? [1, 3, 7, 14, 30][Math.min(streak - 1, 4)] * DAY : 10 * 60000;
  const date = dayKey(new Date(now));
  return { ...progress, cards: { ...progress.cards, [id]: { streak, reviews: (old?.reviews ?? 0) + 1, dueAt: now + interval, lastReviewed: now } }, daily: { ...progress.daily, [date]: (progress.daily[date] ?? 0) + 1 } };
}
export function validateProgress(value, validIds) {
  if (!value || value.version !== 1 || !value.cards || typeof value.cards !== 'object' || Array.isArray(value.cards) || !Array.isArray(value.favorites) || !value.daily || typeof value.daily !== 'object' || Array.isArray(value.daily)) throw new Error('Tệp không đúng định dạng bản sao IT Words.');
  const cards = {};
  for (const [id, c] of Object.entries(value.cards)) {
    if (!validIds.has(id)) continue;
    if (!c || !Number.isSafeInteger(c.streak) || c.streak < 0 || !Number.isSafeInteger(c.reviews) || c.reviews < 0 || !Number.isFinite(c.dueAt) || c.dueAt < 0 || !Number.isFinite(c.lastReviewed) || c.lastReviewed < 0) throw new Error('Dữ liệu tiến độ trong tệp không hợp lệ.');
    cards[id] = { streak: c.streak, reviews: c.reviews, dueAt: c.dueAt, lastReviewed: c.lastReviewed };
  }
  const daily = {};
  for (const [date, count] of Object.entries(value.daily)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(count) || count < 0) throw new Error('Lịch sử học trong tệp không hợp lệ.');
    daily[date] = count;
  }
  return { version: 1, cards, daily, favorites: [...new Set(value.favorites.filter(id => validIds.has(id)))] };
}
export function quizOptions(word, pool, random = Math.random) {
  const meanings = [...new Set(pool.filter(w => w.meaning !== word.meaning).map(w => w.meaning))];
  return shuffle([word.meaning, ...shuffle(meanings, random).slice(0, 3)], random);
}
