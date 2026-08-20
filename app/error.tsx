"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[#120f17] px-8 text-white"><section className="max-w-xl text-center"><p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Nicetomeetu</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">页面暂时没有加载成功</h1><p className="mt-5 leading-7 text-white/60">你的草稿不会因此丢失。可以立即重试；如果问题持续，请返回上一页后再次操作。</p><button type="button" onClick={reset} className="mt-8 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950">重新加载</button></section></main>;
}
