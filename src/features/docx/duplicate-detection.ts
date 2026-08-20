import type {
  ParseIssue,
  ResumeEntryDraft,
} from "@/src/features/resume/contracts";

const SIMILARITY_THRESHOLD = 0.92;

function normalizeForComparison(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\p{P}\p{S}\s]/gu, "");
}

function levenshtein(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(
        (current[column - 1] ?? 0) + 1,
        (previous[column] ?? 0) + 1,
        (previous[column - 1] ?? 0) + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] ?? 0;
}

function similarity(left: string, right: string): number {
  const a = normalizeForComparison(left);
  const b = normalizeForComparison(right);
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function entrySimilarity(left: ResumeEntryDraft, right: ResumeEntryDraft): number {
  const aggregate = similarity(
    [left.title, ...left.bullets].join(" "),
    [right.title, ...right.bullets].join(" "),
  );
  const bulletSimilarities = left.bullets.flatMap((leftBullet) =>
    right.bullets.map((rightBullet) => similarity(leftBullet, rightBullet)),
  );
  return Math.max(aggregate, ...bulletSimilarities, 0);
}

export function findDuplicates(entries: ResumeEntryDraft[]): ParseIssue[] {
  const issues: ParseIssue[] = [];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      if (entrySimilarity(entries[left], entries[right]) < SIMILARITY_THRESHOLD) {
        continue;
      }
      issues.push({
        code: "duplicate-entry",
        severity: "warning",
        message: `第 ${left + 1} 与第 ${right + 1} 条经历高度相似，请确认是否重复。`,
        entryIndexes: [left, right],
      });
    }
  }
  return issues;
}
