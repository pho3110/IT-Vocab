import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './liquid-nav.css';

export default function LiquidNav({ items, active, onNavigate }) {
  const nav = useRef(null);
  const lens = useRef(null);
  const previous = useRef(null);
  const animation = useRef(null);
  const drag = useRef(null);
  const frame = useRef(null);
  const settle = useRef(null);
  const suppressClickUntil = useRef(0);
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
      if (drag.current) return;
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
    settle.current = position;
    position();
    const observer = new ResizeObserver(position);
    observer.observe(container);
    observer.observe(button);
    return () => { observer.disconnect(); animation.current?.cancel(); };
  }, [target]);

  useEffect(() => () => { cancelAnimationFrame(frame.current); }, []);

  function moveFinger(event) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.clientX = event.clientX;
    // Keep the grabbed point under the finger, without re-rendering the page.
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (drag.current !== gesture) return;
      const x = Math.max(gesture.minX, Math.min(gesture.maxX, gesture.startX + gesture.clientX - gesture.startClientX));
      lens.current.style.transform = `translate3d(${x}px, ${gesture.y}px, 0)`;
      previous.current = x;
    });
  }

  function endFinger(event, cancelled = false) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    cancelAnimationFrame(frame.current); frame.current = null;
    drag.current = null;
    nav.current.dataset.dragging = 'false';
    nav.current.dataset.pressed = 'false';
    suppressClickUntil.current = performance.now() + 600;
    if (nav.current.hasPointerCapture(event.pointerId)) nav.current.releasePointerCapture(event.pointerId);
    const bounds = nav.current.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    let destination = null;
    if (!cancelled && inside) {
      const distance = item => Math.abs(event.clientX - (item.rect.left + item.rect.width / 2));
      destination = gesture.buttons.reduce((nearest, item) => distance(item) < distance(nearest) ? item : nearest);
    }
    setHovered(null); setFocused(null);
    settle.current?.();
    if (destination) onNavigate(destination.key);
  }

  function startFinger(event) {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (drag.current || !event.isPrimary) return;
    const button = event.target.closest('button[data-page]');
    if (!button) return;
    event.preventDefault();
    const container = nav.current;
    const bounds = container.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const buttons = [...container.querySelectorAll('button[data-page]')].map(el => ({ key: el.dataset.page, rect: el.getBoundingClientRect() }));
    animation.current?.cancel();
    drag.current = {
      pointerId: event.pointerId, buttons, startClientX: event.clientX, clientX: event.clientX,
      startX: rect.left - bounds.left - container.clientLeft,
      y: rect.top - bounds.top - container.clientTop,
      minX: buttons[0].rect.left - bounds.left - container.clientLeft,
      maxX: buttons.at(-1).rect.right - rect.width - bounds.left - container.clientLeft,
    };
    container.dataset.dragging = 'true';
    container.dataset.pressed = 'true';
    lens.current.style.width = `${rect.width}px`;
    lens.current.style.height = `${rect.height}px`;
    lens.current.style.transform = `translate3d(${drag.current.startX}px, ${drag.current.y}px, 0)`;
    lens.current.dataset.visible = 'true';
    container.setPointerCapture(event.pointerId);
  }

  return <nav ref={nav} className="liquid-nav" aria-label="Điều hướng chính"
    onPointerDown={startFinger} onPointerMove={moveFinger}
    onPointerUp={event => endFinger(event)} onPointerCancel={event => endFinger(event, true)}
    onLostPointerCapture={event => endFinger(event, true)}
    onPointerLeave={() => { if (!drag.current) { setHovered(null); nav.current.dataset.pressed = 'false'; } }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }}>
    <span ref={lens} className="liquid-nav-lens" aria-hidden="true"><span className="liquid-nav-surface" /></span>
    {items.map(({ key, label, shortLabel, icon, count }) => <button
      key={key} data-page={key} aria-label={label} aria-current={active === key ? 'page' : undefined}
      className={`nav-item ${active === key ? 'active' : ''}`}
      onPointerEnter={event => { if (!drag.current && event.pointerType === 'mouse') setHovered(key); }}
      onPointerDown={() => { nav.current.dataset.pressed = 'true'; }}
      onPointerUp={() => { nav.current.dataset.pressed = 'false'; }}
      onPointerCancel={() => { nav.current.dataset.pressed = 'false'; setHovered(null); }}
      onFocus={() => setFocused(key)}
      onClick={event => { if (event.detail !== 0 && performance.now() < suppressClickUntil.current) return; setFocused(null); onNavigate(key); }}>
      {icon}<span>{shortLabel || label}</span>{count !== undefined && <span className="nav-count">{count}</span>}
    </button>)}
  </nav>;
}
