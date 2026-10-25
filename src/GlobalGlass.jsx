import { useEffect } from 'react';

// One delegated listener set also covers dynamically mounted lessons and exams.
// Native scrolling, text selection, focus, and pointer capture remain untouched.
const selector = 'button:not(.nav-item):not(.flashcard), .sidebar > .settings, a.btn, .unit-card, .stat, .word-row, .search-box, .quiz-card, .exam-options label';
export default function GlobalGlass() {
  useEffect(() => {
    let current = null;
    let pressed = null;
    let rect = null;
    let point = null;
    let frame = null;
    let boundsDirty = false;
    const find = target => {
      if (!(target instanceof Element) || target.closest('.liquid-nav')) return null;
      const element = target.closest(selector);
      return element && !element.matches(':disabled') && !element.querySelector('input:disabled') ? element : null;
    };
    function clear() {
      if (current) delete current.dataset.glassActive;
      current = null; rect = null; boundsDirty = false;
    }
    function paint() {
      frame = null;
      if (!current?.isConnected || !point || !rect) return;
      if (boundsDirty) {
        rect = current.getBoundingClientRect(); boundsDirty = false;
        if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) { clear(); return; }
      }
      current.style.setProperty('--glass-x', `${Math.max(0, Math.min(rect.width, point.x - rect.left))}px`);
      current.style.setProperty('--glass-y', `${Math.max(0, Math.min(rect.height, point.y - rect.top))}px`);
    }
    function track(event) {
      const element = find(event.target);
      if (element !== current) {
        clear();
        if (element) {
          rect = element.getBoundingClientRect();
          // Large reading passages remain static and readable while scrolling.
          if (rect.height <= innerHeight) {
            current = element;
            current.dataset.glassActive = 'true';
            current.dataset.glassInput = event.pointerType === 'touch' ? 'touch' : 'pointer';
          }
        }
      }
      point = { x: event.clientX, y: event.clientY };
      if (current && frame === null) frame = requestAnimationFrame(paint);
    }
    function down(event) {
      track(event);
      pressed = current;
      if (pressed) pressed.dataset.glassPressed = 'true';
    }
    function release(event) {
      if (pressed) delete pressed.dataset.glassPressed;
      pressed = null;
      if (event.pointerType !== 'mouse') clear();
    }
    function leave(event) {
      if (current && event.target instanceof Node && current.contains(event.target)
        && (!(event.relatedTarget instanceof Node) || !current.contains(event.relatedTarget))) clear();
    }
    function reset() {
      clear();
      if (pressed) delete pressed.dataset.glassPressed;
      pressed = null;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }
    function scroll() {
      if (pressed || current?.dataset.glassInput === 'touch') { reset(); return; }
      boundsDirty = true;
      if (current && frame === null) frame = requestAnimationFrame(paint);
    }
    const passive = { passive: true };
    document.addEventListener('pointerover', track, passive);
    document.addEventListener('pointermove', track, passive);
    document.addEventListener('pointerdown', down, passive);
    document.addEventListener('pointerup', release, passive);
    document.addEventListener('pointercancel', release, passive);
    document.addEventListener('pointerout', leave, passive);
    document.addEventListener('scroll', scroll, { passive: true, capture: true });
    document.addEventListener('visibilitychange', reset);
    window.addEventListener('resize', reset, passive);
    return () => {
      reset();
      document.removeEventListener('pointerover', track);
      document.removeEventListener('pointermove', track);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('visibilitychange', reset);
      window.removeEventListener('resize', reset);
    };
  }, []);
  return null;
}
