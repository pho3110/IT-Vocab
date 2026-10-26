import { useEffect, useRef, useState } from 'react';
import LiquidNav from './LiquidNav.jsx';

export default function ResponsiveNav({ items, active, onNavigate }) {
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 700px)').matches);
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const backdropPress = useRef(false);
  useEffect(() => {
    const media = matchMedia('(max-width: 700px)');
    const change = () => { setCompact(media.matches); if (!media.matches) setOpen(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const main = items.slice(0, 3);
  const extra = items.slice(3);
  const more = { key: 'more', label: 'Thêm', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg> };
  return <>
    <LiquidNav items={compact ? [...main, more] : items}
      active={compact && (open || extra.some(item => item.key === active)) ? 'more' : active}
      onNavigate={key => key === 'more' ? setOpen(true) : onNavigate(key)} />
    <dialog ref={dialog} className="nav-sheet" aria-labelledby="nav-sheet-title" onClose={() => setOpen(false)}
      onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
      onPointerUp={event => { if (backdropPress.current && event.target === event.currentTarget) setOpen(false); backdropPress.current = false; }}>
      <div className="nav-sheet-content">
        <div className="nav-sheet-heading"><h2 id="nav-sheet-title">Khám phá thêm</h2><button className="nav-sheet-close" aria-label="Đóng menu" onClick={() => setOpen(false)}>×</button></div>
        <div className="nav-sheet-links">{extra.map(item => <button key={item.key} aria-label={item.label} aria-current={active === item.key ? 'page' : undefined} onClick={() => { setOpen(false); onNavigate(item.key); }}>
          <span className="nav-sheet-icon">{item.icon}</span><span>{item.shortLabel || item.label}</span><span className="nav-sheet-arrow" aria-hidden="true">›</span>
        </button>)}</div>
      </div>
    </dialog>
  </>;
}
