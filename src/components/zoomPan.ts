import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

type DivPointerEvent = ReactPointerEvent<HTMLDivElement>;

export type TapZone = 'left' | 'center' | 'right';

export const MAX_SCALE = 5;
export const DOUBLE_TAP_SCALE = 2.5;

const TAP_SLOP_PX = 12;
const TAP_MAX_MS = 400;
const DOUBLE_TAP_MS = 280;
const CENTER_TAP_DELAY_MS = 190;
const ZOOM_ANIM_MS = 200;
export const SIDE_ZONE = 0.35;

type Pt = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function capture(el: HTMLElement, pointerId: number) {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    void 0;
  }
}

function isInteractive(target: EventTarget | null) {
  return !!(target as HTMLElement | null)?.closest?.('button, a, input, select, textarea');
}

function useTapRecognizer({
  splitZones,
  onZoneTap,
  onDoubleTap,
}: {
  splitZones: boolean;
  onZoneTap: (zone: TapZone) => void;
  onDoubleTap: (point: Pt) => void;
}) {
  const lastTap = useRef<{ at: number; point: Pt } | null>(null);
  const pending = useRef<number | undefined>(undefined);

  const cancelPending = useCallback(() => {
    window.clearTimeout(pending.current);
    pending.current = undefined;
    lastTap.current = null;
  }, []);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  const registerTap = useCallback(
    (point: Pt, rect: DOMRect) => {
      const now = performance.now();
      const previous = lastTap.current;
      const zone: TapZone = !splitZones
        ? 'center'
        : (point.x - rect.left) / rect.width < SIDE_ZONE
          ? 'left'
          : (point.x - rect.left) / rect.width > 1 - SIDE_ZONE
            ? 'right'
            : 'center';

      if (
        previous &&
        now - previous.at < DOUBLE_TAP_MS &&
        distance(previous.point, point) < 40 &&
        zone === 'center'
      ) {
        window.clearTimeout(pending.current);
        pending.current = undefined;
        lastTap.current = null;
        onDoubleTap(point);
        return;
      }

      lastTap.current = { at: now, point };
      if (zone === 'center') {
        window.clearTimeout(pending.current);
        pending.current = window.setTimeout(() => {
          pending.current = undefined;
          onZoneTap('center');
        }, CENTER_TAP_DELAY_MS);
      } else {
        onZoneTap(zone);
      }
    },
    [splitZones, onZoneTap, onDoubleTap],
  );

  return { registerTap, cancelPending };
}

type Transform = { scale: number; x: number; y: number };
const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

type Gesture = {
  kind: 'pan' | 'pinch';
  start: Transform;
  from: Pt;
  spread: number;
  moved: boolean;
  startedAt: number;
};

