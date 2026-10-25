import { useLayoutEffect, useRef, useState } from 'react';
import './liquid-nav.css';

export default function LiquidNav({ items, active, onNavigate }) {
  const nav = useRef(null);
  const lens = useRef(null);
  const previous = useRef(null);
  const animation = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const target = hovered ?? focused ?? active;

  useLayoutEffect(() => {
    const container = nav.current;
    const indicator = lens.current;
    const button = [...container.querySelectorAll('button[data-page]')].find(el => el.dataset.page === target);
    if (!button) {
      indicator.dataset.visible = 'false';
      return;
    }
    function position() {
      const bounds = container.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      const x = rect.left - bounds.left - container.clientLeft;
      const y = rect.top - bounds.top - container.clientTop;
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${rect.height}px`;
      indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      indicator.dataset.visible = 'true';
      // Animate only a small decorative surface; no work on every pointer move.
      const distance = previous.current === null ? 0 : Math.abs(x - previous.current);
      if (distance > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animation.current?.cancel();
        const stretch = 1 + Math.min(distance / Math.max(rect.width, 1) * .08, .22);
        animation.current = indicator.firstElementChild.animate([
          { transform: 'scale(1, 1)' },
          { transform: `scale(${stretch}, .92)`, offset: .35 },
          { transform: 'scale(.98, 1.02)', offset: .78 },
          { transform: 'scale(1, 1)' },
        ], { duration: 500, easing: 'cubic-bezier(.22,.75,.25,1)' });
      }
      previous.current = x;
      // The first measured position should appear in place, without sliding in.
      indicator.dataset.ready = 'true';
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(container);
    observer.observe(button);
    return () => { observer.disconnect(); animation.current?.cancel(); };
  }, [target]);

  return <nav ref={nav} className="liquid-nav" aria-label="Điều hướng chính"
    onPointerLeave={() => { setHovered(null); nav.current.dataset.pressed = 'false'; }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }}>
    <span ref={lens} className="liquid-nav-lens" aria-hidden="true"><span className="liquid-nav-surface" /></span>
    {items.map(({ key, label, shortLabel, icon, count }) => <button
      key={key} data-page={key} aria-label={label} aria-current={active === key ? 'page' : undefined}
      className={`nav-item ${active === key ? 'active' : ''}`}
      onPointerEnter={event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') setHovered(key); }}
      onPointerDown={() => { nav.current.dataset.pressed = 'true'; }}
      onPointerUp={() => { nav.current.dataset.pressed = 'false'; }}
      onPointerCancel={() => { nav.current.dataset.pressed = 'false'; setHovered(null); }}
      onFocus={() => setFocused(key)}
      onClick={() => { setFocused(null); onNavigate(key); }}>
      {icon}<span>{shortLabel || label}</span>{count !== undefined && <span className="nav-count">{count}</span>}
    </button>)}
  </nav>;
}
