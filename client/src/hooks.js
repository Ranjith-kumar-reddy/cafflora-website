import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from './api.js';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const clamp = (value) => Math.min(1, Math.max(-1, value));

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MOTION).matches);
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Photo frames in 3D. The frame swings up into place as it scrolls into view (classes
// `reveal`, then `is-in`), then tilts toward the mouse with the picture shifting inside it
// (class `is-tilting`, and --px/--py from -1 to 1 across the frame). The tilt is for mice
// only, and nothing moves when the visitor prefers reduced motion.
export function useDepth() {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  // A layout effect hides frames before the first paint, so they don't flash.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || !('IntersectionObserver' in window)) return undefined;
    el.classList.add('reveal');
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      el.classList.add('is-in');
      observer.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.classList.remove('reveal', 'is-in');
    };
  }, [reduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !window.matchMedia(FINE_POINTER).matches) return undefined;
    let frame = 0;
    const setTilt = (x, y) => {
      el.style.setProperty('--px', x);
      el.style.setProperty('--py', y);
    };
    const onEnter = () => el.classList.add('is-tilting');
    const onMove = (event) => {
      // The outer element never tilts, so its box is a steady measure.
      const box = el.getBoundingClientRect();
      const x = clamp(((event.clientX - box.left) / box.width) * 2 - 1);
      const y = clamp(((event.clientY - box.top) / box.height) * 2 - 1);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTilt(x.toFixed(3), y.toFixed(3)));
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.classList.remove('is-tilting');
      setTilt(0, 0);
    };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      onLeave();
    };
  }, [reduced]);

  return ref;
}

// The hero picture in 3D: it turns gently with the mouse, the title floats in front of it,
// and the picture pulls back into the distance as the visitor scrolls. Sets --mx/--my
// (-1 to 1 across the window) and --hs (0 to 1 over the hero's height) on the hero,
// eased toward their targets for a slow, film-like follow.
export function useHeroDepth() {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return undefined;
    const target = { mx: 0, my: 0, hs: 0 };
    const now = { mx: 0, my: 0, hs: 0 };
    let frame = 0;

    const tick = () => {
      let moving = false;
      for (const key of Object.keys(target)) {
        const gap = target[key] - now[key];
        now[key] = Math.abs(gap) < 0.0005 ? target[key] : now[key] + gap * 0.07;
        if (now[key] !== target[key]) moving = true;
        el.style.setProperty(`--${key}`, now[key].toFixed(4));
      }
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event) => {
      target.mx = clamp((event.clientX / window.innerWidth) * 2 - 1);
      target.my = clamp((event.clientY / window.innerHeight) * 2 - 1);
      wake();
    };
    const onScroll = () => {
      target.hs = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight || window.innerHeight)));
      wake();
    };

    const followMouse = window.matchMedia(FINE_POINTER).matches;
    if (followMouse) window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return ref;
}

// True once every image in `sources` has loaded. Used to show photo rows only when
// all of their photos exist, so the rows stay symmetric. Pass a stable array.
export function useAllImagesLoaded(sources) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all(sources.map((src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    })))
      .then(() => !cancelled && setLoaded(true))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sources]);
  return loaded;
}

export function useMenu() {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    api.menu()
      .then((data) => setState({ status: 'ready', data, error: '' }))
      .catch((err) => setState({ status: 'error', data: null, error: err.message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