export function useZoomPan({
  splitZones,
  onZoneTap,
  resetKey,
}: {
  splitZones: boolean;
  onZoneTap: (zone: TapZone) => void;
  resetKey: unknown;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const [animating, setAnimating] = useState(false);
  const animTimer = useRef<number | undefined>(undefined);

  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);

  const layoutTop = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return 0;
    return Math.max(0, (container.clientHeight - content.offsetHeight) / 2);
  }, []);

  const clampTransform = useCallback(
    (next: Transform): Transform => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return next;
      const width = content.offsetWidth * next.scale;
      const height = content.offsetHeight * next.scale;
      const viewport = container.clientHeight;
      const top = layoutTop();
      const slackX = Math.max(0, (width - container.clientWidth) / 2);
      const [minY, maxY] =
        height <= viewport
          ? [(viewport - height) / 2 - top, (viewport - height) / 2 - top]
          : [viewport - height - top, -top];
      return {
        scale: next.scale,
        x: clamp(next.x, -slackX, slackX),
        y: clamp(next.y, minY, maxY),
      };
    },
    [layoutTop],
  );

  const commit = useCallback((next: Transform) => {
    setTransform((current) =>
      current.scale === next.scale && current.x === next.x && current.y === next.y ? current : next,
    );
  }, []);

  const scaleAround = useCallback(
    (nextScale: number, focal: Pt, base: Transform, baseFocal: Pt) => {
      const container = containerRef.current;
      if (!container) return base;
      const rect = container.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + layoutTop();
      const ratio = nextScale / base.scale;
      return clampTransform({
        scale: nextScale,
        x: focal.x - originX - ratio * (baseFocal.x - originX - base.x),
        y: focal.y - originY - ratio * (baseFocal.y - originY - base.y),
      });
    },
    [clampTransform, layoutTop],
  );

  const animate = useCallback(() => {
    setAnimating(true);
    window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnimating(false), ZOOM_ANIM_MS);
  }, []);

  const zoomTo = useCallback(
    (nextScale: number, focal: Pt) => {
      const target = clamp(nextScale, 1, MAX_SCALE);
      const base = transformRef.current;
      commit(target === 1 ? IDENTITY : scaleAround(target, focal, base, focal));
    },
    [commit, scaleAround],
  );

  const { registerTap, cancelPending } = useTapRecognizer({
    splitZones,
    onZoneTap,
    onDoubleTap: (point) => {
      animate();
      zoomTo(transformRef.current.scale > 1.05 ? 1 : DOUBLE_TAP_SCALE, point);
    },
  });

  useEffect(() => {
    pointers.current.clear();
    gesture.current = null;
    cancelPending();
    setTransform(IDENTITY);
  }, [resetKey, cancelPending]);

  useEffect(() => {
    const onResize = () => commit(clampTransform(transformRef.current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampTransform, commit]);

  useEffect(() => () => window.clearTimeout(animTimer.current), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const current = transformRef.current;
        zoomTo(current.scale * Math.exp(-e.deltaY / 300), { x: e.clientX, y: e.clientY });
        return;
      }
      const current = transformRef.current;
      commit(clampTransform({ ...current, x: current.x - e.deltaX, y: current.y - e.deltaY }));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [clampTransform, commit, zoomTo]);

  const onPointerDown = (e: DivPointerEvent) => {
    if (isInteractive(e.target)) return;
    const container = containerRef.current;
    if (!container) return;
    capture(container, e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimating(false);

    if (pointers.current.size === 1) {
      gesture.current = {
        kind: 'pan',
        start: transformRef.current,
        from: { x: e.clientX, y: e.clientY },
        spread: 0,
        moved: false,
        startedAt: performance.now(),
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      cancelPending();
      gesture.current = {
        kind: 'pinch',
        start: transformRef.current,
        from: midpoint(a, b),
        spread: distance(a, b),
        moved: true,
        startedAt: performance.now(),
      };
    }
  };

  const onPointerMove = (e: DivPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const point = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, point);
    const active = gesture.current;
    if (!active) return;

    if (active.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const spread = distance(a, b);
      if (active.spread <= 0) return;
      const nextScale = clamp(active.start.scale * (spread / active.spread), 1, MAX_SCALE);
      commit(scaleAround(nextScale, midpoint(a, b), active.start, active.from));
      return;
    }

    if (active.kind === 'pan') {
      const dx = point.x - active.from.x;
      const dy = point.y - active.from.y;
      if (!active.moved && Math.hypot(dx, dy) > TAP_SLOP_PX) {
        active.moved = true;
        cancelPending();
      }
      commit(clampTransform({ ...active.start, x: active.start.x + dx, y: active.start.y + dy }));
    }
  };

  const endPointer = (e: DivPointerEvent, cancelled: boolean) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const active = gesture.current;
    const container = containerRef.current;

    if (pointers.current.size === 0) {
      gesture.current = null;
      if (
        !cancelled &&
        container &&
        active?.kind === 'pan' &&
        !active.moved &&
        performance.now() - active.startedAt < TAP_MAX_MS
      ) {
        registerTap({ x: e.clientX, y: e.clientY }, container.getBoundingClientRect());
      }
      return;
    }
    const [remaining] = [...pointers.current.values()];
    gesture.current = {
      kind: 'pan',
      start: transformRef.current,
      from: remaining,
      spread: 0,
      moved: true,
      startedAt: performance.now(),
    };
  };

  return {
    containerRef,
    contentRef,
    scale: transform.scale,
    contentStyle: {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
      transformOrigin: '50% 0',
      transition: animating ? `transform ${ZOOM_ANIM_MS}ms ease-out` : undefined,
      willChange: 'transform',
    } as CSSProperties,
    containerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: DivPointerEvent) => endPointer(e, false),
      onPointerCancel: (e: DivPointerEvent) => endPointer(e, true),
      style: { touchAction: 'none' } as CSSProperties,
    },
  };
}

