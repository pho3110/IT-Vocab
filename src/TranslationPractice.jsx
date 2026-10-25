import { useEffect, useRef, useState } from 'react';
import { translationTests, translationSourceCounts, validateGrade } from './translations.js';
import './translations.css';

const storageKey = 'it-words-translations-v1';
function readDrafts() {
  try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}

export default function TranslationPractice() {
  const [selected, setSelected] = useState(translationTests[0].id);
  const [drafts, setDrafts] = useState(readDrafts);
  const [revealed, setRevealed] = useState({});
  const [grade, setGrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const controller = useRef(null);
  const test = translationTests.find(t => t.id === selected);
  const questions = test.questions.filter(q => !q.incomplete);
  const completed = questions.filter(q => typeof drafts[q.id] === 'string' && drafts[q.id].trim()).length;
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(drafts)); setSaveError(''); }
    catch { setSaveError('Không lưu được bản nháp trên thiết bị. Hãy sao chép bài trước khi đóng trang.'); }
  }, [drafts]);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit() {
    setBusy(true); setError(''); setGrade(null);
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 60000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/grade-translation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ testId: test.id, answers: questions.map(q => ({ id: q.id, text: drafts[q.id] })) }),
      });
      if (!response.ok) throw new Error(response.status === 503 || response.status === 404 ? 'Dịch vụ chấm AI chưa được cấu hình. Bản nháp vẫn được giữ; bạn có thể xem đáp án để tự đối chiếu.' : 'Chưa chấm được bài. Vui lòng thử lại sau.');
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error('Dịch vụ chấm AI chưa được cấu hình. Bản nháp vẫn được giữ.');
      setGrade(validateGrade(await response.json(), questions));
    } catch (err) { setError(err.name === 'AbortError' ? 'Chấm bài quá thời gian. Bản nháp vẫn được giữ, bạn có thể thử lại.' : err.message); }
    finally { clearTimeout(timer); setBusy(false); }
  }
  return <div className="translation-practice">
    <div className="page-title"><div><span className="eyebrow">TRANSLATION LAB</span><h1>Luyện dịch IT</h1><p>5 đề · 25 mục · 24 câu đủ nội dung để luyện dịch Anh → Việt.</p></div></div>
    <div className="notice">{translationSourceCounts.handout} câu dùng nguyên văn Handout 01, đã đối chiếu với đáp án IT 2016; 3 câu trong số này gần khớp và có chú thích khác biệt. {translationSourceCounts.reconstructed} câu chưa tìm thấy trong handout vẫn là câu dựng lại. Đề 04 câu 35 thiếu nội dung nên không tính điểm. Điểm AI chỉ để tham khảo khi tự học.</div>
    <div className="translation-tabs" role="group" aria-label="Chọn đề dịch">{translationTests.map(t => <button key={t.id} className={`btn ${t.id === selected ? 'primary' : 'secondary'}`} aria-pressed={t.id === selected} disabled={busy} onClick={() => { setSelected(t.id); setGrade(null); setError(''); }}>{t.title}</button>)}</div>
    <section className="settings-card"><h2>{test.title} · Dịch sang tiếng Việt</h2><p>Đúng ý: 6 điểm · Thuật ngữ IT: 2 điểm · Diễn đạt: 2 điểm. Chấp nhận cách dịch tương đương, không yêu cầu giống hệt đáp án.</p><p>Bản nháp tự lưu trên thiết bị này. Khi bấm chấm, nội dung bài dịch được gửi đến dịch vụ AI và cần kết nối mạng.</p></section>
    {saveError && <p className="notice warning" role="alert">{saveError}</p>}
    {test.questions.map(q => {
      const result = grade?.results.find(r => r.id === q.id);
      return <section className="settings-card translation-question" key={q.id}>
        <h2>Câu {q.number}{q.incomplete ? ' · Thiếu dữ liệu' : ''}</h2>
        {q.incomplete ? <p>Tài liệu chỉ ghi: “{q.reference}”. Cần bổ sung đề gốc để luyện và chấm câu này.</p> : <>
          <p className="translation-provenance">{q.source.kind === 'handout' ? `Handout 01 · Câu ${q.source.handoutNumber} · ${q.source.match === 'partial' ? 'Gần khớp đáp án cũ' : 'Khớp nội dung đáp án cũ'}` : 'Câu tiếng Anh dựng lại · Chưa tìm thấy trong Handout 01'}</p>
          <p className="translation-source" lang="en">{q.english}</p>
          {q.source.match === 'partial' && <p className="translation-source-note">{q.source.note}</p>}
          <label htmlFor={q.id}>Bản dịch của bạn</label>
          <textarea id={q.id} rows={4} maxLength={4000} value={typeof drafts[q.id] === 'string' ? drafts[q.id] : ''} disabled={busy} placeholder="Nhập bản dịch tiếng Việt…" onChange={event => { setDrafts(d => ({ ...d, [q.id]: event.target.value })); setGrade(null); }} />
          <button className="text-button" aria-expanded={!!revealed[q.id]} onClick={() => setRevealed(r => ({ ...r, [q.id]: !r[q.id] }))}>{revealed[q.id] ? 'Ẩn đáp án' : 'Xem đáp án tài liệu'}</button>
          {revealed[q.id] && <p className="translation-reference">{q.reference}</p>}
          {result && <div className="translation-feedback"><h3>{result.score}/10</h3><p>Đúng ý {result.meaning}/6 · Thuật ngữ {result.terminology}/2 · Diễn đạt {result.expression}/2</p><p>{result.feedback}</p><p><strong>Gợi ý sửa:</strong> {result.suggestion}</p></div>}
        </>}
      </section>;
    })}
    <section className="settings-card" aria-busy={busy}><h2>Chấm bài bằng AI</h2><p>Đã nhập {completed}/{questions.length} câu. Điểm đề là trung bình các câu đủ dữ liệu.</p><button className="btn primary" disabled={busy || completed !== questions.length || !navigator.onLine} onClick={submit}>{busy ? 'AI đang chấm…' : 'Chấm bài / 10'}</button>{!navigator.onLine && <p>Cần có mạng để chấm AI.</p>}
      {error && <p className="notice warning" role="alert">{error}</p>}
      {grade && <p className="translation-total" role="status">Điểm {test.title}: <strong>{grade.score}/10</strong> · Xem nhận xét bên dưới từng câu.</p>}
    </section>
  </div>;
}
