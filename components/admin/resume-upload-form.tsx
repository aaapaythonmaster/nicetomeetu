"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResumeUploadForm({ profile }: { profile: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("正在上传并解析 DOCX…");
    try {
      const response = await fetch(`/api/resumes/${profile}/upload`, { method: "POST", body: formData });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json() as { error?: string }
        : { error: "服务暂时无法处理上传，请稍后重试。" };
      if (!response.ok) throw new Error(result.error ?? "上传失败，请重试。");
      setMessage("解析完成，正在打开草稿…");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败，请重试。");
    } finally {
      setPending(false);
    }
  }

  return <form className="mx-auto mt-6 max-w-xl" action={submit}>
    <div className="flex gap-3">
      <input aria-label="选择 DOCX 简历" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white" type="file" name="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
      <button disabled={pending} className="rounded-xl bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 disabled:cursor-wait disabled:opacity-60">{pending ? "处理中…" : "上传并解析"}</button>
    </div>
    <p className="mt-3 min-h-5 text-sm text-slate-400" aria-live="polite">{message}</p>
  </form>;
}
