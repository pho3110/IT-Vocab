import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { units, words, workbookWords, wordById } from './data.js';
import { SpeechReset, SpeechSettings, useReadWord } from './speech.jsx';
import TranslationPractice from './TranslationPractice.jsx';
import { STORAGE_KEY, emptyProgress, dayKey, normalize, shuffle, isDue, isLearned, recordAnswer, validateProgress, quizOptions } from './study.js';

const paths = {
  book: 'M4 5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-3H4z M20 5h-4a3 3 0 0 0-3 3v13a4 4 0 0 1 4-3h3z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  repeat: 'M20 7H7a4 4 0 0 0-4 4 M17 4l3 3-3 3 M4 17h13a4 4 0 0 0 4-4 M7 14l-3 3 3 3',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  star: 'm12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.3-.9z',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  check: 'm5 12 4 4L19 6',
  x: 'm6 6 12 12 M6 18 18 6',
  download: 'M12 3v12 m-5-5 5 5 5-5 M4 17v4h16v-4',
  upload: 'M12 16V4 m-5 5 5-5 5 5 M4 17v4h16v-4',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  briefcase: 'M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3',
  monitor: 'M3 3h18v13H3z M12 16v5 M8 21h8',
  network: 'M9 2h6v6H9z M2 16h6v6H2z M16 16h6v6h-6z M12 8v4 M5 16v-4h14v4',
  database: 'M20 5c0 2-4 3-8 3S4 7 4 5s4-3 8-3 8 1 8 3z M4 5v14c0 2 4 3 8 3s8-1 8-3V5 M4 12c0 2 4 3 8 3s8-1 8-3',
  sliders: 'M5 3v18 M12 3v18 M19 3v18 M2 8h6 M9 16h6 M16 6h6',
  messages: 'M3 3h15v12H8l-5 4z M18 8h3v13l-5-3h-4v-3',
  code: 'm8 5-6 7 6 7 m8-14 6 7-6 7 M14 3l-4 18',
  tool: 'M14 3a6 6 0 0 0-7 8l-5 6 5 5 6-6a6 6 0 0 0 8-7l-5 3-4-4 3-5z',
  wifi: 'M2 8a16 16 0 0 1 20 0 M5 12a11 11 0 0 1 14 0 M8 16a6 6 0 0 1 8 0 M12 20h.01',
  chart: 'M4 20h17 M7 16v-5 M12 16V4 M17 16V8',
};
function Icon({ name, size = 20, ...props }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.book} /></svg>; }
const ids = new Set(words.map(w => w.id));
const searchIndex = words.map(word => ({ word, text: normalize(`${word.term} ${word.meaning} ${word.definition}`) }));
function readStored() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return { progress: raw ? validateProgress(JSON.parse(raw), ids) : emptyProgress(), warning: '' }; }
  catch { return { progress: emptyProgress(), warning: 'Không đọc được dữ liệu đã lưu. Dữ liệu cũ chưa bị ghi đè; hãy nhập bản sao hoặc cho phép lưu lại trong Cài đặt.' }; }
}

