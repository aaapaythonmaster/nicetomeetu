import { appearanceSettingsSchema, type AppearanceSettings, DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";
import { parsedResumeSchema, profileSlugSchema, sectionKindSchema, type PublishedSiteData } from "./contracts";
import type { ResumeEditorData } from "./queries";

interface PublicRows {
  profile: { slug: string };
  revision: { id: number; identity: unknown; phoneVisible: boolean };
  sections: Array<{ id: number; kind: string; summary: string; position: number; visible: boolean }>;
  entries: Array<{
    id: number; sectionId: number; title: string; wheelLabel: string; organization?: string | null;
    role?: string | null; startDate?: string | null; endDate?: string | null; content: unknown;
    position: number; visible: boolean;
  }>;
  appearance: AppearanceSettings | unknown;
  pdfAvailable: boolean;
}

function contentArrays(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return { bullets: [], metrics: [] };
  const record = content as Record<string, unknown>;
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  return { bullets: strings(record.bullets), metrics: strings(record.metrics) };
}

export function mapPublishedSiteRows(rows: PublicRows): PublishedSiteData {
  const profile = profileSlugSchema.parse(rows.profile.slug);
  const identity = parsedResumeSchema.shape.identity.parse(rows.revision.identity);
  const publicIdentity = rows.revision.phoneVisible
    ? { ...identity, showPhone: true }
    : { name: identity.name, email: identity.email, school: identity.school, targetRole: identity.targetRole, showPhone: false };

  const visibleSections = rows.sections.filter((section) => section.visible).toSorted((a, b) => a.position - b.position);
  const sections = visibleSections.map((section) => ({
    kind: sectionKindSchema.parse(section.kind),
    summary: section.summary,
    position: section.position,
    entries: rows.entries
      .filter((entry) => entry.sectionId === section.id && entry.visible)
      .toSorted((a, b) => a.position - b.position)
      .map((entry) => {
        const content = contentArrays(entry.content);
        return {
          id: entry.id,
          section: sectionKindSchema.parse(section.kind),
          title: entry.title,
          wheelLabel: entry.wheelLabel,
          organization: entry.organization ?? undefined,
          role: entry.role ?? undefined,
          startDate: entry.startDate ?? undefined,
          endDate: entry.endDate ?? undefined,
          bullets: content.bullets,
          metrics: content.metrics,
          position: entry.position,
          visible: true,
        };
      }),
  }));

  return {
    profile,
    identity: publicIdentity,
    sections,
    appearance: appearanceSettingsSchema.parse(rows.appearance),
    pdfAvailable: rows.pdfAvailable,
  };
}

export function mapDraftPreview(
  draft: ResumeEditorData,
  appearance: AppearanceSettings,
): PublishedSiteData {
  return mapPublishedSiteRows({
    profile: { slug: draft.profile },
    revision: {
      id: draft.revisionId,
      identity: draft.identity,
      phoneVisible: draft.phoneVisible,
    },
    sections: draft.sections,
    entries: draft.sections.flatMap((section) =>
      section.entries.map((entry) => ({
        id: entry.id,
        sectionId: section.id,
        title: entry.title,
        wheelLabel: entry.wheelLabel,
        organization: entry.organization,
        role: entry.role,
        startDate: entry.startDate,
        endDate: entry.endDate,
        content: { bullets: entry.bullets, metrics: entry.metrics },
        position: entry.position,
        visible: entry.visible,
      }))),
    appearance,
    pdfAvailable: false,
  });
}

export function createPublicFixture(): PublishedSiteData {
  const sections = [
    { id: 1, kind: "internships", summary: "在 AI 产品、业务运营与流程自动化场景中，把真实问题拆成可落地的产品与运营动作。", position: 0, visible: true },
    { id: 2, kind: "projects", summary: "从用户研究、模型分析到方案表达，记录代表性的研究与产品项目。", position: 1, visible: true },
    { id: 3, kind: "campus", summary: "数字经济与经济统计复合背景，持续积累研究、组织协作与活动统筹经验。", position: 2, visible: true },
    { id: 4, kind: "skills", summary: "英语、AI 应用工具、数据分析与办公表达，覆盖从分析到交付的完整工作链路。", position: 3, visible: true },
  ];
  const entries = [
    {
      id: 1, sectionId: 1, title: "鲸锐 AI 影视智作产品实习", wheelLabel: "鲸锐 AI",
      organization: "阿里巴巴虎鲸文娱集团 · 优酷", role: "AI 影视智作产品实习生",
      content: {
        bullets: [
          "负责「鲸锐 AI」影视后期套件工具、灵机 API 授权页面的需求梳理、PRD 撰写、交互设计与 HTML 原型搭建。",
          "完成优酷鲸锐超分模型推广页面搭建，调研 AIGC 影视后期竞品的能力布局、交付形式与差异化方向。",
          "搭建内部视频模型测试平台，接入 14 种自研与竞品模型，实现上传视频后的统一测试与效果对比。",
          "对接 20+ 位行业客户，基于真实业务视频开展模型测试和效果验证，支持模型服务对外验证与交付优化。",
        ],
        metrics: ["交付周期缩短 90%", "5 轮模型测试", "累计生成 280+ 条视频", "20+ 位客户"],
      }, position: 0, visible: true,
    },
    {
      id: 2, sectionId: 1, title: "用户画像 AI 工作流", wheelLabel: "洋葱学园",
      organization: "光合新知（北京）信息技术有限公司 · 洋葱学园", role: "市场策略 — AI 产品经理实习生",
      startDate: "2026.05", endDate: "2026.08",
      content: {
        bullets: [
          "完成 10 场销售访谈，覆盖团长、组长、一线销售等 4 类角色，梳理 7 个关键业务流程节点。",
          "基于 1132 份单成交案例复盘，沉淀用户画像 10 个维度、100+ 个字段，以及数据口径、Skill 文档和验收规范。",
          "打通数仓取数、用户快照聚合、LLM 分析、结构化输出与画像卡接入流程，沉淀 20+ 条 SQL。",
          "独立完成用户画像工作台的前后端实现、UI 设计与功能调试，完成 7 版 Demo 迭代和 7 轮核心流程验收。",
        ],
        metrics: ["10 场访谈", "1132 份案例", "7 版 Demo", "1w+ 条真实数据"],
      }, position: 1, visible: true,
    },
    {
      id: 3, sectionId: 1, title: "销售业务自动化与预测", wheelLabel: "纷享销客",
      organization: "北京纷扬科技有限公司 · 纷享销客 CRM", role: "业务运营 — AI 应用实习生",
      startDate: "2026.04", endDate: "2026.05",
      content: {
        bullets: [
          "使用 Python + Pillow 实现会议合照拼接、文字排版与标识生成，封装为支持批量上传、下载和在线预览的工具。",
          "封装业绩回款预测 Skill，通过 MCP 调用数据并完成 4 项指标校验，自动对比 4 个季度及 7 个战区的预测与实际回款。",
          "梳理定价、折扣、返点及回款率等销售规则，构建最低可售价格与折扣测算逻辑，协助迭代 3 版商机管理规范。",
        ],
        metrics: ["单次耗时缩减至 5 分钟", "4 项指标校验", "7 个战区", "3 版规范"],
      }, position: 2, visible: true,
    },
    {
      id: 4, sectionId: 1, title: "门店运营 AI 自动化", wheelLabel: "Grid Coffee",
      organization: "北京单一起源咖啡有限公司 · Grid Coffee", role: "营运支持实习生",
      startDate: "2025.12", endDate: "2026.04",
      content: {
        bullets: [
          "利用 Dify 搭建门店客服 AI Agent，完成 SOP 知识库（RAG）构建与多节点工作流编排，降低重复业务咨询。",
          "使用 Python 串联 Miner U 与 DeepSeek API，自动化解析 430+ 份保单及租赁合同条款。",
          "协调全国 150+ 家门店的问题反馈闭环，协同产品研发、经营分析、食品安全等 5 个部门处理客户反馈。",
          "主导编制《Grid Coffee 供应商服务验收标准手册》，统一全国门店外包服务质量验收标准。",
        ],
        metrics: ["重复咨询降低 46%", "解析 430+ 份合同", "150+ 家门店", "投诉率下降 31%"],
      }, position: 3, visible: true,
    },
    {
      id: 11, sectionId: 2, title: "大学生商业产品 IP 化消费倾向研究", wheelLabel: "商业产品研究",
      role: "主要负责人", startDate: "2022.12", endDate: "2023.03",
      content: {
        bullets: [
          "针对产品 IP 化带来的审美疲劳与发展瓶颈，搭建 SEM 等模型分析调查数据，为企业提供可行性建议。",
          "独立完成 SPSS、SPSS-Amos 模型搭建与数据分析，代表团队参与校赛选拔答辩并获得校赛一等奖。",
        ], metrics: ["校赛一等奖"],
      }, position: 0, visible: true,
    },
    {
      id: 21, sectionId: 3, title: "教育背景与校园经历", wheelLabel: "校园经历",
      startDate: "2021.09", endDate: "至今",
      content: {
        bullets: [
          "北京语言大学数字经济硕士，GPA 3.77/4.0，获校奖学金三等奖。",
          "中南民族大学经济统计学本科，GPA 3.99/5（专业排名 3/72），获国家奖学金、优秀毕业生与校优秀学生干部。",
          "担任班长、新生班助；曾任英语协会会长，负责社团运营与活动统筹；参与青年志愿者协会项目策划与执行。",
          "相关课程包括多元统计分析、数据库原理与应用、算法设计与分析、数据挖掘等。",
        ], metrics: ["GPA 3.77/4.0", "GPA 3.99/5", "专业排名 3/72", "国家奖学金"],
      }, position: 0, visible: true,
    },
    {
      id: 31, sectionId: 4, title: "AI 应用、数据分析与办公工具", wheelLabel: "能力栈",
      content: {
        bullets: [
          "英语：CET-6 563。",
          "AI 应用工具：Cursor、Codex、Coze、Dify、n8n。",
          "数据分析：SPSS、Excel、SQL、Python。",
          "办公表达：PPT、Word。",
        ], metrics: ["AI 应用", "SQL / Python", "CET-6 563"],
      }, position: 0, visible: true,
    },
  ];
  return mapPublishedSiteRows({
    profile: { slug: "product-manager" },
    revision: { id: 1, identity: { name: "张昕蕊", email: "candidate@example.com", phone: "13800000000", school: "北京语言大学 · 数字经济硕士", targetRole: "AI 产品与流程运营" }, phoneVisible: false },
    sections,
    entries,
    appearance: DEFAULT_APPEARANCE,
    pdfAvailable: false,
  });
}
