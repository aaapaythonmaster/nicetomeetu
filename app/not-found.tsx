import Link from "next/link";

export default function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-[#120f17] px-8 text-white"><section className="max-w-xl text-center"><p className="text-sm uppercase tracking-[0.28em] text-cyan-300">404 · Nicetomeetu</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">这里没有对应的经历</h1><p className="mt-5 leading-7 text-white/60">链接可能已失效，或这部分内容尚未公开。</p><Link href="/" className="mt-8 inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold transition hover:border-cyan-300/50">返回个人主页</Link></section></main>;
}
