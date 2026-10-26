import { useCallback, useEffect, useRef, useState } from 'react';
import { EXAM_STORAGE_KEY, bankCounts, createExam, objectiveQuestions, gradeObjective, restoreExam, countWords } from './exam.js';
import ExamRecorder from './ExamRecorder.jsx';
import ExamMatching from './ExamMatching.jsx';
import './exam.css';

function readSaved() {
  try { const raw = localStorage.getItem(EXAM_STORAGE_KEY); return { saved: raw ? restoreExam(raw) : null, error: '' }; }
  catch { return { saved: null, error: 'Không đọc được bản nháp đề thi. Dữ liệu cũ chưa bị ghi đè; bạn có thể tải bản nháp cũ xuống trước khi tạo đề mới.' }; }
}
const rubrics = {
  writing: ['Dịch đủ ý chính và dùng đúng thuật ngữ IT.', 'Email dùng đủ các bước đề bài yêu cầu.', 'Có lời chào, trình tự rõ ràng, lời kết và đúng khoảng từ.', 'Ngữ pháp, chính tả và cách diễn đạt phù hợp.'],
  speaking: ['Trả lời đúng câu hỏi và đưa ví dụ cụ thể.', 'Sắp xếp ý rõ ràng, nối câu tự nhiên.', 'Dùng đúng từ vựng IT và ngữ pháp.', 'Nghe lại để kiểm tra phát âm, độ trôi chảy và âm lượng.'],
};
export default function ExamPractice() {
  const [initial] = useState(readSaved);
  const [exam, setExam] = useState(initial.saved?.exam || null);
  const [answers, setAnswers] = useState(initial.saved?.answers || {});
  const [submitted, setSubmitted] = useState(initial.saved?.submitted || false);
  const [section, setSection] = useState('reading');
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [dialogueRole, setDialogueRole] = useState(0);
  const [busy, setBusy] = useState(false);
  const onBusy = useCallback(value => setBusy(value), []);
  const [warning, setWarning] = useState(initial.error);
  const [saveError, setSaveError] = useState('');
  const [confirm, setConfirm] = useState('');
  const title = useRef(null);
  const [checks, setChecks] = useState({});
  useEffect(() => {
    if (!exam || warning) return;
    try { localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify({ version: exam.bankVersion, seed: exam.seed, startedAt: exam.startedAt, answers, submitted })); setSaveError(''); }
    catch { setSaveError('Không lưu được bài thi. Hãy tải bài làm về trước khi đóng trang.'); }
  }, [exam, answers, submitted, warning]);
  function newExam() {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const next = createExam(seed);
    setExam(next); setAnswers({}); setSubmitted(false); setSection('reading'); setSpeakingIndex(0);
    setWarning(''); setSaveError(''); setConfirm(''); setChecks({});
    title.current?.focus(); window.scrollTo({ top: 0 });
  }
  function download(raw = false) {
    const data = raw ? localStorage.getItem(EXAM_STORAGE_KEY) || '' : JSON.stringify({ version: exam.bankVersion, seed: exam.seed, startedAt: exam.startedAt, code: exam.code, answers, submitted }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = raw ? 'de-thi-ban-nhap-cu.json' : `de-thi-${exam.code}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const update = (id, value) => { if (!submitted) setAnswers(current => ({ ...current, [id]: value })); };
  const score = exam ? gradeObjective(exam, answers) : null;
  function renderChoice(question, number) {
    return <fieldset className="exam-question" key={question.id}>
      <legend><span>{number}.</span> {question.prompt}</legend>
      <div className="exam-options">{question.options.map((option, index) => <label key={option} className={`${answers[question.id] === option ? 'selected' : ''} ${submitted && option === question.answer ? 'correct' : ''} ${submitted && answers[question.id] === option && option !== question.answer ? 'incorrect' : ''}`}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} disabled={submitted} onChange={() => update(question.id, option)} /><span>{String.fromCharCode(65 + index)}.</span><span>{option}</span></label>)}</div>
      {submitted && <div className="exam-feedback"><strong>{answers[question.id] === question.answer ? 'Đúng' : answers[question.id] ? 'Chưa đúng' : 'Chưa trả lời'} · {question.answer}</strong><p>{question.explanation}</p><small>{question.source}</small></div>}
    </fieldset>;
  }
  const speak = exam?.speaking[speakingIndex];
  return <div className="exam-practice">
    <div className="page-title"><div><span className="eyebrow">MIXED PRACTICE · ĐỌC · VIẾT · NÓI</span><h1 ref={title} tabIndex={-1}>Đề thi tổng hợp</h1><p>Trộn từ đề Unit 2–7, Phiếu Tổng Ôn Unit 1–8, Handout 01 và bộ câu hỏi nói. Không có phần Nghe.</p></div></div>
    {warning && <div className="notice warning" role="alert">{warning}<button className="btn secondary" onClick={() => download(true)}>Tải bản nháp cũ</button></div>}
    {saveError && <p className="notice warning" role="alert">{saveError}</p>}
    {!exam ? <>
      <section className="settings-card"><h2>Mỗi lần tạo là một đề trộn mới</h2><p>Không giới hạn thời gian · 20 câu từ vựng/ngữ pháp · 2 bài đọc với 10 câu hỏi · 5 câu dịch · 1 email · 3 câu hỏi nói · 1 thẻ hội thoại hai vai. Câu hỏi và lựa chọn được trộn; mỗi bài đọc luôn đi kèm đúng bộ câu hỏi của nó.</p><div className="exam-bank-stats">{[[bankCounts.language, 'từ vựng/ngữ pháp'], [bankCounts.passages, 'bài đọc'], [bankCounts.translations, 'câu dịch'], [bankCounts.email, 'đề email'], [bankCounts.speaking, 'nhóm câu nói'], [bankCounts.dialogues, 'thẻ hội thoại']].map(([n, label]) => <span key={label}><strong>{n}</strong>{label}</span>)}</div><button className="btn primary" onClick={newExam}>Tạo đề trộn & bắt đầu</button></section>
      <div className="notice">Trắc nghiệm được chấm tự động theo đáp án tham khảo biên soạn từ nội dung đề. Viết và Nói có bài mẫu và tiêu chí tự đánh giá sau khi nộp; chưa có chấm AI. Bài làm tự lưu trên thiết bị. Phần nói hỗ trợ ghi âm và nghe lại.</div>
    </> : <>
      <section className="settings-card exam-toolbar"><div><span className="eyebrow">MÃ ĐỀ {exam.code}</span><h2>{submitted ? 'Bài đã nộp' : 'Đang làm bài'}</h2><p>{objectiveQuestions(exam).filter(q => answers[q.id]).length}/30 câu khách quan đã trả lời</p></div><div className="button-row"><button className="btn secondary" disabled={busy} onClick={() => download()}>Tải bài làm</button><button className="btn secondary" disabled={busy} onClick={() => setConfirm('new')}>Trộn đề mới</button>{!submitted && <button className="btn primary" disabled={busy} onClick={() => setConfirm('submit')}>Nộp bài</button>}</div></section>
      {confirm && <div className="notice warning" role="alert"><p>{confirm === 'new' ? 'Tạo đề mới sẽ thay thế bản nháp hiện tại. Hãy tải bài làm và bản ghi âm cần giữ trước khi tiếp tục.' : 'Nộp bài để xem điểm khách quan và đáp án tham khảo? Các câu chưa làm sẽ để trống.'}</p><div className="button-row"><button className="btn primary" onClick={() => { if (confirm === 'new') newExam(); else { setSubmitted(true); setConfirm(''); } }}>Xác nhận</button><button className="btn secondary" onClick={() => setConfirm('')}>Hủy</button></div></div>}
      {submitted && <section className="settings-card exam-result" role="status"><h2>Phần khách quan: {score.score}/10</h2><p>Đúng {score.correct}/{score.total} câu. Đây là điểm của từ vựng, ngữ pháp và đọc hiểu; chưa phải điểm tổng của ba kỹ năng.</p><p>Chuyển sang Viết và Nói để xem bài mẫu, nghe lại bản ghi và tự đối chiếu tiêu chí.</p></section>}
      <div className="exam-tabs" role="group" aria-label="Kỹ năng trong đề thi">{[['reading', 'Đọc'], ['writing', 'Viết'], ['speaking', 'Nói']].map(([key, label]) => <button key={key} disabled={busy} aria-pressed={section === key} className={`btn ${section === key ? 'primary' : 'secondary'}`} onClick={() => setSection(key)}>{label}</button>)}</div>
      {busy && <p className="notice">Hãy dừng ghi âm và chờ lưu xong trước khi chuyển câu hoặc đổi phần.</p>}
      {section === 'reading' && <>
        <section className="settings-card"><h2>Đọc · Từ vựng và ngữ pháp</h2><ExamMatching questions={exam.language.slice(0, 5)} answers={answers} submitted={submitted} onAnswer={update} /><h3 className="exam-choice-heading">B. Chọn đáp án đúng · Câu 6–20</h3>{exam.language.slice(5).map((q, index) => renderChoice(q, index + 6))}</section>
        {exam.reading.map((passage, index) => <section key={passage.id} className="settings-card"><h2>Bài đọc {index + 1} · {passage.title}</h2><p className="exam-source">{passage.source}</p><div className="exam-passage" lang="en">{passage.text.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>{passage.questions.map((q, i) => renderChoice(q, 21 + index * 5 + i))}</section>)}
      </>}
      {section === 'writing' && <>
        <section className="settings-card"><h2>Viết · Dịch sang tiếng Việt</h2>{exam.translations.map((q, i) => <div key={q.id} className="exam-written"><h3>Câu {31 + i}</h3><p lang="en">{q.prompt}</p><label htmlFor={`exam-${q.id}`}>Bản dịch của bạn</label><textarea id={`exam-${q.id}`} rows={4} maxLength={4000} disabled={submitted} value={answers[q.id] || ''} onChange={event => update(q.id, event.target.value)} />{submitted && <div className="exam-feedback"><strong>Bản dịch tham khảo</strong><p>{q.reference}</p><small>{q.source}</small></div>}</div>)}</section>
        <section className="settings-card"><h2>Viết email</h2><p lang="en">{exam.email.prompt}</p><ul lang="en">{exam.email.steps.map(step => <li key={step}>{step}</li>)}</ul><label htmlFor="exam-email">Email của bạn</label><textarea id="exam-email" rows={10} maxLength={16000} lang="en" disabled={submitted} value={answers[exam.email.id] || ''} onChange={event => update(exam.email.id, event.target.value)} /><p>{countWords(answers[exam.email.id])} từ · Mục tiêu {exam.email.minWords}–{exam.email.maxWords} từ</p>{submitted && <div className="exam-feedback"><strong>Email tham khảo</strong><p className="exam-sample" lang="en">{exam.email.sample}</p><small>{exam.email.source} · Bài mẫu do trợ lý biên soạn</small></div>}</section>
      </>}
      {section === 'speaking' && <section className="settings-card"><h2>Nói · Trả lời bằng tiếng Anh</h2><p>Chuẩn bị ý chính, nói thành câu và đưa ví dụ. Ghi âm để nghe lại; có thể ghi âm lại khi xem kết quả.</p><div className="exam-tabs">{exam.speaking.map((q, index) => <button key={q.id} disabled={busy} className={`btn ${speakingIndex === index ? 'primary' : 'secondary'}`} aria-pressed={speakingIndex === index} onClick={() => setSpeakingIndex(index)}>{q.kind === 'dialogue' ? 'Hội thoại' : `Câu nói ${index + 1}`}</button>)}</div><h3 lang="en">{speak.prompt}</h3><p className="exam-source">{speak.source}</p>{speak.kind === 'dialogue' && <><p>Chọn vai để luyện cùng bạn, sau đó đổi vai. Bạn cũng có thể tự ghi âm cả hai vai.</p><div className="exam-role-tabs" role="group" aria-label="Vai hội thoại">{speak.roles.map(([role], i) => <button className={dialogueRole === i ? 'btn primary' : 'btn secondary'} key={role} aria-pressed={dialogueRole === i} onClick={() => setDialogueRole(i)}>{role}</button>)}</div><div className="exam-passage" lang="en"><h4>{speak.roles[dialogueRole][0]}</h4><ul>{speak.roles[dialogueRole][1].map(item => <li key={item}>{item}</li>)}</ul></div></>}<label htmlFor="exam-speaking-notes">Dàn ý của bạn</label><textarea id="exam-speaking-notes" rows={4} maxLength={4000} disabled={submitted} value={answers[speak.id] || ''} onChange={event => update(speak.id, event.target.value)} /><ExamRecorder key={`${exam.id}-${speak.id}`} recordKey={`${exam.id}-${speak.id}`} disabled={false} onBusy={onBusy} />{submitted && <div className="exam-feedback"><strong>Gợi ý trả lời (có thể thay bằng trải nghiệm của bạn)</strong><p className="exam-sample" lang="en">{speak.sample}</p></div>}</section>}
      {submitted && section !== 'reading' && <section className="settings-card"><h2>Tự đối chiếu phần {section === 'writing' ? 'Viết' : 'Nói'}</h2><p>Đánh dấu các tiêu chí bạn đã làm được. Phần này không tự tạo điểm hoặc đánh giá phát âm bằng AI.</p>{rubrics[section].map((text, index) => <label className="exam-rubric" key={text}><input type="checkbox" checked={!!checks[`${section}-${index}`]} onChange={event => setChecks(value => ({ ...value, [`${section}-${index}`]: event.target.checked }))} />{text}</label>)}</section>}
    </>}
  </div>;
}