export default function App() {
  const [initial] = useState(readStored);
  const [progress, setProgress] = useState(initial.progress);
  const [canSave, setCanSave] = useState(!initial.warning);
  const [warning, setWarning] = useState(initial.warning);
  const [page, setPage] = useState('home');
  const [unitId, setUnitId] = useState(null);
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [pwaError, setPwaError] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [updateWorker, setUpdateWorker] = useState(null);
  const [resetting, setResetting] = useState(false);
  const fileInput = useRef(null);
  const heading = useRef(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!canSave) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { setWarning('Trình duyệt không lưu được tiến độ. Hãy xuất bản sao trước khi đóng ứng dụng.'); }
  }, [progress, canSave]);
  useEffect(() => {
    // Avoid waking the app while the phone is locked or a study session is open.
    let timer;
    const sync = () => {
      clearInterval(timer);
      if (!document.hidden && !session) { setNow(Date.now()); timer = setInterval(() => setNow(Date.now()), 60000); }
    };
    sync(); document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', sync); };
  }, [session]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }); }, [page, unitId, session?.startedAt]);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    const install = e => { e.preventDefault(); setInstallPrompt(e); };
    const installed = () => { setInstallPrompt(null); setToast('Đã thêm IT Words vào thiết bị.'); };
    window.addEventListener('online', up); window.addEventListener('offline', down);
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installed);
    let disposed = false;
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(reg => {
        const ready = () => { if (!disposed) setOfflineReady(true); };
        if (reg.active) ready();
        navigator.serviceWorker.ready.then(ready);
        if (reg.waiting) setUpdateWorker(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller && !disposed) setUpdateWorker(worker); });
        });
      }).catch(() => { if (!disposed) setPwaError('Chưa lưu được ứng dụng offline. Kiểm tra HTTPS và thử tải lại khi có mạng.'); });
    }
    return () => { disposed = true; window.removeEventListener('online', up); window.removeEventListener('offline', down); window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installed); };
  }, []);

  const { learned, due, reviewed } = useMemo(() => ({
    learned: words.filter(w => isLearned(w, progress)).length,
    due: words.filter(w => isDue(w, progress, now)),
    reviewed: words.filter(w => progress.cards[w.id]).length,
  }), [progress.cards, now]);
  const today = progress.daily[dayKey()] ?? 0;
  const unit = units.find(u => u.id === unitId);
  const percent = list => Math.round(list.filter(w => isLearned(w, progress)).length / list.length * 100);
  function navigate(next) { setSession(null); setPage(next); setUnitId(null); setResetting(false); }
  const favorite = useCallback(id => { setProgress(p => ({ ...p, favorites: p.favorites.includes(id) ? p.favorites.filter(x => x !== id) : [...p.favorites, id] })); }, []);
  function start(list, mode, label) {
    if (!list.length) { setToast('Chưa có từ nào trong danh sách này.'); return; }
    setSession({ startedAt: Date.now(), words: shuffle(list), mode, label });
  }
  function answer(id, correct) { setProgress(p => recordAnswer(p, id, correct)); }
  function exportBackup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `it-words-${dayKey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Đã xuất bản sao tiến độ và từ đã lưu.');
  }
  async function importBackup(e) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Bản sao quá lớn (tối đa 2 MB).');
      const data = validateProgress(JSON.parse(await file.text()), ids);
      setProgress(data); setCanSave(true); setWarning(''); setToast('Đã khôi phục tiến độ từ bản sao.');
    } catch (error) { setToast(error instanceof SyntaxError ? 'Tệp JSON không hợp lệ. Tiến độ hiện tại vẫn được giữ.' : error.message); }
  }
  async function installApp() { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
  function updateApp() {
    if (!updateWorker) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    updateWorker.postMessage({ type: 'SKIP_WAITING' });
  }

  return <div className="app">
    <SpeechReset value={`${page}-${unitId}-${session?.startedAt}`} />
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('home'); }}><span className="brand-mark">it<span>↗</span></span><span>IT Words<span className="brand-sub">ENGLISH FOR YOUR FUTURE</span></span></a>
      <div className="nav-caption">KHÔNG GIAN HỌC TẬP</div>
      <nav aria-label="Điều hướng chính">{[['home', 'grid', 'Tổng quan'], ['units', 'book', 'Các unit'], ['review', 'repeat', 'Ôn tập'], ['library', 'search', 'Từ điển của bạn'], ['translation', 'messages', 'Luyện dịch']].map(([key, icon, label]) => <button aria-label={label} key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => navigate(key)}><Icon name={icon} /><span>{key === 'library' ? 'Từ điển' : label}</span>{key === 'review' && <span className="nav-count">{due.length}</span>}</button>)}</nav>
      <div className="sidebar-note"><span className="note-symbol">✦</span><strong>Mỗi ngày một chút.</strong><p>Một từ mới hôm nay,<br />một cơ hội mới ngày mai.</p><div className="tiny-progress"><span style={{ width: `${Math.min(today / 10 * 100, 100)}%` }} /></div><small>{Math.min(today, 10)}/10 lượt ôn hôm nay</small></div>
      <button aria-label="Cài đặt & offline" className={`nav-item settings ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}><Icon name="settings" /><span>Cài đặt & offline</span></button>
      <span className="sidebar-footer">Made for curious IT minds.</span>
    </aside>

    <main>
      <header className="topbar"><span className="breadcrumb">Không gian học tập <span>/</span> {session ? 'Phiên học' : unit ? `Unit ${unit.id}` : ({ home: 'Tổng quan', units: 'Các unit', review: 'Ôn tập', library: 'Từ điển', settings: 'Cài đặt', translation: 'Luyện dịch' })[page]}</span><button className={`connection ${!online ? 'offline' : ''}`} onClick={() => navigate('settings')}><span className="status-dot" />{!online ? 'Đang offline' : offlineReady ? 'Sẵn sàng offline' : 'Đang online'}<Icon name="wifi" size={15} /></button><span className="avatar" aria-label="Người học">IT</span></header>
      <div className="content" key={`${page}-${unitId ?? ''}-${session?.startedAt ?? ''}`}>
        {warning && <div className="notice warning" role="alert">{warning}</div>}
        {updateWorker && !session && <div className="notice">Có phiên bản mới. Tiến độ đã lưu sẽ được giữ.<button onClick={updateApp}>Cập nhật</button></div>}
        {session ? <StudySession key={session.startedAt} session={session} progress={progress} onAnswer={answer} onFavorite={favorite} onExit={() => setSession(null)} onRestart={(list, mode) => start(list, mode, session.label)} heading={heading} /> : <>
          {page === 'home' && <>
            <div className="page-title"><div><span className="eyebrow">SẴN SÀNG CHO MỘT BƯỚC TIẾN MỚI?</span><h1 ref={heading} tabIndex={-1}>Chào bạn, cùng học nhé <span className="wave">✦</span></h1><p>Mỗi từ mới là một bước gần hơn đến mục tiêu của bạn.</p></div><span className="date-pill">{new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long' }).format(new Date(now))}</span></div>
            <section className="hero glass-hero"><div className="hero-text"><span className="hero-tag">MỘT CHÚT MỖI NGÀY, MỘT BƯỚC TIẾN XA</span><h2>Học từ mới.<br /><em>Mở tương lai.</em></h2><p>349 mục từ IT, chia thành những bài học nhỏ.<br />Học theo nhịp của bạn, ở bất cứ đâu.</p><button className="btn light" onClick={() => { setPage('units'); setUnitId(units.find(u => percent(u.lessons.flatMap(l => l.words)) < 100)?.id ?? 1); }}>Bắt đầu khám phá <Icon name="arrow" size={20} /></button><span className="hero-footnote">Flashcard · Quiz · Luyện dịch · Học offline</span></div><div className="hero-art" aria-hidden="true"><span className="orbit" /><span className="orbit orbit-two" /><div className="art-card"><span className="card-overline">MỖI TỪ LÀ MỘT KHỞI ĐẦU</span><div className="art-word">connect<span>↗</span></div><span className="art-meaning">kết nối · /kəˈnekt/</span><div className="art-line" /><div className="art-bottom">ENGLISH FOR IT<span>01 / 349</span></div></div><span className="art-chip chip-a">&lt;hello, future /&gt;</span><span className="art-chip chip-b">✓ Thêm một từ mới</span></div></section>
            <section className={`daily-quest ${today >= 10 ? 'quest-complete' : ''}`} aria-label="Mục tiêu học hôm nay"><div className="quest-symbol" aria-hidden="true">{today >= 10 ? '🏆' : '⚡'}</div><div className="quest-copy"><h2>{today >= 10 ? 'Bạn đã hoàn thành mục tiêu hôm nay!' : 'Nhiệm vụ hôm nay: ôn 10 lượt'}</h2><p>{today >= 10 ? 'Một bước tiến đáng nhớ. Muốn học thêm? Cứ tiếp tục nhé.' : 'Chỉ một phiên ngắn để giữ nhịp học mỗi ngày.'}</p><div className="quest-progress" role="progressbar" aria-label="Lượt ôn hôm nay" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(today, 10)}><span style={{ width: `${Math.min(today / 10 * 100, 100)}%` }} /></div></div><span className="quest-score">{Math.min(today, 10)}<small>/10</small></span><button className="btn primary" disabled={!due.length} onClick={() => start(due.slice(0, 10), 'flashcard', 'Nhiệm vụ hôm nay')}>{today >= 10 ? 'Học thêm' : 'Chơi thôi'}<Icon name="arrow" size={18} /></button></section>
            <div className="stats-grid">{[['book', 'Từ đã gặp', reviewed, `trong ${words.length} từ vựng`, 'mint'], ['check', 'Đã ghi nhớ', learned, 'nhớ đúng ít nhất 2 lần liên tiếp', 'peach'], ['repeat', 'Cần ôn hôm nay', due.length, 'gồm từ mới và từ đến hạn', 'lavender'], ['chart', 'Lượt ôn hôm nay', today, 'mục tiêu 10 lượt mỗi ngày', 'yellow']].map(([icon, label, value, caption, color]) => <div className="stat" key={label}><span className={`stat-icon ${color}`}><Icon name={icon} /></span><span className="stat-label">{label}</span><strong>{value}<small>{label === 'Từ đã gặp' ? `/${words.length}` : ''}</small></strong><span className="stat-caption">{caption}</span></div>)}</div>
            <SectionHeading title="Chọn chặng tiếp theo" subtitle="Mở một unit, khám phá một thế giới mới." action="Cả hành trình" onClick={() => navigate('units')} />
            <div className="unit-grid">{units.slice(0, 4).map(u => <UnitCard key={u.id} unit={u} percent={percent(u.lessons.flatMap(l => l.words))} onClick={() => { setPage('units'); setUnitId(u.id); }} />)}</div>
            <div className="review-banner"><span className="review-illustration"><Icon name="repeat" size={30} /></span><div><h3>Nhớ lâu hơn với một lần ôn lại</h3><p>Ôn từ đã đến hạn và khám phá thêm từ mới.</p></div><button className="btn secondary" onClick={() => start(due.slice(0, 10), 'flashcard', 'Ôn tập hôm nay')}>Ôn 10 từ <Icon name="arrow" size={17} /></button></div>
          </>}
          {page === 'units' && !unit && <><PageTitle heading={heading} eyebrow="YOUR LEARNING PATH" title="8 unit, một hành trình" description={`${workbookWords.length} mục từ trong workbook · 32 bài học · 8 unit.`} /><div className="unit-grid">{units.map(u => <UnitCard key={u.id} unit={u} percent={percent(u.lessons.flatMap(l => l.words))} onClick={() => setUnitId(u.id)} />)}</div><p className="source-note">Đầy đủ các mục trong bảng từ vựng của 32 lesson, gồm từ và cụm từ. Định nghĩa tiếng Anh theo PDF; bản dịch tiếng Việt được bổ sung. Thẻ RAM bổ trợ từ phiên bản trước được giữ để bảo toàn tiến độ.</p></>}
          {page === 'units' && unit && <>
            <button className="back-link" onClick={() => setUnitId(null)}>← Tất cả unit</button>
            <PageTitle heading={heading} eyebrow={`UNIT ${String(unit.id).padStart(2, '0')}`} title={unit.title} description={unit.subtitle} />
            <div className="unit-summary"><span><strong>{unit.lessons.flatMap(l => l.words).length}</strong> từ vựng</span><span><strong>4</strong> bài học</span><span><strong>{percent(unit.lessons.flatMap(l => l.words))}%</strong> ghi nhớ</span><button className="btn primary" onClick={() => start(unit.lessons.flatMap(l => l.words), 'flashcard', `Unit ${unit.id}: ${unit.title}`)}>Học cả unit <Icon name="arrow" size={17} /></button></div>
            <div className="lesson-list">{unit.lessons.map(l => <section className="lesson" key={l.id}><div className="lesson-heading"><span className="lesson-id">{l.id}</span><div><h2>{l.title}</h2><p>{l.subtitle} · {l.words.length} từ</p></div><span className="lesson-percent">{percent(l.words)}% ghi nhớ</span></div><div className="word-chips">{l.words.map(w => <span key={w.id}>{w.term}</span>)}</div><div className="lesson-actions"><button className="btn primary" onClick={() => start(l.words, 'flashcard', `${l.id} · ${l.title}`)}><Icon name="book" size={17} /> Học flashcard</button><button className="btn secondary" onClick={() => start(l.words, 'quiz', `${l.id} · ${l.title}`)}>Làm quiz <Icon name="arrow" size={17} /></button></div></section>)}</div>
          </>}
          {page === 'review' && <><PageTitle heading={heading} eyebrow="MAKE IT STICK" title="Ôn một chút, nhớ lâu hơn" description="Từ chưa nhớ sẽ trở lại sau 10 phút. Từ nhớ đúng được ôn sau 1, 3, 7, 14 rồi 30 ngày." /><div className="review-options">{[[due, 'repeat', 'Ôn hôm nay', 'Từ mới và từ đến hạn, tối đa 10 từ mỗi phiên.'], [words.filter(w => progress.cards[w.id]?.streak === 0), 'tool', 'Từ cần luyện thêm', 'Những từ bạn chưa nhớ ở lần trả lời gần nhất.'], [words.filter(w => progress.favorites.includes(w.id)), 'star', 'Từ đã lưu', 'Bộ từ bạn đánh dấu để học riêng.']].map(([list, icon, title, desc]) => <section className="review-option" key={title}><span className="stat-icon mint"><Icon name={icon} /></span><h2>{title}</h2><p>{desc}</p><strong>{list.length}<small> từ</small></strong><button className="btn primary" disabled={!list.length} onClick={() => start(list.slice(0, 10), 'flashcard', title)}>Học flashcard</button><button className="btn secondary" disabled={!list.length} onClick={() => start(list.slice(0, 10), 'quiz', title)}>Làm quiz</button></section>)}</div><div className="notice">“Đã ghi nhớ” nghĩa là trả lời đúng ít nhất 2 lần liên tiếp. Quiz và flashcard cùng cập nhật tiến độ.</div></>}
          {page === 'library' && <><PageTitle heading={heading} eyebrow="YOUR WORD COLLECTION" title="Từ điển của bạn" description="Tìm một từ, hiểu ý nghĩa, lưu lại để ôn sau." /><WordLibrary progress={progress} onFavorite={favorite} /></>}
          {page === 'translation' && <TranslationPractice />}
          {page === 'settings' && <><PageTitle heading={heading} eyebrow="MAKE YOURSELF AT HOME" title="Học ở bất cứ đâu" description="Không cần tài khoản. Bộ từ và tiến độ nằm trên thiết bị của bạn." />
            <section className="settings-card"><span className="stat-icon mint"><Icon name="wifi" /></span><h2>Cài ứng dụng & học offline</h2><p>{offlineReady ? 'Ứng dụng đã được lưu để mở và học offline trên trình duyệt này.' : import.meta.env.DEV ? 'Bạn đang chạy bản phát triển. Chạy npm run build rồi npm run preview để kiểm tra offline trên máy tính.' : 'Đang chuẩn bị bộ nhớ offline. Lần đầu cần truy cập bằng HTTPS và có kết nối mạng.'}</p>{pwaError && <p className="error-text" role="alert">{pwaError}</p>}{installPrompt && <button className="btn primary" onClick={installApp}><Icon name="download" size={17} /> Cài IT Words</button>}<ol><li><strong>Android:</strong> mở đường dẫn HTTPS bằng Chrome → menu ⋮ → Cài ứng dụng / Thêm vào màn hình chính.</li><li><strong>iPhone:</strong> mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính.</li><li>Mở ứng dụng đã cài khi có mạng, đợi “Sẵn sàng offline”, rồi thử bật chế độ máy bay và mở lại.</li></ol><p className="fine-print">Truy cập bằng IP nội bộ qua HTTP chỉ dùng để xem thử giao diện; không bật được offline trên điện thoại. Dữ liệu giữa Safari, Chrome và ứng dụng đã cài có thể khác nhau.</p></section>
            <section className="settings-card"><h2>Bản sao tiến độ</h2><p>Lưu một bản sao để chuyển thiết bị hoặc khôi phục sau khi xóa dữ liệu trình duyệt. Nhập bản sao sẽ thay thế tiến độ hiện tại.</p><div className="button-row"><button className="btn primary" onClick={exportBackup}><Icon name="download" size={17} /> Xuất bản sao</button><button className="btn secondary" onClick={() => fileInput.current.click()}><Icon name="upload" size={17} /> Nhập bản sao</button></div><input ref={fileInput} type="file" accept=".json,application/json" onChange={importBackup} hidden /><p className="fine-print">Xóa dữ liệu trang hoặc dùng chế độ riêng tư có thể làm mất tiến độ. Trình duyệt cũng có thể thu hồi dữ liệu lưu trữ; nên xuất bản sao định kỳ.</p>{!canSave && <button className="btn secondary" onClick={() => { setCanSave(true); setWarning(''); }}>Cho phép lưu tiến độ mới</button>}</section>
            <section className="settings-card"><h2>Về nội dung</h2><p>{workbookWords.length} mục từ đầy đủ trong bảng từ vựng của 8 unit, 32 lesson trong <em>Workbook of English for Information Technology</em> (2016), tài liệu bạn cung cấp. Giữ định nghĩa tiếng Anh trong PDF, bổ sung nghĩa tiếng Việt; bản dịch không phải đáp án chính thức. Một thẻ RAM bổ trợ được giữ từ phiên bản trước.</p><p>Mỗi từ có loại từ và số trang để đối chiếu workbook. Các cụm bị ghép nhầm cột trong PDF đã được tách lại. “sb” là somebody (ai đó), “sth” là something (điều gì đó).</p><p>Bộ từ và tiến độ học được lưu trên thiết bị. Phát âm dùng giọng của thiết bị hoặc trình duyệt; giọng trực tuyến cần mạng. Phiên bản này chưa có bài nghe hoặc bài đọc hiểu từ workbook.</p></section>
            <SpeechSettings /><section className="settings-card danger-zone"><h2>Đặt lại tiến độ</h2><p>Xóa lịch sử học và các từ đã lưu trên thiết bị này. Bộ từ vựng vẫn còn.</p>{resetting ? <div className="button-row"><button className="btn danger" onClick={() => { setProgress(emptyProgress()); setCanSave(true); setWarning(''); setResetting(false); setToast('Đã đặt lại tiến độ.'); }}>Xác nhận xóa tiến độ</button><button className="btn secondary" onClick={() => setResetting(false)}>Hủy</button></div> : <button className="btn secondary" onClick={() => setResetting(true)}>Đặt lại tiến độ</button>}</section>
          </>}
        </>}
        <footer className="page-footer"><span>IT Words <span>·</span> Học đều, tiến xa.</span><span>8 unit · {words.length} từ · Offline first</span></footer>
      </div>
    </main>
    {toast && <div className="toast" role="status">{toast}<button aria-label="Đóng thông báo" onClick={() => setToast('')}><Icon name="x" size={16} /></button></div>}
  </div>;
}