export function useWebtoonZoom({ onTap }: { onTap: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const focalRef = useRef<{ contentX: number; contentY: number; px: number; py: number } | null>(null);

  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<
    | null
    | { kind: 'pan'; from: Pt; scroll: Pt; moved: boolean; startedAt: number }
    | { kind: 'pinch'; startScale: number; spread: number }
  >(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const focal = focalRef.current;
    focalRef.current = null;
    if (!container || !focal) return;
    container.scrollLeft = focal.contentX * scale - focal.px;
    container.scrollTop = focal.contentY * scale - focal.py;
  }, [scale]);

  const zoomTo = useCallback((nextScale: number, focal: Pt) => {
    const container = containerRef.current;
    if (!container) return;
    const target = clamp(nextScale, 1, MAX_SCALE);
    if (target === scaleRef.current) return;
    const rect = container.getBoundingClientRect();
    const px = focal.x - rect.left;
    const py = focal.y - rect.top;
    focalRef.current = {
      contentX: (container.scrollLeft + px) / scaleRef.current,
      contentY: (container.scrollTop + py) / scaleRef.current,
      px,
      py,
    };
    setScale(target);
  }, []);

  const { registerTap, cancelPending } = useTapRecognizer({
    splitZones: false,
    onZoneTap: onTap,
    onDoubleTap: (point) => zoomTo(scaleRef.current > 1.05 ? 1 : DOUBLE_TAP_SCALE, point),
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(scaleRef.current * Math.exp(-e.deltaY / 300), { x: e.clientX, y: e.clientY });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2 && e.cancelable) e.preventDefault();
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, [zoomTo]);

  const onPointerDown = (e: DivPointerEvent) => {
    if (isInteractive(e.target)) return;
    const container = containerRef.current;
    if (!container) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      if (scaleRef.current > 1) capture(container, e.pointerId);
      gesture.current = {
        kind: 'pan',
        from: { x: e.clientX, y: e.clientY },
        scroll: { x: container.scrollLeft, y: container.scrollTop },
        moved: false,
        startedAt: performance.now(),
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      cancelPending();
      gesture.current = { kind: 'pinch', startScale: scaleRef.current, spread: distance(a, b) };
    }
  };

  const onPointerMove = (e: DivPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const container = containerRef.current;
    if (!container) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const active = gesture.current;
    if (!active) return;

    if (active.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      if (active.spread <= 0) return;
      zoomTo(active.startScale * (distance(a, b) / active.spread), midpoint(a, b));
      return;
    }

    if (active.kind === 'pan') {
      const dx = e.clientX - active.from.x;
      const dy = e.clientY - active.from.y;
      if (!active.moved && Math.hypot(dx, dy) > TAP_SLOP_PX) {
        active.moved = true;
        cancelPending();
      }
      if (scaleRef.current > 1) {
        container.scrollLeft = active.scroll.x - dx;
        container.scrollTop = active.scroll.y - dy;
      }
    }
  };

  const endPointer = (e: DivPointerEvent, cancelled: boolean) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const active = gesture.current;
    const container = containerRef.current;
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (
      !cancelled &&
      container &&
      active?.kind === 'pan' &&
      !active.moved &&
      performance.now() - active.startedAt < TAP_MAX_MS
    ) {
      registerTap({ x: e.clientX, y: e.clientY }, container.getBoundingClientRect());
    }
  };

  return {
    containerRef,
    scale,
    containerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: DivPointerEvent) => endPointer(e, false),
      onPointerCancel: (e: DivPointerEvent) => endPointer(e, true),
      style: { touchAction: scale > 1 ? 'none' : 'pan-y' } as CSSProperties,
    },
  };
}
