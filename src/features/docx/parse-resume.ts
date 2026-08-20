import { findDuplicates } from "@/src/features/docx/duplicate-detection";
import {
  findMissingSections,
  REQUIRED_SECTION_KINDS,
} from "@/src/features/docx/validation";
import { SECTION_LABELS } from "@/src/features/resume/fixtures";
import {
  parsedResumeSchema,
  type DocumentBlock,
  type ParsedResume,
  type ProfileSlug,
  type ResumeEntryDraft,
  type SectionKind,
} from "@/src/features/resume/contracts";

const headingAliases: Array<[SectionKind, RegExp]> = [
  ["education", /^\s*教育背景\s*$/],
  ["internships", /^\s*实习经历\s*$/],
  ["projects", /^\s*(?:AI\s*)?项目实践\s*\/\s*作品集\s*$/i],
  ["skills", /^\s*技能\s*$/],
  ["self-evaluation", /^[•●·\s]*自我评价\s*[:：]/],
  ["campus", /^\s*校园经历\s*$/],
];

const internshipHeader = /^[•●·\s]*(\d{4}\.\d{2})\s*-\s*(\d{4}\.\d{2}|至今)\s*\|\s*(.+)$/;
const datedHeader = /^[•●·\s]*(\d{4}\.\d{2})\s*-\s*(\d{4}\.\d{2}|至今)\b(.*)$/;

function stripMarker(value: string): string {
  return value
    .replace(/^[•●·\uf06c\s]+/, "")
    .replace(/^\d+[.\u3001]\s*/, "")
    .trim();
}

function headingFor(text: string): SectionKind | undefined {
  return headingAliases.find(([, pattern]) => pattern.test(text))?.[0];
}

function extractMetrics(values: string[]): string[] {
  const matches = values
    .join(" ")
    .match(/\d+(?:\.\d+)?(?:%|\+|份|家|封|场|版|条|人|分钟|天|周|个月|年|门店)/g);
  return [...new Set(matches ?? [])].slice(0, 3);
}

function firstSentence(entries: ResumeEntryDraft[]): string {
  const candidate = entries.flatMap((entry) => entry.bullets).find(Boolean) ?? "";
  const match = candidate.match(/^.*?[.!?。！？](?:\s|$)/);
  return (match?.[0] ?? candidate).trim();
}

function sectionSummary(entries: ResumeEntryDraft[]): string {
  if (entries.length === 0) return "";
  const metrics = [...new Set(entries.flatMap((entry) => entry.metrics))].slice(0, 3);
  return [`共 ${entries.length} 项经历。`, firstSentence(entries), metrics.join("、")]
    .filter(Boolean)
    .join(" ");
}

function wheelLabelForInternship(role: string): string {
  const compact = role.replace(/\s/g, "");
  if (compact.includes("AI产品经理")) return "AI 产品经理";
  if (compact.includes("AI应用")) return "AI 应用";
  if (compact.includes("AI业务提效")) return "AI 业务提效";
  if (compact.includes("数据运营")) return "数据运营";
  if (compact.includes("数据资产")) return "数据资产";
  return role.replace(/实习生\s*$/, "").trim();
}

function splitPipeFields(value: string): string[] {
  return value.split("|").map((part) => part.trim()).filter(Boolean);
}

function makeEntry(
  section: SectionKind,
  title: string,
  bullets: string[],
  position: number,
  extra: Partial<ResumeEntryDraft> = {},
): ResumeEntryDraft {
  const cleanBullets = bullets.map(stripMarker).filter(Boolean);
  return {
    section,
    title: stripMarker(title),
    wheelLabel: stripMarker(title),
    bullets: cleanBullets,
    metrics: extractMetrics(cleanBullets),
    position,
    visible: true,
    ...extra,
  };
}

function parseInternships(lines: string[]): ResumeEntryDraft[] {
  const entries: ResumeEntryDraft[] = [];
  let current: { header: RegExpMatchArray; bullets: string[] } | undefined;
  const flush = () => {
    if (!current) return;
    const fields = splitPipeFields(current.header[3]);
    const role = fields.at(-1) ?? "实习经历";
    entries.push(
      makeEntry("internships", role, current.bullets, entries.length, {
        wheelLabel: wheelLabelForInternship(role),
        organization: fields.slice(0, -1).join(" | ") || undefined,
        role,
        startDate: current.header[1],
        endDate: current.header[2],
      }),
    );
  };

  for (const line of lines) {
    const match = line.match(internshipHeader);
    if (match) {
      flush();
      current = { header: match, bullets: [] };
    } else if (current) {
      current.bullets.push(line);
    }
  }
  flush();
  return entries;
}