function PageTitle({ heading, eyebrow, title, description }) { return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1 tabIndex={-1} ref={heading}>{title}</h1><p>{description}</p></div></div>; }
function SectionHeading({ title, subtitle, action, onClick }) { return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="text-button" onClick={onClick}>{action}<Icon name="arrow" size={16} /></button></div>; }
function UnitCard({ unit, percent, onClick }) {
  return <button className={`unit-card unit-world-${unit.id}`} onClick={onClick}><div className="unit-card-top"><span className={`unit-icon color-${unit.id}`}><Icon name={unit.icon} size={28} /></span><span className="unit-number">UNIT {String(unit.id).padStart(2, '0')}</span><span className="unit-open"><Icon name={percent === 100 ? 'check' : 'arrow'} size={20} /></span></div><h3>{unit.title}</h3><p>{unit.subtitle}</p><div className="unit-meta"><span>4 bài học · {unit.lessons.flatMap(l => l.words).length} từ</span><span>{percent}% ghi nhớ</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><span className="unit-cta">{percent === 100 ? 'Ôn để nhớ lâu hơn' : percent > 0 ? 'Tiếp tục chinh phục' : 'Khám phá ngay'}<Icon name="arrow" size={16} /></span></button>;
}

const PAGE_SIZE = 24;
const WordLibrary = memo(function WordLibrary({ progress, onFavorite }) {
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const controls = useRef(null);
  const favorites = useMemo(() => new Set(progress.favorites), [progress.favorites]);
  const list = useMemo(() => {
    const needle = normalize(query.trim());
    return searchIndex.filter(({ word, text }) => (!onlyFavorites || favorites.has(word.id)) && text.includes(needle)).map(({ word }) => word);
  }, [query, onlyFavorites, favorites]);
  const pageStart = Math.min(visibleCount - PAGE_SIZE, Math.max(0, Math.ceil(list.length / PAGE_SIZE) - 1) * PAGE_SIZE);
  const pageEnd = Math.min(pageStart + PAGE_SIZE, list.length);
  function changePage(start) {
    setVisibleCount(start + PAGE_SIZE);
    controls.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  return <>
    <SpeechReset value={`${query}-${onlyFavorites}-${pageStart}`} />
    <div className="library-controls" ref={controls}><label className="search-box"><Icon name="search" /><span className="sr-only">Tìm từ hoặc nghĩa</span><input value={query} onChange={e => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…" type="search" autoComplete="off" /></label><button className={`btn ${onlyFavorites ? 'primary' : 'secondary'}`} aria-pressed={onlyFavorites} onClick={() => { setOnlyFavorites(!onlyFavorites); setVisibleCount(PAGE_SIZE); }}><Icon name="star" size={17} /> Đã lưu ({progress.favorites.length})</button></div>
    <p className="result-count" aria-live="polite">{list.length} từ vựng{list.length > PAGE_SIZE ? ` · Đang hiện ${pageStart + 1}–${pageEnd}` : ''}</p>
    {!list.length ? <div className="empty-state"><Icon name="search" size={36} /><h2>Chưa tìm thấy từ</h2><p>Thử từ khóa khác hoặc tắt bộ lọc “Đã lưu”.</p></div> : <>
      <div className="word-list">{list.slice(pageStart, pageEnd).map(w => <WordRow key={w.id} word={w} saved={favorites.has(w.id)} learned={isLearned(w, progress)} reviewed={!!progress.cards[w.id]} onFavorite={onFavorite} />)}</div>
      {list.length > PAGE_SIZE && <nav className="word-pagination" aria-label="Trang từ vựng"><button className="btn secondary" disabled={pageStart === 0} onClick={() => changePage(pageStart - PAGE_SIZE)}>Trang trước</button><span>{pageStart / PAGE_SIZE + 1} / {Math.ceil(list.length / PAGE_SIZE)}</span><button className="btn secondary" disabled={pageEnd === list.length} onClick={() => changePage(pageStart + PAGE_SIZE)}>Trang sau <Icon name="arrow" size={17} /></button></nav>}
    </>}
  </>;
});
const WordRow = memo(function WordRow({ word: w, saved, learned, reviewed, onFavorite }) {
  return <article className="word-row"><div><WordSource word={w} /><h2>{w.term} <small className="part-of-speech">({w.partOfSpeech})</small></h2><p className="word-definition">{w.definition}</p></div><div className="word-translation"><strong>{w.meaning}</strong><span className={`word-status ${learned ? 'learned' : ''}`}>{learned ? 'Đã ghi nhớ' : reviewed ? 'Đang học' : 'Từ mới'}</span></div><button className={`favorite-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} từ ${w.term}`} aria-pressed={saved} onClick={() => onFavorite(w.id)}><Icon name="star" /></button></article>;
});

function WordSource({ word, card = false }) {
  return <span className={card ? 'card-label' : 'word-lesson'}>UNIT {word.unitId} · LESSON {word.lessonId} · {word.sourcePage ? `TRANG ${word.sourcePage}` : 'BỔ TRỢ'}</span>;
}

function SessionCelebration() {
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setBurst(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  return <div className="session-celebration" aria-hidden="true">
    <span className="celebration-symbol">✦</span>
    {burst && <span className="celebration-stars">{Array.from({ length: 8 }, (_, i) => <span key={i} style={{ '--burst-x': `${Math.cos(i * Math.PI / 4) * 78}px`, '--burst-y': `${Math.sin(i * Math.PI / 4) * 56}px`, '--burst-turn': `${i * 45}deg` }}>✦</span>)}</span>}
  </div>;
}

function StudySession({ session, progress, onAnswer, onFavorite, onExit, onRestart, heading }) {
  const readWord = useReadWord();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [options, setOptions] = useState(() => quizOptions(session.words[0], words));
  const [leaving, setLeaving] = useState(false);
  const answerLock = useRef(false);
  const card = useRef(null);
  const word = session.words[index];
  const finished = index >= session.words.length;
  function next() {
    answerLock.current = false;
    setIndex(i => i + 1); setFlipped(false); setSelected(null);
    if (session.words[index + 1]) setOptions(quizOptions(session.words[index + 1], words));
    requestAnimationFrame(() => card.current?.focus());
  }
  function mark(remembered) {
    if (answerLock.current) return;
    answerLock.current = true;
    onAnswer(word.id, remembered); setResults(r => [...r, { id: word.id, correct: remembered }]); next();
  }
  function choose(option) {
    if (answerLock.current) return;
    answerLock.current = true;
    setSelected(option); const correct = option === word.meaning;
    if (correct) readWord(word);
    onAnswer(word.id, correct); setResults(r => [...r, { id: word.id, correct }]);
  }
  const wrong = results.filter(r => !r.correct).map(r => wordById[r.id]);
  const streak = results.reduce((count, result) => result.correct ? count + 1 : 0, 0);
  const streakMilestone = streak >= 5 ? Math.floor(streak / 5) * 5 : streak >= 3 ? 3 : 0;
  return <div className="study-page"><button className="back-link" onClick={() => finished ? onExit() : setLeaving(true)}>← Trở về bài học</button>{leaving && <div className="notice warning"><span>Kết thúc phiên học? Các câu đã trả lời được lưu.</span><button onClick={onExit}>Kết thúc</button><button onClick={() => setLeaving(false)}>Học tiếp</button></div>}<PageTitle heading={heading} eyebrow={session.mode === 'quiz' ? 'QUICK QUIZ' : 'FLASHCARDS'} title={session.label} description={session.mode === 'quiz' ? 'Chọn nghĩa tiếng Việt đúng của từ.' : 'Thử nhớ nghĩa trước khi lật thẻ.'} />
    {finished ? <section className="session-result"><SessionCelebration /><h2>Thêm một bước tiến!</h2><p>Bạn nhớ đúng <strong>{results.filter(r => r.correct).length}/{results.length}</strong> từ trong phiên này.</p><div className="result-track"><span style={{ width: `${results.filter(r => r.correct).length / results.length * 100}%` }} /></div><p className="fine-print">Từ đã học được lên lịch ôn lại tự động.</p><div className="button-row">{!!wrong.length && <button className="btn primary" onClick={() => onRestart(wrong, session.mode)}>Luyện lại {wrong.length} từ chưa nhớ</button>}<button className="btn secondary" onClick={() => onRestart(session.words, session.mode)}>Học lại</button><button className="btn secondary" onClick={onExit}>Về bài học</button></div>{!!wrong.length && <div className="wrong-list">{wrong.map(w => <div key={w.id}><strong>{w.term}</strong><span>{w.meaning}</span></div>)}</div>}</section> : <>
      <div className="session-progress"><span>Từ {index + 1} / {session.words.length}</span><span>{Math.round(index / session.words.length * 100)}% hoàn thành</span></div><div className="progress-track session-track"><span style={{ width: `${index / session.words.length * 100}%` }} /></div>
      <div className="streak-slot" role="status" aria-live="polite" aria-atomic="true">{streak >= 3 && <span className="streak-badge" key={streakMilestone}><span aria-hidden="true">🔥</span> {streak >= 5 ? 'Tuyệt lắm!' : 'Đang vào guồng!'} · {streak} từ đúng liên tiếp</span>}</div>
      <SpeechReset value={word.id} />
      <div className="study-card-wrapper" key={word.id}><button className={`favorite-button card-favorite ${progress.favorites.includes(word.id) ? 'saved' : ''}`} aria-label={`${progress.favorites.includes(word.id) ? 'Bỏ lưu' : 'Lưu'} từ ${word.term}`} aria-pressed={progress.favorites.includes(word.id)} onClick={() => onFavorite(word.id)}><Icon name="star" /></button>
        {session.mode === 'flashcard' ? <button ref={card} className={`flashcard ${flipped ? 'flipped' : ''}`} aria-label={flipped ? 'Ẩn nghĩa và xem lại từ' : 'Lật thẻ để xem nghĩa'} aria-pressed={flipped} onClick={() => { setFlipped(value => !value); readWord(word); }}>
          <span className="flashcard-inner">
            <span className="flashcard-face flashcard-front" aria-hidden={flipped}>
              <WordSource word={word} card />
              <span className="flash-side-label">01 / TỪ VỰNG</span>
              <span className="flash-term">{word.term}<small className="flash-pos">({word.partOfSpeech})</small></span>
              <span className="card-prompt">Bạn nhớ từ này nghĩa là gì?</span>
              <span className="flip-hint"><Icon name="repeat" size={16} />Chạm để lật thẻ</span>
            </span>
            <span className="flashcard-face flashcard-back" aria-hidden={!flipped}>
              <WordSource word={word} card />
              <span className="flash-side-label">02 / Ý NGHĨA</span>
              <span className="flash-answer"><strong>{word.meaning}</strong><span>{word.definition}</span></span>
              <span className="flip-hint"><Icon name="repeat" size={16} />Chạm để xem lại từ</span>
            </span>
          </span>
        </button> : <div className="quiz-card" ref={card} tabIndex={-1}><WordSource word={word} card /><h2>{word.term} <small className="part-of-speech">({word.partOfSpeech})</small></h2><p>Chọn nghĩa đúng bên dưới</p></div>}
      </div>
      {session.mode === 'flashcard' ? <><div className="rating-buttons"><button className="btn secondary" onClick={() => mark(false)}><Icon name="repeat" />Chưa nhớ</button><button className="btn primary" onClick={() => mark(true)}><Icon name="check" />Đã nhớ</button></div><p className="study-tip">{flipped ? 'Đánh giá đúng khả năng nhớ để lần ôn sau hiệu quả hơn.' : 'Bạn có thể đánh giá ngay hoặc chạm lật thẻ để xem nghĩa và nghe phát âm.'}</p></> : <><div className="quiz-options" key={word.id}>{options.map((option, i) => <button key={option} disabled={selected !== null} className={`quiz-option ${selected !== null && option === word.meaning ? 'correct' : ''} ${selected === option && option !== word.meaning ? 'incorrect' : ''}`} onClick={() => choose(option)}><span className="option-letter">{'ABCD'[i]}</span><span>{option}</span>{selected !== null && option === word.meaning && <Icon name="check" />}{selected === option && option !== word.meaning && <Icon name="x" />}</button>)}</div>{selected !== null && <div className="quiz-feedback" role="status"><strong>{selected === word.meaning ? 'Chính xác!' : `Đáp án đúng: ${word.meaning}`}</strong><p>{word.definition}</p><button className="btn primary" onClick={next}>{index === session.words.length - 1 ? 'Xem kết quả' : 'Từ tiếp theo'}<Icon name="arrow" size={17} /></button></div>}</>}
    </>}
  </div>;
}
