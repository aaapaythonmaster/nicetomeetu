"use client";

import { memo, useEffect, useId, useRef, type HTMLAttributes } from "react";
import "./dot-field.css";

const TWO_PI = Math.PI * 2;

export interface DotFieldProps extends HTMLAttributes<HTMLDivElement> {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}

interface Dot { ax: number; ay: number; sx: number; sy: number; vx: number; vy: number; x: number; y: number }

export const DotField = memo(function DotField({
  dotRadius = 1.5, dotSpacing = 14, cursorRadius = 500, cursorForce = 0.1,
  bulgeOnly = true, bulgeStrength = 67, glowRadius = 160, sparkle = false,
  waveAmplitude = 0, gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)", glowColor = "#120F17", className = "", ...rest
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  const propsRef = useRef({ dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo });
  const rebuildRef = useRef<(() => void) | null>(null);
  const glowId = `dot-field-glow-${useId().replaceAll(":", "")}`;
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer: ReturnType<typeof setTimeout>;

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = new Array<Dot>(rows * cols);
      let idx = 0;
      for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
      dotsRef.current = dots;
    }
    function doResize() {
      const parent = canvas?.parentElement;
      if (!canvas || !parent) return;
      const rect = parent.getBoundingClientRect();
      const w = rect.width; const h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, offsetX: rect.left + window.scrollX, offsetY: rect.top + window.scrollY };
      buildDots(w, h);
    }
    function resize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(doResize, 100); }
    function onMouseMove(event: MouseEvent) {
      const size = sizeRef.current;
      mouseRef.current.x = event.pageX - size.offsetX;
      mouseRef.current.y = event.pageY - size.offsetY;
    }
    function updateMouseSpeed() {
      const mouse = mouseRef.current;
      const dx = mouse.prevX - mouse.x; const dy = mouse.prevY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (distance - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x; mouse.prevY = mouse.y;
    }
    const speedInterval = setInterval(updateMouseSpeed, 20);
    let frameCount = 0;
    function tick() {
      try {
      frameCount += 1;
      const dots = dotsRef.current; const mouse = mouseRef.current;
      const { w, h } = sizeRef.current; const p = propsRef.current;
      const time = frameCount * 0.02;
      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const engaged = engagement.current;
      glowOpacity.current += (engaged - glowOpacity.current) * 0.08;
      if (glowEl) { glowEl.setAttribute("cx", String(mouse.x)); glowEl.setAttribute("cy", String(mouse.y)); glowEl.style.opacity = String(glowOpacity.current); }
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, p.gradientFrom); gradient.addColorStop(1, p.gradientTo); ctx.fillStyle = gradient;
      const radiusSq = p.cursorRadius * p.cursorRadius; const radius = p.dotRadius / 2;
      ctx.beginPath();
      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i]; const dx = mouse.x - dot.ax; const dy = mouse.y - dot.ay; const distanceSq = dx * dx + dy * dy;
        if (distanceSq < radiusSq && engaged > 0.01) {
          const distance = Math.sqrt(distanceSq);
          if (p.bulgeOnly) {
            const amount = 1 - distance / p.cursorRadius; const push = amount * amount * p.bulgeStrength * engaged; const angle = Math.atan2(dy, dx);
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx); const move = (500 / distance) * (mouse.speed * p.cursorForce);
            dot.vx += Math.cos(angle) * -move; dot.vy += Math.sin(angle) * -move;
          }
        } else if (p.bulgeOnly) { dot.sx += (dot.ax - dot.sx) * 0.1; dot.sy += (dot.ay - dot.sy) * 0.1; }
        if (!p.bulgeOnly) { dot.vx *= 0.9; dot.vy *= 0.9; dot.x = dot.ax + dot.vx; dot.y = dot.ay + dot.vy; dot.sx += (dot.x - dot.sx) * 0.1; dot.sy += (dot.y - dot.sy) * 0.1; }
        let drawX = dot.sx; let drawY = dot.sy;
        if (p.waveAmplitude > 0) { drawY += Math.sin(dot.ax * 0.03 + time) * p.waveAmplitude; drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * p.waveAmplitude * 0.5; }
        const sparkleRadius = p.sparkle && ((((i * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100) < 3 ? radius * 1.8 : radius;
        ctx.moveTo(drawX + sparkleRadius, drawY); ctx.arc(drawX, drawY, sparkleRadius, 0, TWO_PI);
      }
      ctx.fill();
      rafRef.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? null : requestAnimationFrame(tick);
      } catch (error) {
        rafRef.current = null;
        console.error("DotField animation disabled", error);
      }
    }
    doResize();
    window.addEventListener("resize", resize); window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);
    rebuildRef.current = () => { const { w, h } = sizeRef.current; if (w > 0 && h > 0) buildDots(w, h); };
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); clearInterval(speedInterval); clearTimeout(resizeTimer); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMouseMove); };
  }, []);

  useEffect(() => { rebuildRef.current?.(); }, [dotRadius, dotSpacing]);

  return <div className={`dot-field-container${className ? ` ${className}` : ""}`} {...rest}>
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs><radialGradient id={glowId}><stop offset="0%" stopColor={glowColor} /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
      <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowId})`} style={{ opacity: 0, willChange: "opacity" }} />
    </svg>
  </div>;
});

export default DotField;
