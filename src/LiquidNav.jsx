import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './liquid-nav.css';
import { glassDeformation, springFrames } from './motion.js';

export default function LiquidNav({ items, active, onNavigate }) {
  const nav = useRef(null);
  const lens = useRef(null);
  const animation = useRef(null);
  const slide = useRef(null);
  const slideDestination = useRef(null);
  const drag = useRef(null);
  const frame = useRef(null);
  const settle = useRef(null);
  const suppressClickUntil = useRef(0);
  const pointer = useRef(null);
  const preview = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const target = hovered ?? focused ?? active;

  function setPreview(key) {
    if (preview.current === key) return;
    preview.current = key;
    for (const button of nav.current.querySelectorAll('button[data-page]')) button.dataset.glassPreview = String(button.dataset.page === key);
  }

  function lightAt(clientX, bounds, lensX, width, direct = false) {
    const localX = Math.max(0, Math.min(bounds.width, clientX - bounds.left));
    const glintX = Math.max(-30, Math.min(width - 30, localX - lensX - 30));
    nav.current.style.setProperty('--light-x', `${localX - 90}px`);
    nav.current.style.setProperty('--light-strength', direct ? '.8' : '.28');
    lens.current.style.setProperty('--glint-x', `${glintX}px`);
  }

  useLayoutEffect(() => {
    const container = nav.current;
    const indicator = lens.current;
    const buttonFor = key => [...container.querySelectorAll('button[data-page]')].find(el => el.dataset.page === key);
    function position(override, velocity = 0) {
      if (drag.current) return;
      const button = buttonFor(typeof override === 'string' ? override : target);
      if (!button) { indicator.dataset.visible = 'false'; setPreview(null); return; }
      const bounds = container.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      const x = rect.left - bounds.left - container.clientLeft;
      const y = rect.top - bounds.top - container.clientTop;
      const currentTransform = getComputedStyle(indicator).transform;
      const currentX = currentTransform === 'none' ? x : new DOMMatrixReadOnly(currentTransform).m41;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const distance = Math.abs(x - currentX);
      const wasReady = indicator.dataset.ready === 'true' && indicator.dataset.visible === 'true';
      const surface = indicator.querySelector('.liquid-nav-surface');
      const materialTransform = getComputedStyle(surface).transform;
      if (slide.current?.playState === 'running' && Math.abs(slideDestination.current - x) < .1
        && Math.abs(parseFloat(indicator.style.width || '0') - rect.width) < .5
        && Math.abs(parseFloat(indicator.style.height || '0') - rect.height) < .5) return;
      slide.current?.cancel();
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${rect.height}px`;
      indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      indicator.dataset.visible = 'true';
      setPreview(button.dataset.page);
      if (pointer.current) lightAt(pointer.current.x, bounds, x, rect.width);
      // Animate only a small decorative surface; no work on every pointer move.
      if (wasReady && distance > .1 && !reduced) {
        slide.current = indicator.animate(springFrames(currentX, x, velocity).map(point => ({
          offset: point.offset, transform: `translate3d(${Math.max(2, Math.min(container.clientWidth - rect.width - 2, point.x))}px, ${y}px, 0)`,
        })), { duration: 540, easing: 'linear' });
        slideDestination.current = x;
      }
      if (wasReady && (distance > 1 || materialTransform !== 'none') && !reduced) {
        animation.current?.cancel();
        surface.style.transform = '';
        const stretch = 1 + Math.min(distance / Math.max(rect.width, 1) * .08, .22);
        animation.current = surface.animate([
          { transform: materialTransform === 'none' ? 'scale(1, 1)' : materialTransform },
          { transform: `scale(${stretch}, .92)`, offset: .35 },
          { transform: 'scale(.98, 1.02)', offset: .78 },
          { transform: 'scale(1, 1)' },
        ], { duration: 500, easing: 'cubic-bezier(.22,.75,.25,1)' });
      } else if (reduced) {
        animation.current?.cancel(); surface.style.transform = '';
      }
      // The first measured position should appear in place, without sliding in.
      indicator.dataset.ready = 'true';
    }
    settle.current = position;
    position();
    const observer = new ResizeObserver(() => {
      // Initial observation must not restart the spring one frame after a tap.
      const current = buttonFor(target);
      if (!current) return;
      const rect = current.getBoundingClientRect();
      if (Math.abs(rect.width - parseFloat(indicator.style.width || '0')) > .5 || Math.abs(rect.height - parseFloat(indicator.style.height || '0')) > .5) position();
    });
    observer.observe(container);
    const button = buttonFor(target);
    if (button) observer.observe(button);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (preference.matches) { slide.current?.cancel(); animation.current?.cancel(); lens.current.querySelector('.liquid-nav-surface').style.transform = ''; } };
    preference.addEventListener('change', reduce);
    return () => { cancelAnimationFrame(frame.current); slide.current?.cancel(); animation.current?.cancel(); preference.removeEventListener('change', reduce); };
  }, []);

  function moveFinger(event) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      if (event.pointerType === 'mouse') {
        pointer.current = { x: event.clientX, y: event.clientY };
        if (frame.current === null) frame.current = requestAnimationFrame(() => {
          frame.current = null;
          if (!pointer.current || drag.current) return;
          const transform = lens.current.style.transform;
          const x = transform ? new DOMMatrixReadOnly(transform).m41 : 0;
          lightAt(pointer.current.x, nav.current.getBoundingClientRect(), x, parseFloat(lens.current.style.width || '0'));
        });
      }
      return;
    }
    gesture.clientX = event.clientX;
    const now = performance.now();
    const elapsed = now - gesture.lastTime;
    if (elapsed > 0) gesture.velocity = (event.clientX - gesture.lastClientX) / elapsed * 1000;
    gesture.lastClientX = event.clientX; gesture.lastTime = now;
    // Keep the grabbed point under the finger, without re-rendering the page.
    if (frame.current !== null) return;
    function paint(now) {
      frame.current = null;
      if (drag.current !== gesture) return;
      const x = Math.max(gesture.minX, Math.min(gesture.maxX, gesture.startX + gesture.clientX - gesture.startClientX));
      lens.current.style.transform = `translate3d(${x}px, ${gesture.y}px, 0)`;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const desiredVelocity = now - gesture.lastTime < 65 ? gesture.velocity : 0;
      gesture.visualVelocity += (desiredVelocity - gesture.visualVelocity) * .28;
      const shape = glassDeformation(gesture.visualVelocity, true, reduced);
      lens.current.querySelector('.liquid-nav-surface').style.transform = `scale(${shape.scaleX}, ${shape.scaleY}) skewX(${shape.skew}deg)`;
      lightAt(gesture.clientX, gesture.bounds, x, gesture.width, true);
      const center = gesture.bounds.left + x + gesture.width / 2;
      const closest = gesture.buttons.reduce((a, b) => Math.abs(center - a.rect.left - a.rect.width / 2) < Math.abs(center - b.rect.left - b.rect.width / 2) ? a : b);
      setPreview(closest.key);
      // Continue briefly to let the gel relax after the finger stops; never idle-loop.
      if (!reduced && (now - gesture.lastTime < 80 || Math.abs(gesture.visualVelocity) > 3)) frame.current = requestAnimationFrame(paint);
    }
    frame.current = requestAnimationFrame(paint);
  }

  function endFinger(event, cancelled = false) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    cancelAnimationFrame(frame.current); frame.current = null;
    drag.current = null;
    nav.current.dataset.dragging = 'false';
    nav.current.dataset.pressed = 'false';
    nav.current.dataset.interacting = 'false';
    pointer.current = null;
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
    settle.current?.(destination?.key ?? active, performance.now() - gesture.lastTime < 90 && !cancelled ? gesture.velocity : 0);
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
    cancelAnimationFrame(frame.current); frame.current = null;
    animation.current?.cancel();
    slide.current?.cancel();
    drag.current = {
      pointerId: event.pointerId, buttons, startClientX: event.clientX, clientX: event.clientX,
      lastClientX: event.clientX, lastTime: performance.now(), velocity: 0,
      visualVelocity: 0, bounds, width: rect.width,
      startX: rect.left - bounds.left - container.clientLeft,
      y: rect.top - bounds.top - container.clientTop,
      minX: buttons[0].rect.left - bounds.left - container.clientLeft,
      maxX: buttons.at(-1).rect.right - rect.width - bounds.left - container.clientLeft,
    };
    container.dataset.dragging = 'true';
    container.dataset.pressed = 'true';
    container.dataset.interacting = 'true';
    container.dataset.input = 'touch';
    lens.current.style.width = `${rect.width}px`;
    lens.current.style.height = `${rect.height}px`;
    lens.current.style.transform = `translate3d(${drag.current.startX}px, ${drag.current.y}px, 0)`;
    lens.current.dataset.visible = 'true';
    setPreview(button.dataset.page);
    lightAt(event.clientX, bounds, drag.current.startX, rect.width, true);
    container.setPointerCapture(event.pointerId);
  }

  return <nav ref={nav} className="liquid-nav" aria-label="Điều hướng chính"
    onPointerDown={startFinger} onPointerMove={moveFinger}
    onPointerUp={event => endFinger(event)} onPointerCancel={event => endFinger(event, true)}
    onLostPointerCapture={event => endFinger(event, true)}
    onPointerLeave={() => { if (!drag.current) { setHovered(null); pointer.current = null; nav.current.dataset.pressed = 'false'; nav.current.dataset.interacting = 'false'; } }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }}>
    <span className="liquid-nav-illumination" aria-hidden="true"><span /></span>
    <span ref={lens} className="liquid-nav-lens" aria-hidden="true"><span className="liquid-nav-lift"><span className="liquid-nav-surface"><span className="liquid-nav-glint" /></span></span></span>
    {items.map(({ key, label, shortLabel, icon, count }) => <button
      key={key} data-page={key} aria-label={label} aria-current={active === key ? 'page' : undefined}
      className={`nav-item ${active === key ? 'active' : ''}`}
      onPointerEnter={event => {
        if (!drag.current && event.pointerType === 'mouse') {
          pointer.current = { x: event.clientX, y: event.clientY };
          nav.current.dataset.interacting = 'true'; nav.current.dataset.input = 'pointer'; setHovered(key);
        }
      }}
      onPointerDown={() => { nav.current.dataset.pressed = 'true'; }}
      onPointerUp={() => { nav.current.dataset.pressed = 'false'; }}
      onPointerCancel={() => { nav.current.dataset.pressed = 'false'; setHovered(null); }}
      onFocus={() => { setHovered(null); setFocused(key); }}
      onClick={event => { if (event.detail !== 0 && performance.now() < suppressClickUntil.current) return; setFocused(null); onNavigate(key); }}>
      {icon}<span>{shortLabel || label}</span>{count !== undefined && <span className="nav-count">{count}</span>}
    </button>)}
  </nav>;
}
