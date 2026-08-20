"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import "./option-wheel.css";

const DEFAULT_ITEMS = ["Ambient", "House", "Techno", "Jazz", "Lo-Fi", "Synthwave", "Trance", "Funk", "Disco", "Hip-Hop", "Chillwave", "Drum & Bass"];

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: "left" | "right";
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
  ariaLabel?: string;
}

interface WheelConfig extends Required<Omit<OptionWheelProps, "onChange" | "className" | "defaultSelected" | "ariaLabel">> {
  count: number;
  rowH: number;
}

export function OptionWheel({
  items = DEFAULT_ITEMS, defaultSelected = 3, onChange, textColor = "#a6a6a6", activeColor = "#ffffff",
  side = "left", fontSize = 3, spacing = 1.4, curve = 1, tilt = 6, blur = 2, fade = 0.25,
  minOpacity = 0.05, smoothing = 200, inset = 80, loop = false, draggable = true,
  soundUrl = "", soundVolume = 0.5, className = "", ariaLabel = "经历分类",
}: OptionWheelProps) {
  const initial = Math.min(Math.max(defaultSelected, 0), Math.max(items.length - 1, 0));
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const posRef = useRef(initial);
  const targetRef = useRef(initial);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const cfgRef = useRef<WheelConfig>({} as WheelConfig);
  const onChangeRef = useRef(onChange);
  const selectedRef = useRef(initial);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const lastTickRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(initial);
  const [isDragging, setIsDragging] = useState(false);
  const remPx = typeof window !== "undefined" ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16;

  useEffect(() => {
    onChangeRef.current = onChange;
    cfgRef.current = { count: items.length, items, rowH: Math.max(fontSize * spacing * remPx, 1), curve, tilt, blur, fade, minOpacity, side, loop, smoothing, draggable, soundUrl, soundVolume, textColor, activeColor, fontSize, spacing, inset };
  }, [activeColor, blur, curve, draggable, fade, fontSize, inset, items, loop, minOpacity, onChange, remPx, side, smoothing, soundUrl, soundVolume, spacing, textColor, tilt]);

  const runFrame = useCallback(function frame(now: number) {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt / tau);
    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;
    const mirror = cfg.side === "right" ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const radius = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < cfg.count; i += 1) {
      const el = itemRefs.current[i];
      if (!el) continue;
      let distanceFromCenter = i - next;
      if (cfg.loop && cfg.count > 1) {
        distanceFromCenter = ((distanceFromCenter % cfg.count) + cfg.count) % cfg.count;
        if (distanceFromCenter > cfg.count / 2) distanceFromCenter -= cfg.count;
      }
      const distance = Math.abs(distanceFromCenter);
      let x = 0;
      let y = distanceFromCenter * cfg.rowH;
      let rotation = 0;
      if (radius > 0) {
        const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, distanceFromCenter * tiltRad));
        y = radius * Math.sin(angle);
        x = -mirror * radius * (1 - Math.cos(angle)) * cfg.curve;
        rotation = (mirror * angle * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - distance * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(distance * cfg.blur).toFixed(2)}px)` : "none";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(distance, 1)).toFixed(4));
    }
    rafRef.current = settled ? null : requestAnimationFrame(frame);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const playTick = useCallback(() => {
    const cfg = cfgRef.current;
    if (!cfg.soundUrl) return;
    const now = performance.now();
    if (now - lastTickRef.current < 70) return;
    lastTickRef.current = now;
    if (!audioRef.current || audioUrlRef.current !== cfg.soundUrl) {
      audioRef.current = new Audio(cfg.soundUrl);
      audioRef.current.preload = "auto";
      audioUrlRef.current = cfg.soundUrl;
    }
    audioRef.current.volume = Math.min(Math.max(cfg.soundVolume, 0), 1);
    audioRef.current.currentTime = 0;
    audioRef.current.play()?.catch(() => undefined);
  }, []);

  const applyTarget = useCallback((value: number, snap: boolean) => {
    const cfg = cfgRef.current;
    if (cfg.count === 0) return;
    let next = value;
    if (!cfg.loop) next = Math.min(Math.max(next, 0), Math.max(cfg.count - 1, 0));
    if (snap) next = Math.round(next);
    targetRef.current = next;
    const index = ((Math.round(next) % cfg.count) + cfg.count) % cfg.count;
    if (index !== selectedRef.current) {
      selectedRef.current = index;
      setSelectedIndex(index);
      onChangeRef.current?.(index, cfg.items[index]);
      playTick();
    }
    startLoop();
  }, [playTick, startLoop]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const cfg = cfgRef.current;
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { el.removeEventListener("wheel", onWheel); if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current); };
  }, [applyTarget]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!cfgRef.current.draggable) return;
    dragRef.current = { y: event.clientY, start: targetRef.current, id: event.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = event.clientY - drag.y;
    if (!dragMovedRef.current && Math.abs(dy) > 4) { dragMovedRef.current = true; rootRef.current?.setPointerCapture(drag.id); }
    if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false);
  };
  const handlePointerEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  };
  const handleItemClick = (index: number) => {
    if (dragMovedRef.current) return;
    const cfg = cfgRef.current;
    const current = targetRef.current;
    let delta = index - (((current % cfg.count) + cfg.count) % cfg.count);
    if (cfg.loop && cfg.count > 1) {
      if (delta > cfg.count / 2) delta -= cfg.count;
      else if (delta < -cfg.count / 2) delta += cfg.count;
    }
    applyTarget(current + delta, true);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let delta: number | null = null;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") delta = -1;
    else if (event.key === "ArrowDown" || event.key === "ArrowRight") delta = 1;
    if (delta == null) return;
    event.preventDefault();
    applyTarget(Math.round(targetRef.current) + delta, true);
  };

  useEffect(() => { applyTarget(targetRef.current, false); }, [items, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, applyTarget]);
  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); audioRef.current?.pause(); }, []);

  const style = { "--ow-text-color": textColor, "--ow-active-color": activeColor, "--ow-font-size": `${fontSize}rem`, "--ow-inset": `${inset}px` } as CSSProperties;
  return (
    <div ref={rootRef} role="listbox" tabIndex={0} aria-label={ariaLabel} className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${isDragging ? " option-wheel--dragging" : ""}${className ? ` ${className}` : ""}`} style={style} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onKeyDown={handleKeyDown}>
      {items.map((label, index) => (
        <div key={`${label}-${index}`} ref={(el) => { itemRefs.current[index] = el; }} role="option" aria-selected={selectedIndex === index} className={`option-wheel__item${selectedIndex === index ? " option-wheel__item--selected" : ""}`} onClick={() => handleItemClick(index)}>{label}</div>
      ))}
    </div>
  );
}

export default OptionWheel;
