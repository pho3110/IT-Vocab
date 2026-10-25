import { useEffect, useRef, useState } from 'react';
import { translationQuestions, TRANSLATION_PAGE_SIZE, validateGrade } from './translations.js';
import './translations.css';

const storageKey = 'it-words-handout01-translations-v1';
function readDrafts() {
  try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
const hasAnswer = (drafts, id) => typeof drafts[id] === 'string' && drafts[id].trim().length > 0;

export default function TranslationPractice() {
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState(readDrafts);
  const [revealed, setRevealed] = useState({});
  const [grade, setGrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const controller = useRef(null);
  const pageHeading = useRef(null);
  const questions = translationQuestions.slice(page * TRANSLATION_PAGE_SIZE, (page + 1) * TRANSLATION_PAGE_SIZE);
  const answered = questions.filter(q => hasAnswer(drafts, q.id));
  const completed = translationQuestions.filter(q => hasAnswer(drafts, q.id)).length;
  const pages = Math.ceil(translationQuestions.length / TRANSLATION_PAGE_SIZE);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(drafts)); setSaveError(''); }
    catch { setSaveError('Không lưu được bản nháp trên thiết bị. Hãy sao chép bài trước khi đóng trang.'); }
  }, [drafts]);
  useEffect(() => () => controller.current?.abort(), []);
  function changePage(next) {
    setPage(next); setGrade(null); setError('');
    pageHeading.current?.scrollIntoView({ block: 'start' });
    pageHeading.current?.focus({ preventScroll: true });
  }
  async function submit() {
    if (!answered.length || busy) return;
    setBusy(true); setError(''); setGrade(null);
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 60000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/grade-translation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ handoutId: 'handout-01', answers: answered.map(q => ({ id: q.id, text: drafts[q.id] })) }),
      });
      if (!response.ok) throw new Error(response.status === 503 || response.status === 404 ? 'Dịch vụ chấm AI chưa được cấu hình. Bản nháp vẫn được giữ; bạn có thể xem đáp án để tự đối chiếu.' : 'Chưa chấm được bài. Vui lòng thử lại sau.');
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Dịch vụ chấm AI chưa được cấu hình. Bản nháp vẫn được giữ.');
      setGrade(validateGrade(await response.json(), answered));
    } catch (err) { setError(err.name === 'AbortError' ? 'Chấm bài quá thời gian. Bản nháp vẫn được giữ, bạn có thể thử lại.' : err.message); }
    finally { clearTimeout(timer); setBusy(false); }
  }
  return <div className="translation-practice">
    <div className="page-title"><div><span className="eyebrow">HANDOUT 01 · TRANSLATION</span><h1>Luyện dịch IT</h1><p>50 câu nguyên văn Handout 01 · Anh → Việt · Đã viết {completed}/50 câu.</p></div></div>
    <div className="notice">Đáp án tiếng Việt được biên soạn để tham khảo, không phải đáp án chính thức của tài liệu. Chấp nhận các cách dịch tương đương. Câu tiếng Anh giữ nguyên theo handout, kể cả lỗi gõ và hai câu gần trùng 30–31.</div>
    <section className="settings-card"><h2>Học theo nhịp của bạn</h2><p>Mỗi trang hiển thị 10 câu theo đúng thứ tự handout. Bạn có thể viết từng câu rồi xem đáp án, không cần làm hết 50 câu một lần.</p><p>Bản nháp tự lưu trên thiết bị này. Chấm AI cần có mạng và dịch vụ AI đã được cấu hình; chỉ gửi các câu đã viết trong trang hiện tại. Thang 10: đúng ý 6 · thuật ngữ IT 2 · diễn đạt 2.</p></section>
    <div className="translation-tabs" role="group" aria-label="Chọn nhóm câu">{Array.from({ length: pages }, (_, index) => <button key={index} className={`btn ${index === page ? 'primary' : 'secondary'}`} aria-pressed={index === page} disabled={busy} onClick={() => changePage(index)}>Câu {index * TRANSLATION_PAGE_SIZE + 1}–{Math.min((index + 1) * TRANSLATION_PAGE_SIZE, translationQuestions.length)}</button>)}</div>
    <h2 className="translation-range" ref={pageHeading} tabIndex={-1}>Câu {questions[0].number}–{questions.at(-1).number}</h2>
    {saveError && <p className="notice warning" role="alert">{saveError}</p>}
    {questions.map(q => {
      const result = grade?.results.find(r => r.id === q.id);
      return <section className="settings-card translation-question" key={q.id}>
        <h2>Câu {q.number}</h2>
        <p className="translation-provenance">Handout 01 · Câu {q.number}</p>
        <p className="translation-source" lang="en">{q.english}</p>
        {q.note && <p className="translation-source-note">{q.note}</p>}
        <label htmlFor={q.id}>Bản dịch của bạn</label>
        <textarea id={q.id} rows={4} maxLength={4000} value={typeof drafts[q.id] === 'string' ? drafts[q.id] : ''} disabled={busy} placeholder="Nhập bản dịch tiếng Việt…" onChange={event => { setDrafts(d => ({ ...d, [q.id]: event.target.value })); setGrade(null); }} />
        <button className="text-button" aria-expanded={!!revealed[q.id]} onClick={() => setRevealed(r => ({ ...r, [q.id]: !r[q.id] }))}>{revealed[q.id] ? 'Ẩn đáp án' : 'Xem đáp án tham khảo'}</button>
        {revealed[q.id] && <p className="translation-reference">{q.reference}</p>}
        {result && <div className="translation-feedback"><h3>{result.score}/10</h3><p>Đúng ý {result.meaning}/6 · Thuật ngữ {result.terminology}/2 · Diễn đạt {result.expression}/2</p><p>{result.feedback}</p><p><strong>Gợi ý sửa:</strong> {result.suggestion}</p></div>}
      </section>;
    })}
    <section className="settings-card" aria-busy={busy}><h2>Chấm các câu đã viết</h2><p>Đã viết {answered.length}/{questions.length} câu trên trang này. Chỉ tính điểm các câu gửi chấm; điểm AI dùng để tham khảo khi tự học.</p><button className="btn primary" disabled={busy || !answered.length || !navigator.onLine} onClick={submit}>{busy ? 'AI đang chấm…' : 'Chấm bài / 10'}</button>{!navigator.onLine && <p>Cần có mạng để chấm AI.</p>}
      {error && <p className="notice warning" role="alert">{error}</p>}
      {grade && <p className="translation-total" role="status">Điểm {grade.results.length} câu đã chấm: <strong>{grade.score}/10</strong> · Xem nhận xét bên dưới từng câu.</p>}
    </section>
    <nav className="word-pagination" aria-label="Trang luyện dịch"><button className="btn secondary" disabled={busy || page === 0} onClick={() => changePage(page - 1)}>Trang trước</button><span>{page + 1} / {pages}</span><button className="btn secondary" disabled={busy || page === pages - 1} onClick={() => changePage(page + 1)}>Trang sau</button></nav>
  </div>;
}
