import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";

import type { DocumentBlock } from "@/src/features/resume/contracts";

type OrderedNode = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  preserveOrder: true,
  processEntities: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
});

const punctuation: Record<string, string> = {
  "\u3000": " ",
  "，": ",",
  "：": ":",
  "；": ";",
  "（": "(",
  "）": ")",
  "＋": "+",
  "｜": "|",
};

export function normalizeDocumentText(value: string): string {
  return value
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/[\u3000，：；（）＋｜]/g, (character) =>
      punctuation[character] ?? character,
    )
    .replace(/[\t\r\n\u00a0]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function orderedChildren(value: unknown): OrderedNode[] {
  return Array.isArray(value) ? (value as OrderedNode[]) : [];
}

function collectText(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  let text = "";
  for (const node of value as OrderedNode[]) {
    for (const [key, child] of Object.entries(node)) {
      if (key === "#text") {
        text += String(child);
      } else if (key === "w:tab" || key === "w:br" || key === "w:cr") {
        text += " ";
      } else if (key !== ":@") {
        text += collectText(child);
      }
    }
  }
  return normalizeDocumentText(text);
}

function tableRowCells(row: unknown): string[] {
  const cells: string[] = [];
  for (const node of orderedChildren(row)) {
    const cell = node["w:tc"];
    if (cell === undefined) {
      continue;
    }
    const paragraphs: string[] = [];
    for (const cellNode of orderedChildren(cell)) {
      if (cellNode["w:p"] !== undefined) {
        const text = collectText(cellNode["w:p"]);
        if (text) paragraphs.push(text);
      }
    }
    cells.push(normalizeDocumentText(paragraphs.join(" ")));
  }
  return cells;
}

function documentBody(document: OrderedNode[]): OrderedNode[] | undefined {
  for (const node of document) {
    if (node["w:document"] === undefined) continue;
    for (const documentNode of orderedChildren(node["w:document"])) {
      if (documentNode["w:body"] !== undefined) {
        return orderedChildren(documentNode["w:body"]);
      }
    }
  }
  return undefined;
}

export async function extractDocument(buffer: Buffer): Promise<DocumentBlock[]> {
  let archive: JSZip;
  try {
    archive = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error("无法读取 DOCX: 文件不是有效的 ZIP/OOXML 归档。");
  }

  const documentFile = archive.file("word/document.xml");
  if (!documentFile) {
    throw new Error("无法读取 DOCX: 缺少 word/document.xml。");
  }

  const orderedDocument = parser.parse(
    await documentFile.async("string"),
  ) as OrderedNode[];
  const body = documentBody(orderedDocument);
  if (!body) {
    throw new Error("无法读取 DOCX: document.xml 缺少文档正文。");
  }

  const blocks: DocumentBlock[] = [];
  const append = (block: Omit<DocumentBlock, "index">) => {
    if (!block.text) return;
    blocks.push({ ...block, index: blocks.length });
  };

  for (const node of body) {
    if (node["w:p"] !== undefined) {
      append({ kind: "paragraph", text: collectText(node["w:p"]) });
      continue;
    }
    if (node["w:tbl"] === undefined) continue;

    for (const tableNode of orderedChildren(node["w:tbl"])) {
      if (tableNode["w:tr"] === undefined) continue;
      const cells = tableRowCells(tableNode["w:tr"]);
      append({
        kind: "table-row",
        text: normalizeDocumentText(cells.filter(Boolean).join(" | ")),
        cells,
      });
    }
  }

  return blocks;
}
