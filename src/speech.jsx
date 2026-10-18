import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const SpeechContext = createContext(null);
const supported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const englishVoices = () => supported() ? window.speechSynthesis.getVoices().filter(v => /^en(?:[-_]|$)/i.test(v.lang)) : [];

export function SpeechProvider({ children }) {
  const [voices, setVoices] = useState(englishVoices);
  const [voiceId, setVoiceId] = useState('');
  const [rate, setRate] = useState(.85);
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const current = useRef(null);
  const stop = useCallback(() => {
    current.current = null;
    if (supported()) window.speechSynthesis.cancel();
    setActive(null);
  }, []);
  useEffect(() => {
    if (!supported()) return;
    const refresh = () => setVoices(englishVoices());
    const hide = () => { if (document.hidden) stop(); };
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', stop);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refresh);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, [stop]);
  const speak = useCallback((id, term) => {
    if (current.current?.id === id) { stop(); return; }
    stop(); setError('');
    if (!supported()) { setError('Trình duyệt này chưa hỗ trợ đọc từ. Hãy thử trình duyệt khác trên thiết bị.'); return; }
    const available = englishVoices();
    const selected = available.find(v => v.voiceURI === voiceId);
    const voice = selected || available.find(v => v.localService) || available[0];
    if (!voice) { setError('Chưa tìm thấy giọng tiếng Anh. Hãy tải giọng tiếng Anh trong cài đặt giọng nói của thiết bị, rồi mở lại app.'); return; }
    if (!navigator.onLine && !voice.localService) { setError('Giọng này cần mạng. Hãy chọn hoặc tải giọng tiếng Anh trên thiết bị để nghe offline.'); return; }
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = rate;
    current.current = { id, utterance }; setActive(id);
    const clear = () => {
      if (current.current?.utterance !== utterance) return false;
      current.current = null; setActive(null); return true;
    };
    utterance.onend = clear;
    utterance.onerror = event => {
      if (clear() && !['canceled', 'interrupted'].includes(event.error)) setError('Chưa phát được âm thanh. Kiểm tra âm lượng, giọng tiếng Anh đã tải và thử lại.');
    };
    try { window.speechSynthesis.speak(utterance); }
    catch { clear(); setError('Không khởi động được giọng đọc. Hãy kiểm tra cài đặt giọng nói của thiết bị.'); }
  }, [voiceId, rate, stop]);
  const value = useMemo(() => ({ voices, voiceId, setVoiceId, rate, setRate, active, speak, stop }), [voices, voiceId, rate, active, speak, stop]);
  return <SpeechContext.Provider value={value}>{children}{error && <div className="toast speech-error" role="alert"><span>{error}</span><button aria-label="Đóng thông báo giọng đọc" onClick={() => setError('')}>×</button></div>}</SpeechContext.Provider>;
}

export function SpeechReset({ value }) {
  const { stop } = useContext(SpeechContext);
  useEffect(() => { stop(); return stop; }, [value, stop]);
  return null;
}

export function SpeakButton({ word }) {
  const { active, speak } = useContext(SpeechContext);
  const playing = active === word.id;
  return <button type="button" className={`speak-button ${playing ? 'speaking' : ''}`} aria-label={`${playing ? 'Dừng đọc' : 'Nghe phát âm'} ${word.term}`} aria-pressed={playing} onClick={() => speak(word.id, word.term)}><span aria-hidden="true">{playing ? '■' : '🔊'}</span><span>{playing ? 'Dừng' : 'Nghe'}</span></button>;
}

export function SpeechSettings() {
  const { voices, voiceId, setVoiceId, rate, setRate, stop } = useContext(SpeechContext);
  return <section className="settings-card"><h2>Nghe phát âm tiếng Anh</h2><p>Chạm nút 🔊 ở từ điển, flashcard hoặc quiz để nghe từ và cụm từ. Chạm lần nữa để dừng.</p>
    <div className="speech-settings">
      <label>Giọng đọc<select aria-label="Giọng đọc" value={voiceId} onChange={e => { stop(); setVoiceId(e.target.value); }}><option value="">Tự động · ưu tiên giọng trên thiết bị</option>{voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang}) · {v.localService ? 'Trên thiết bị' : 'Cần mạng'}</option>)}</select></label>
      <label>Tốc độ<select aria-label="Tốc độ" value={rate} onChange={e => { stop(); setRate(Number(e.target.value)); }}><option value={.7}>Chậm</option><option value={.85}>Vừa phải</option><option value={1}>Bình thường</option></select></label>
    </div>
    <p className="fine-print">Nghe offline cần giọng tiếng Anh đã tải trên điện thoại. Tìm mục giọng nói / chuyển văn bản thành giọng nói trong cài đặt thiết bị để tải giọng, rồi thử nghe ở chế độ máy bay. “Sẵn sàng offline” của app không có nghĩa là giọng đọc cũng đã được tải. Giọng được đánh dấu “Cần mạng” có thể gửi từ bạn bấm nghe đến dịch vụ giọng nói của trình duyệt.</p>
    {!voices.length && <p>Chưa tìm thấy giọng tiếng Anh trên trình duyệt này.</p>}
    <SpeakButton word={{ id: 'speech-demo', term: 'information technology' }} />
  </section>;
}
