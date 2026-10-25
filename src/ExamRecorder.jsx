import { useEffect, useRef, useState } from 'react';

async function recordingStore(mode, key, blob) {
  if (!globalThis.indexedDB) throw new Error('Thiết bị không hỗ trợ lưu bản ghi.');
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('it-words-exam-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', mode === 'get' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('recordings');
      const request = mode === 'get' ? store.get(key) : mode === 'delete' ? store.delete(key) : store.put(blob, key);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Không lưu được bản ghi.'));
    });
  } finally { db.close(); }
}

export default function ExamRecorder({ recordKey, disabled, onBusy }) {
  const [status, setStatus] = useState('idle');
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const mounted = useRef(true);
  const recorder = useRef(null);
  const stream = useRef(null);
  const stopTracks = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
  useEffect(() => {
    mounted.current = true;
    recordingStore('get', recordKey).then(value => { if (mounted.current && value instanceof Blob) setBlob(value); }).catch(() => {
      if (mounted.current) setError('Chưa đọc được bản ghi đã lưu. Bạn vẫn có thể ghi và tải bản mới về.');
    });
    return () => {
      mounted.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stopTracks();
    };
  }, [recordKey]);
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const nextUrl = URL.createObjectURL(blob); setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [blob]);
  useEffect(() => {
    if (status !== 'recording') return;
    const started = Date.now();
    const timer = setInterval(() => {
      const value = Math.floor((Date.now() - started) / 1000);
      setSeconds(value);
      if (value >= 180 && recorder.current?.state === 'recording') recorder.current.stop();
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);
  async function start() {
    setError(''); onBusy(true); setStatus('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) throw new Error('Trình duyệt chưa hỗ trợ ghi âm. Hãy dùng HTTPS/localhost hoặc ghi bằng ứng dụng trên điện thoại rồi tự luyện theo câu hỏi.');
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const media = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = media;
      const chunks = [];
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      media.onerror = () => { if (mounted.current) { setError('Ghi âm gặp lỗi. Hãy thử lại hoặc dùng ứng dụng ghi âm của thiết bị.'); setStatus('idle'); onBusy(false); } stopTracks(); };
      media.onstop = async () => {
        stopTracks();
        const audio = new Blob(chunks, { type: media.mimeType || chunks[0]?.type || 'audio/webm' });
        if (mounted.current) { setStatus('saving'); if (audio.size) setBlob(audio); }
        try { if (audio.size) await recordingStore('put', recordKey, audio); }
        catch { if (mounted.current) setError('Không lưu được bản ghi trên thiết bị. Hãy tải bản ghi về trước khi rời trang.'); }
        finally { if (mounted.current) { setStatus('idle'); onBusy(false); } }
      };
      media.start(1000); setSeconds(0); setStatus('recording');
    } catch (err) {
      stopTracks();
      if (mounted.current) { setStatus('idle'); onBusy(false); setError(err.name === 'NotAllowedError' ? 'Chưa có quyền dùng micro. Bạn có thể cấp quyền trong trình duyệt hoặc tự ghi âm bên ngoài.' : err.message); }
    }
  }
  async function remove() {
    onBusy(true); setStatus('saving'); setError('');
    try { await recordingStore('delete', recordKey); setBlob(null); }
    catch { setError('Chưa xóa được bản ghi trên thiết bị. Hãy thử lại.'); }
    finally { setStatus('idle'); onBusy(false); }
  }
  return <div className="exam-recorder">
    <p>Ghi âm tối đa 3 phút/câu. Bản ghi chỉ lưu trên thiết bị, không gửi đến dịch vụ bên ngoài. Dừng và tải bản ghi về để giữ bản sao.</p>
    <div className="button-row">
      {status === 'recording' ? <button className="btn danger" onClick={() => recorder.current?.stop()}>Dừng ghi âm ({seconds}s)</button>
        : <button className="btn secondary" disabled={disabled || status !== 'idle'} onClick={start}>{status === 'requesting' ? 'Đang chờ quyền micro…' : status === 'saving' ? 'Đang lưu bản ghi…' : blob ? 'Ghi âm lại câu trả lời' : 'Ghi âm câu trả lời'}</button>}
      {url && blob && <a className="btn secondary" href={url} download={`${recordKey}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`}>Tải bản ghi</a>}
      {url && blob && <button className="btn secondary" disabled={status !== 'idle'} onClick={remove}>Xóa bản ghi</button>}
    </div>
    {url && blob && <audio controls src={url} preload="metadata" aria-label="Nghe lại câu trả lời của bạn" />}
    {error && <p className="notice warning" role="alert">{error}</p>}
  </div>;
}
