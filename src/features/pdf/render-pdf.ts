import "server-only";

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { ResumeDocument } from "./resume-document";
import type { ResumeEditorData } from "@/src/features/resume/queries";

export async function renderResumePdf(data: ResumeEditorData): Promise<Buffer> {
  const document = createElement(ResumeDocument, { data }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(document);
}
