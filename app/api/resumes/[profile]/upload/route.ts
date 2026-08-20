import { requireAdmin } from "@/src/features/resume/auth";
import { profileSlugSchema } from "@/src/features/resume/contracts";
import { createDraftFromUpload } from "@/src/features/resume/upload";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profile: string }> },
) {
  try {
    const { userId } = await requireAdmin();
    const profile = profileSlugSchema.parse((await params).profile);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "请选择 DOCX 简历文件。" }, { status: 400 });
    }

    const result = await createDraftFromUpload(profile, file, userId);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (acceptsHtml) {
      return Response.redirect(
        new URL(`/admin/resumes/${profile}`, request.url),
        303,
      );
    }
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败。";
    const unauthorized = message.includes("未授权");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 400 });
  }
}
