"use client";

import { useState, useTransition } from "react";

import { DynamicBackground } from "@/components/visual/dynamic-background";
import { deriveMotionColors } from "@/src/features/appearance/colors";
import { DEFAULT_APPEARANCE, type AppearanceSettings } from "@/src/features/appearance/contracts";
import { publishAppearanceDraftAction, saveAppearanceDraftAction } from "@/src/features/publishing/actions";

type NumericFieldProps = { label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void };

function NumericField({ label, value, min, max, step = 0.1, onChange }: NumericFieldProps) {
  return <label className="grid gap-2 text-sm text-slate-300">
    <span>{label}</span>
    <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-mono text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
  </label>;
}

function ToggleField({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className={`flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm ${disabled ? "text-slate-500" : "text-slate-200"}`}>
    <span>{label}</span>
    <input className="size-5 accent-cyan-400 outline-none focus:ring-2 focus:ring-cyan-300" type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.currentTarget.checked)} />
  </label>;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="border-t border-white/10 py-8 first:border-t-0 first:pt-0">
    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
    <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">{title}</h2>
    <div className="mt-6 grid grid-cols-3 gap-4">{children}</div>
  </section>;
}

export function AppearanceEditor({ initialSettings, sourceStatus }: { initialSettings: AppearanceSettings; sourceStatus: string }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const derived = settings.derivedColorOverride && settings.derivedColors ? settings.derivedColors : deriveMotionColors(settings.primaryColor);

  const updateColorBends = (key: keyof AppearanceSettings["colorBends"], value: number | boolean) => setSettings((current) => ({ ...current, colorBends: { ...current.colorBends, [key]: value } } as AppearanceSettings));
  const updateDotField = (key: keyof AppearanceSettings["dotField"], value: number | boolean | string) => setSettings((current) => ({ ...current, dotField: { ...current.dotField, [key]: value } } as AppearanceSettings));
  const updateWheel = (key: keyof AppearanceSettings["optionWheel"], value: number | boolean) => setSettings((current) => ({ ...current, optionWheel: { ...current.optionWheel, [key]: value } } as AppearanceSettings));
  const run = (job: () => Promise<unknown>, success: string) => startTransition(async () => {
    setMessage("");
    try { await job(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失败，请重试。"); }
  });
  const openPreview = () => {
    const preview = window.open("about:blank", "nicetomeetu-appearance-preview");
    startTransition(async () => {
      setMessage("");
      try {
        await saveAppearanceDraftAction(settings);
        if (preview) {
          preview.location.href = "/admin/appearance/preview";
          setMessage("草稿已保存，并已打开全屏预览。");
        } else {
          setMessage("草稿已保存。请允许浏览器弹出窗口后再次预览。");
        }
      } catch (error) {
        preview?.close();
        setMessage(error instanceof Error ? error.message : "保存预览草稿失败，请重试。");
      }
    });
  };

  return <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-8">
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8">
      <Section eyebrow="Global" title="统一颜色">
        <label className="grid gap-2 text-sm text-slate-300"><span>主色</span><input className="h-11 w-full rounded-xl border border-white/10 bg-black/25 p-1" type="color" value={settings.primaryColor} onChange={(event) => setSettings((current) => ({ ...current, primaryColor: event.currentTarget.value }))} /></label>
        <ToggleField label="手动覆盖衍生色" checked={settings.derivedColorOverride} onChange={(checked) => setSettings((current) => ({ ...current, derivedColorOverride: checked, derivedColors: checked ? (current.derivedColors ?? deriveMotionColors(current.primaryColor)) : undefined }))} />
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">当前衍生色 <span className="ml-2 font-mono text-white">{derived.light} / {derived.dark}</span></div>
        {settings.derivedColorOverride ? <><label className="grid gap-2 text-sm text-slate-300"><span>亮色</span><input className="h-11 w-full rounded-xl border border-white/10 bg-black/25 p-1" type="color" value={derived.light} onChange={(event) => setSettings((current) => ({ ...current, derivedColors: { light: event.currentTarget.value, dark: derived.dark } }))} /></label><label className="grid gap-2 text-sm text-slate-300"><span>暗色</span><input className="h-11 w-full rounded-xl border border-white/10 bg-black/25 p-1" type="color" value={derived.dark} onChange={(event) => setSettings((current) => ({ ...current, derivedColors: { light: derived.light, dark: event.currentTarget.value } }))} /></label></> : null}
      </Section>

      <Section eyebrow="Effect 01" title="Color Bends">
        <NumericField label="Rotation (deg)" value={settings.colorBends.rotation} min={-360} max={360} step={1} onChange={(v) => updateColorBends("rotation", v)} />
        <NumericField label="Auto Rotate (deg/s)" value={settings.colorBends.autoRotate} min={-360} max={360} onChange={(v) => updateColorBends("autoRotate", v)} />
        <NumericField label="Speed" value={settings.colorBends.speed} min={0} max={5} onChange={(v) => updateColorBends("speed", v)} />
        <NumericField label="Scale" value={settings.colorBends.scale} min={0.01} max={5} onChange={(v) => updateColorBends("scale", v)} />
        <NumericField label="Frequency" value={settings.colorBends.frequency} min={0.01} max={10} onChange={(v) => updateColorBends("frequency", v)} />
        <NumericField label="Warp Strength" value={settings.colorBends.warpStrength} min={0} max={5} onChange={(v) => updateColorBends("warpStrength", v)} />
        <NumericField label="Mouse Influence" value={settings.colorBends.mouseInfluence} min={0} max={5} onChange={(v) => updateColorBends("mouseInfluence", v)} />
        <NumericField label="Parallax" value={settings.colorBends.parallax} min={0} max={2} onChange={(v) => updateColorBends("parallax", v)} />
        <NumericField label="Noise" value={settings.colorBends.noise} min={0} max={1} step={0.01} onChange={(v) => updateColorBends("noise", v)} />
        <NumericField label="Iterations" value={settings.colorBends.iterations} min={1} max={5} step={1} onChange={(v) => updateColorBends("iterations", v)} />
        <NumericField label="Intensity" value={settings.colorBends.intensity} min={0} max={5} onChange={(v) => updateColorBends("intensity", v)} />
        <NumericField label="Band Width" value={settings.colorBends.bandWidth} min={0.01} max={5} onChange={(v) => updateColorBends("bandWidth", v)} />
        <ToggleField label="透明背景" checked={settings.colorBends.transparent} onChange={(v) => updateColorBends("transparent", v)} />
      </Section>

      <Section eyebrow="Effect 02" title="Dot Field">
        <NumericField label="Dot Radius" value={settings.dotField.dotRadius} min={0.1} max={10} onChange={(v) => updateDotField("dotRadius", v)} />
        <NumericField label="Dot Spacing" value={settings.dotField.dotSpacing} min={0.1} max={100} onChange={(v) => updateDotField("dotSpacing", v)} />
        <NumericField label="Dot Opacity" value={settings.dotField.dotOpacity} min={0} max={1} step={0.01} onChange={(v) => updateDotField("dotOpacity", v)} />
        <NumericField label="Cursor Radius" value={settings.dotField.cursorRadius} min={1} max={2000} step={1} onChange={(v) => updateDotField("cursorRadius", v)} />
        <NumericField label="Cursor Force" value={settings.dotField.cursorForce} min={-2} max={2} onChange={(v) => updateDotField("cursorForce", v)} />
        <NumericField label="Bulge Strength" value={settings.dotField.bulgeStrength} min={0} max={200} step={1} onChange={(v) => updateDotField("bulgeStrength", v)} />
        <NumericField label="Glow Radius" value={settings.dotField.glowRadius} min={0} max={1000} step={1} onChange={(v) => updateDotField("glowRadius", v)} />
        <NumericField label="Glow Opacity" value={settings.dotField.glowOpacity} min={0} max={1} step={0.01} onChange={(v) => updateDotField("glowOpacity", v)} />
        <NumericField label="Wave Amplitude" value={settings.dotField.waveAmplitude} min={0} max={100} onChange={(v) => updateDotField("waveAmplitude", v)} />
        <ToggleField label="Bulge Only" checked={settings.dotField.bulgeOnly} onChange={(v) => updateDotField("bulgeOnly", v)} />
        <ToggleField label="Sparkle" checked={settings.dotField.sparkle} onChange={(v) => updateDotField("sparkle", v)} />
        <label className="grid gap-2 text-sm text-slate-300"><span>Glow Color</span><input className="h-11 w-full rounded-xl border border-white/10 bg-black/25 p-1" type="color" value={settings.dotField.glowColor} onChange={(event) => updateDotField("glowColor", event.currentTarget.value)} /></label>
      </Section>

      <Section eyebrow="Navigation" title="Option Wheel">
        <NumericField label="Font Size (rem)" value={settings.optionWheel.fontSize} min={0.1} max={8} onChange={(v) => updateWheel("fontSize", v)} />
        <NumericField label="Spacing" value={settings.optionWheel.spacing} min={0.1} max={4} onChange={(v) => updateWheel("spacing", v)} />
        <NumericField label="Curve" value={settings.optionWheel.curve} min={0} max={4} onChange={(v) => updateWheel("curve", v)} />
        <NumericField label="Tilt" value={settings.optionWheel.tilt} min={0} max={45} onChange={(v) => updateWheel("tilt", v)} />
        <NumericField label="Blur" value={settings.optionWheel.blur} min={0} max={20} onChange={(v) => updateWheel("blur", v)} />
        <NumericField label="Fade" value={settings.optionWheel.fade} min={0} max={1} onChange={(v) => updateWheel("fade", v)} />
        <NumericField label="Minimum Opacity" value={settings.optionWheel.minOpacity} min={0} max={1} onChange={(v) => updateWheel("minOpacity", v)} />
        <NumericField label="Smoothing (ms)" value={settings.optionWheel.smoothing} min={1} max={2000} step={1} onChange={(v) => updateWheel("smoothing", v)} />
        <NumericField label="Inset (px)" value={settings.optionWheel.inset} min={0} max={500} step={1} onChange={(v) => updateWheel("inset", v)} />
        <ToggleField label="循环（按已确认方案关闭）" checked={settings.optionWheel.loop} disabled onChange={() => undefined} />
        <ToggleField label="拖拽（按已确认方案开启）" checked={settings.optionWheel.draggable} disabled onChange={() => undefined} />
      </Section>
    </div>

    <aside className="sticky top-8 h-fit overflow-hidden rounded-3xl border border-white/10 bg-[#120f17]">
      <div className="h-[520px]"><DynamicBackground settings={settings}><div className="flex h-[520px] flex-col justify-between p-8"><p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Live preview</p><div><h3 className="text-4xl font-medium">你好，很高兴认识你。</h3><p className="mt-3 max-w-xs leading-7 text-slate-300">用动态背景承载清晰、可信的个人经历。</p></div></div></DynamicBackground></div>
      <div className="border-t border-white/10 p-5">
        <p className="text-xs text-slate-400">当前来源：{sourceStatus}</p>
        {message ? <p role="status" className="mt-3 text-sm text-cyan-200">{message}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3"><button disabled={pending} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-medium text-cyan-950 disabled:opacity-50" onClick={() => run(() => saveAppearanceDraftAction(settings), "草稿已保存。")}>保存草稿</button><button disabled={pending} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white disabled:opacity-50" onClick={() => run(async () => { await saveAppearanceDraftAction(settings); await publishAppearanceDraftAction(); }, "外观已发布。")}>保存并发布</button></div>
        <div className="mt-3 grid grid-cols-2 gap-3"><button disabled={pending} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300" onClick={() => setSettings(DEFAULT_APPEARANCE)}>恢复默认</button><button disabled={pending} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-slate-300 disabled:opacity-50" onClick={openPreview}>全屏预览 ↗</button></div>
      </div>
    </aside>
  </div>;
}
