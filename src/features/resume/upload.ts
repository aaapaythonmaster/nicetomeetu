import { extractDocument } from "@/src/features/docx/extract-document";
import { parseResume } from "@/src/features/docx/parse-resume";
import {
  profileSlugSchema,
  type ParsedResume,
  type ProfileSlug,
} from "@/src/features/resume/contracts";

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const MAX_RESUME_BYTES = 8 * 1024 * 1024;

export interface DraftReplacement {
  buffer: Buffer;
  file: File;
  parsed: ParsedResume;
  profile: ProfileSlug;
  userId: string;
}

export interface UploadDependencies {
  replaceDraft(input: DraftReplacement): Promise<{ revisionId: number }>;
  recordFailure?(input: {
    errorMessage: string;
    file: File;
    profile: ProfileSlug;
    userId: string;
  }): Promise<void>;
}

export async function validateResumeUpload(file: File): Promise<void> {
  if (!file.name.toLocaleLowerCase("en-US").endsWith(".docx")) {
    throw new Error("请上传 .docx 格式的 DOCX 简历。");
  }
  if (file.type !== DOCX_MIME) {
    throw new Error("简历的 MIME 类型不是标准 DOCX。");
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("简历文件不能超过 8 MiB。");
  }
  if (file.size === 0) {
    throw new Error("简历文件不能为空。");
  }

  await extractDocument(Buffer.from(await file.arrayBuffer()));
}

export async function processResumeUpload(
  input: { file: File; profile: ProfileSlug; userId: string },
  dependencies: UploadDependencies,
): Promise<{ revisionId: number }> {
  const profile = profileSlugSchema.parse(input.profile);
  try {
    await validateResumeUpload(input.file);
    const buffer = Buffer.from(await input.file.arrayBuffer());
    const blocks = await extractDocument(buffer);
    const parsed = parseResume(blocks, profile);

    return await dependencies.replaceDraft({
      buffer,
      file: input.file,
      parsed,
      profile,
      userId: input.userId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "解析失败。";
    try {
      await dependencies.recordFailure?.({
        errorMessage,
        file: input.file,
        profile,
        userId: input.userId,
      });
    } catch (recordError) {
      console.error("无法记录简历上传失败信息。", recordError);
    }
    throw error;
  }
}

export async function createDraftFromUpload(
  profile: ProfileSlug,
  file: File,
  userId: string,
): Promise<{ revisionId: number }> {
  const { recordUploadFailure, replaceDraft } = await import(
    "@/src/features/resume/repository"
  );
  return processResumeUpload(
    { profile, file, userId },
    { replaceDraft, recordFailure: recordUploadFailure },
  );
}
