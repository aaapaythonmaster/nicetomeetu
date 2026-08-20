import Link from "next/link";
import { notFound } from "next/navigation";

import { ResumeEditor } from "@/components/admin/resume-editor";
import { ResumeUploadForm } from "@/components/admin/resume-upload-form";
import { profileSlugSchema } from "@/src/features/resume/contracts";
import { PROFILE_LABELS } from "@/src/features/resume/fixtures";
import { getDraftEditor } from "@/src/features/resume/queries";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const parsedProfile = profileSlugSchema.safeParse((await params).profile);
  if (!parsedProfile.success) notFound();
  const profile = parsedProfile.data;
  const draft = await getDraftEditor(profile);

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <Link href="/admin" className="text-sm text-slate-400 hover:text-white">
        ← 返回版本列表
      </Link>
      <div className="mt-6 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm text-cyan-300">简历草稿</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {PROFILE_LABELS[profile]}
          </h1>
        </div>
      </div>

      {!draft ? (
        <section className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <h2 className="text-2xl font-medium">先上传这一版简历</h2>
          <p className="mt-3 text-slate-400">
            系统会按固定结构自动生成可编辑草稿。
          </p>
          <ResumeUploadForm profile={profile} />
        </section>
      ) : (
        <div className="mt-10">
          <ResumeEditor key={draft.revisionId} initialData={draft} />
        </div>
      )}
    </main>
  );
}