function parseProjects(lines: string[]): ResumeEntryDraft[] {
  const entries: ResumeEntryDraft[] = [];
  let title: string | undefined;
  let bullets: string[] = [];
  const flush = () => {
    if (!title) return;
    entries.push(makeEntry("projects", title, bullets, entries.length));
  };
  for (const line of lines) {
    const clean = stripMarker(line);
    const match = clean.match(/^项目[一二三四五六七八九十\d]+\s*[:：]\s*(.+)$/);
    if (match) {
      flush();
      title = match[1].trim();
      bullets = [];
    } else if (title && clean) {
      bullets.push(clean);
    }
  }
  flush();
  return entries;
}

function parseDatedEntries(section: SectionKind, lines: string[]): ResumeEntryDraft[] {
  const entries: ResumeEntryDraft[] = [];
  let header: RegExpMatchArray | undefined;
  let bullets: string[] = [];
  const flush = () => {
    if (!header) return;
    const title = stripMarker(header[3]) || `${header[1]}-${header[2]}`;
    entries.push(
      makeEntry(section, title, bullets, entries.length, {
        startDate: header[1],
        endDate: header[2],
      }),
    );
  };
  for (const line of lines) {
    const match = line.match(datedHeader);
    if (match) {
      flush();
      header = match;
      bullets = [];
    } else if (header) {
      bullets.push(line);
    }
  }
  flush();
  return entries;
}

function parseCampusEntries(lines: string[]): ResumeEntryDraft[] {
  const entries: ResumeEntryDraft[] = [];
  let current:
    | { title: string; startDate: string; endDate: string; bullets: string[] }
    | undefined;
  const flush = () => {
    if (!current) return;
    entries.push(
      makeEntry("campus", current.title, current.bullets, entries.length, {
        startDate: current.startDate,
        endDate: current.endDate,
      }),
    );
  };

  for (const line of lines) {
    const clean = stripMarker(line);
    const match = clean.match(/^(.*?)(\d{4})-(\d{4})(?:&\d{4}-\d{4})?$/);
    if (match && match[1].trim()) {
      flush();
      current = {
        title: match[1].trim(),
        startDate: match[2],
        endDate: match[3],
        bullets: [],
      };
    } else if (current && clean) {
      current.bullets.push(clean);
    }
  }
  flush();
  return entries;
}

function parseSingleLineEntries(section: SectionKind, lines: string[]): ResumeEntryDraft[] {
  return lines
    .map(stripMarker)
    .filter(Boolean)
    .map((line, position) => makeEntry(section, line, [], position));
}

function parseSection(section: SectionKind, lines: string[]): ResumeEntryDraft[] {
  if (section === "internships") return parseInternships(lines);
  if (section === "projects") return parseProjects(lines);
  if (section === "campus") return parseCampusEntries(lines);
  if (section === "education") {
    const dated = parseDatedEntries(section, lines);
    return dated.length > 0 ? dated : parseSingleLineEntries(section, lines);
  }
  return parseSingleLineEntries(section, lines);
}

function identityFrom(lines: string[], profile: ProfileSlug): ParsedResume["identity"] {
  const email = lines.join(" ").match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0];
  const phone = lines
    .join(" ")
    .match(/(?:\(\+\d{1,3}\)|\+?\d{1,3})[\d\s-]{7,}\d/)?.[0]
    ?.trim();
  const name = stripMarker(lines[0] ?? "");
  if (!name) throw new Error("简历缺少候选人姓名。");
  if (!email) throw new Error("简历缺少有效邮箱地址。");
  return {
    name,
    email,
    phone,
    school: lines.find((line) => line.includes("大学"))?.split(" ")[0],
    targetRole: profile === "product-manager" ? "AI 产品经理" : "产品运营",
  };
}

export function parseResume(
  blocks: DocumentBlock[],
  profile: ProfileSlug,
): ParsedResume {
  const preamble: string[] = [];
  const found = new Set<SectionKind>();
  const sectionLines = new Map<SectionKind, string[]>();
  let current: SectionKind | undefined;

  for (const block of blocks) {
    const text = block.text.trim();
    const heading = headingFor(text);
    if (heading) {
      current = heading;
      found.add(heading);
      sectionLines.set(heading, sectionLines.get(heading) ?? []);
      if (heading === "self-evaluation") {
        const content = stripMarker(text).replace(/^自我评价\s*[:：]\s*/, "");
        if (content) sectionLines.get(heading)?.push(content);
      }
      continue;
    }
    if (!current) preamble.push(text);
    else sectionLines.get(current)?.push(text);
  }

  const sections = REQUIRED_SECTION_KINDS.map((kind, position) => {
    const entries = parseSection(kind, sectionLines.get(kind) ?? []);
    return {
      kind,
      summary: sectionSummary(entries),
      position,
      entries,
    };
  });
  const entries = sections.flatMap((section) => section.entries);
  const issues = [...findMissingSections(found), ...findDuplicates(entries)];

  return parsedResumeSchema.parse({
    schemaVersion: 1,
    identity: identityFrom(preamble, profile),
    sections,
    issues,
  });
}

export { SECTION_LABELS };
