"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { publishResumeAction, saveDraft } from "@/src/features/resume/actions";
import { SECTION_LABELS } from "@/src/features/resume/fixtures";
import type { ResumeEditorData } from "@/src/features/resume/queries";

type Section = ResumeEditorData["sections"][number];
type Entry = Section["entries"][number];

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SortableEntry({
  entry,
  onChange,
}: {
  entry: Entry;
  onChange(next: Entry): void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border border-white/10 bg-[#18151d] p-5 ${
        isDragging ? "relative z-10 border-cyan-300/50 shadow-2xl" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="cursor-grab rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 active:cursor-grabbing"
          aria-label={`拖拽排序 ${entry.title}`}
          {...attributes}
          {...listeners}
        >
          拖拽排序
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={entry.visible}
            onChange={(event) => onChange({ ...entry, visible: event.target.checked })}
          />
          对外展示
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field
          label="条目标题"
          value={entry.title}
          onChange={(title) => onChange({ ...entry, title })}
        />
        <Field
          label="Option Wheel 短标签"
          value={entry.wheelLabel}
          onChange={(wheelLabel) => onChange({ ...entry, wheelLabel })}
        />
        <Field
          label="组织 / 公司"
          value={entry.organization ?? ""}
          onChange={(organization) => onChange({ ...entry, organization })}
        />
        <Field
          label="岗位 / 角色"
          value={entry.role ?? ""}
          onChange={(role) => onChange({ ...entry, role })}
        />
      </div>
      <label className="mt-4 block text-xs font-medium text-slate-400">
        详情内容（每行一条）
        <textarea
          className="mt-2 min-h-40 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/60"
          value={entry.bullets.join("\n")}
          onChange={(event) =>
            onChange({
              ...entry,
              bullets: event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
    </article>
  );
}

function SectionEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange(next: Section): void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = section.entries.findIndex((entry) => entry.id === active.id);
    const newIndex = section.entries.findIndex((entry) => entry.id === over.id);
    const entries = arrayMove(section.entries, oldIndex, newIndex).map(
      (entry, position) => ({ ...entry, position }),
    );
    onChange({ ...section, entries });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-medium">
          {SECTION_LABELS[section.kind as keyof typeof SECTION_LABELS] ?? section.kind}
        </h2>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={section.visible}
            onChange={(event) =>
              onChange({ ...section, visible: event.target.checked })
            }
          />
          对外展示该板块
        </label>
      </div>
      <label className="mt-5 block text-xs font-medium text-slate-400">
        首页简介
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/60"
          value={section.summary}
          onChange={(event) => onChange({ ...section, summary: event.target.value })}
        />
      </label>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={section.entries.map((entry) => entry.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-5 space-y-4">
            {section.entries.map((entry) => (
              <SortableEntry
                key={entry.id}
                entry={entry}
                onChange={(next) =>
                  onChange({
                    ...section,
                    entries: section.entries.map((item) =>
                      item.id === next.id ? next : item,
                    ),
                  })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export function ResumeEditor({ initialData }: { initialData: ResumeEditorData | null }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  const upload = () => {
    if (!file) return setMessage("请先选择 DOCX 文件。");
    setMessage(undefined);
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(`/api/resumes/${initialData?.profile ?? ""}/upload`, {
        method: "POST",
        body,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) return setMessage(result.error ?? "上传失败。");
      setMessage("解析完成，正在刷新草稿…");
      router.refresh();
    });
  };

  if (!data) return null;

  const save = () => {
    setMessage(undefined);
    startTransition(async () => {
      try {
        await saveDraft({
          revisionId: data.revisionId,
          profile: data.profile,
          identity: data.identity,
          phoneVisible: data.phoneVisible,
          sections: data.sections,
          issues: data.issues.map(({ id, acknowledged }) => ({ id, acknowledged })),
        });
        setMessage("草稿已保存。");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "保存失败。");
      }
    });
  };

  const publish = () => {
    setMessage(undefined);
    startTransition(async () => {
      try {
        await saveDraft({
          revisionId: data.revisionId, profile: data.profile, identity: data.identity,
          phoneVisible: data.phoneVisible, sections: data.sections,
          issues: data.issues.map(({ id, acknowledged }) => ({ id, acknowledged })),
        });
        setMessage("正在生成 PDF 并发布…");
        await publishResumeAction({ profile: data.profile, revisionId: data.revisionId });
        setMessage("发布完成，公开主页已更新。");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "发布失败。");
      }
    });
  };

  const preview = () => {
    setMessage(undefined);
    startTransition(async () => {
      try {
        await saveDraft({
          revisionId: data.revisionId, profile: data.profile, identity: data.identity,
          phoneVisible: data.phoneVisible, sections: data.sections,
          issues: data.issues.map(({ id, acknowledged }) => ({ id, acknowledged })),
        });
        router.push(`/admin/preview/${data.profile}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "预览准备失败。");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xl font-medium">替换简历文件</h2>
        <p className="mt-2 text-sm text-slate-400">
          上传新 DOCX 后会创建新草稿，旧草稿将归档，已发布版本不受影响。
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            aria-label="选择 DOCX 简历"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0])}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300"
          />
          <button
            type="button"
            onClick={upload}
            disabled={pending}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            上传并解析
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xl font-medium">基本信息</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field
            label="姓名"
            value={data.identity.name}
            onChange={(name) => setData({ ...data, identity: { ...data.identity, name } })}
          />
          <Field
            label="目标岗位"
            value={data.identity.targetRole}
            onChange={(targetRole) =>
              setData({ ...data, identity: { ...data.identity, targetRole } })
            }
          />
          <Field
            label="邮箱"
            value={data.identity.email}
            onChange={(email) => setData({ ...data, identity: { ...data.identity, email } })}
          />
          <Field
            label="手机号"
            value={data.identity.phone ?? ""}
            onChange={(phone) => setData({ ...data, identity: { ...data.identity, phone } })}
          />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={data.phoneVisible}
            onChange={(event) => setData({ ...data, phoneVisible: event.target.checked })}
          />
          在公开页展示手机号
        </label>
      </section>

      {data.issues.length ? (
        <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
          <h2 className="text-xl font-medium">解析检查</h2>
          <div className="mt-4 space-y-3">
            {data.issues.map((issue) => (
              <label key={issue.id} className="flex gap-3 rounded-xl bg-black/15 p-4">
                <input
                  type="checkbox"
                  checked={issue.acknowledged}
                  onChange={(event) =>
                    setData({
                      ...data,
                      issues: data.issues.map((item) =>
                        item.id === issue.id
                          ? { ...item, acknowledged: event.target.checked }
                          : item,
                      ),
                    })
                  }
                />
                <span className="text-sm leading-6 text-amber-50/80">
                  <strong className="mr-2 text-amber-200">{issue.severity}</strong>
                  {issue.message}
                </span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {data.sections.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          onChange={(next) =>
            setData({
              ...data,
              sections: data.sections.map((item) =>
                item.id === next.id ? next : item,
              ),
            })
          }
        />
      ))}

      <div className="sticky bottom-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#211d27]/95 px-5 py-4 shadow-2xl backdrop-blur">
        <p aria-live="polite" className="text-sm text-slate-300">
          {message ?? `解析状态：${data.parseStatus}`}
        </p>
        <div className="flex gap-3"><button type="button" onClick={save} disabled={pending} className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">保存草稿</button><button type="button" onClick={preview} disabled={pending} className="rounded-xl border border-cyan-300/30 px-6 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-50">保存并预览</button><button type="button" onClick={publish} disabled={pending} className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-cyan-950 disabled:opacity-50">{pending ? "处理中…" : "生成 PDF 并发布"}</button></div>
      </div>
    </div>
  );
}
