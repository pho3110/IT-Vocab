import { languageQuestions } from '../content/exam-language.js';
import { readingPassages } from '../content/exam-reading.js';
import { examTranslations, emailTasks } from '../content/exam-writing.js';
import { speakingQuestions } from '../content/exam-speaking.js';
import { translationQuestions } from './translations.js';
import { reviewLanguage, reviewReading, reviewEmail, reviewSpeaking, reviewDialogues } from '../content/exam-master-review.js';

export const EXAM_STORAGE_KEY = 'it-words-mixed-exam-v1';
export const BANK_VERSION = 2;
// This item admits two plausible options; do not penalise a learner for the source ambiguity.
const legacyLanguage = languageQuestions.filter(q => q.id !== 'u5-language-17');
export const usableLanguage = [...legacyLanguage, ...reviewLanguage];
const allReading = [...readingPassages, ...reviewReading];
const allEmail = [...emailTasks, ...reviewEmail];
const allSpeaking = [...speakingQuestions, ...reviewSpeaking];
export const bankCounts = {
  language: usableLanguage.length, reading: allReading.reduce((n, p) => n + p.questions.length, 0),
  passages: allReading.length, translations: examTranslations.length + translationQuestions.length,
  email: allEmail.length, speaking: allSpeaking.length, dialogues: reviewDialogues.length,
};
function randomFrom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffled(list, random) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function balancedSample(pool, count, random) {
  const units = shuffled([...new Set(pool.map(q => q.unit))], random);
  const buckets = units.map(unit => shuffled(pool.filter(q => q.unit === unit), random));
  const result = [];
  while (result.length < count && buckets.some(bucket => bucket.length)) {
    for (const bucket of buckets) if (bucket.length && result.length < count) result.push(bucket.pop());
  }
  return shuffled(result, random);
}

export function createExam(seed, startedAt = Date.now(), bankVersion = BANK_VERSION) {
  const languagePool = bankVersion === 1 ? legacyLanguage : usableLanguage;
  const passagePool = bankVersion === 1 ? readingPassages : allReading;
  const random = randomFrom(seed);
  const prepare = q => ({ ...q, options: shuffled(q.options, random) });
  const language = [
    ...balancedSample(languagePool.filter(q => q.kind === 'matching'), 5, random),
    ...balancedSample(languagePool.filter(q => q.kind === 'choice'), 15, random),
  ].map(prepare);
  const passageA = shuffled(passagePool.filter(p => p.kind === 'choice'), random)[0];
  const passageB = shuffled(passagePool.filter(p => p.kind === 'true-false' && p.unit !== passageA.unit), random)[0];
  const reading = [passageA, passageB].map(p => ({ ...p, questions: shuffled(p.questions, random).map(prepare) }));
  const handout = translationQuestions.map(q => ({ id: q.id, unit: 'handout', prompt: q.english, reference: q.reference, source: `Handout 01 · Câu ${q.number}` }));
  const translationPool = [...examTranslations, ...handout.filter(q => q.id !== 'handout-01-31')];
  const unique = new Set();
  const translations = balancedSample(translationPool.filter(q => {
    const text = q.prompt.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (unique.has(text)) return false;
    unique.add(text); return true;
  }), 5, random);
  // Build a shared A–F column without changing the original seed sequence.
  // Existing drafts retain the same questions, reading texts and writing tasks.
  const matchingRandom = randomFrom((seed ^ 0x41f06c2b) >>> 0);
  const matchingAnswers = language.slice(0, 5).map(q => q.answer);
  const distractor = shuffled(languagePool.filter(q => q.kind === 'matching' && !matchingAnswers.includes(q.answer)), matchingRandom)[0].answer;
  const matchingOptions = shuffled([...matchingAnswers, distractor], matchingRandom);
  return {
    seed: seed >>> 0, startedAt, bankVersion,
    id: `exam-${seed >>> 0}-${startedAt}`, code: (seed >>> 0).toString(16).toUpperCase().padStart(8, '0'),
    language: language.map(q => q.kind === 'matching' ? { ...q, options: matchingOptions } : q), reading, translations, email: shuffled(bankVersion === 1 ? emailTasks : allEmail, random)[0],
    speaking: [...shuffled(bankVersion === 1 ? speakingQuestions : allSpeaking, random).slice(0, 3), ...(bankVersion === 1 ? [] : shuffled(reviewDialogues, random).slice(0, 1))],
  };
}

export const objectiveQuestions = exam => [...exam.language, ...exam.reading.flatMap(p => p.questions)];
export const examAnswerIds = exam => [...objectiveQuestions(exam), ...exam.translations, exam.email, ...exam.speaking].map(q => q.id);
export function gradeObjective(exam, answers) {
  const questions = objectiveQuestions(exam);
  const correct = questions.filter(q => answers[q.id] === q.answer).length;
  return { correct, total: questions.length, score: Math.round(correct / questions.length * 100) / 10 };
}
export function countWords(value = '') { return value.trim().match(/\S+/g)?.length || 0; }

export function restoreExam(raw) {
  const data = JSON.parse(raw);
  if (!data || ![1, BANK_VERSION].includes(data.version) || !Number.isInteger(data.seed) || data.seed < 0 || data.seed > 0xffffffff
    || !Number.isSafeInteger(data.startedAt) || data.startedAt <= 0 || typeof data.submitted !== 'boolean'
    || !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) throw new Error('Bản nháp đề thi không hợp lệ.');
  const exam = createExam(data.seed, data.startedAt, data.version);
  const ids = new Set(examAnswerIds(exam));
  const answers = {};
  for (const [id, value] of Object.entries(data.answers)) {
    if (!ids.has(id) || typeof value !== 'string' || value.length > 16000) throw new Error('Câu trả lời đề thi không hợp lệ.');
    answers[id] = value;
  }
  return { exam, answers, submitted: data.submitted };
}
