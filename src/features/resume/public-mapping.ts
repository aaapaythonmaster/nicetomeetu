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
      id: 1, sectionId: 1, title: "优酷-AI影视智作产品实习生", wheelLabel: "阿里巴巴",
      organization: "阿里巴巴集团（Alibaba） | 虎鲸文娱", role: "优酷-AI影视智作产品实习生",
      startDate: "2026.08", endDate: "至今",
      content: {
        bullets: [
          "产品设计与落地：负责「鲸锐AI」影视后期套件工具（已上线）、鲸锐API 授权页面的需求梳理、PRD 撰写、交互设计及 HTML 原型搭建、影视套件工具官方使用手册撰写与维护；",
          "AIGC市场调研：完成优酷鲸锐超分模型推广页面搭建；调研 AIGC 影视后期竞品产品，分析能力布局、交付形式和差异化方向，为产品定位与迭代提供输入；",
          "超分模型评测：构建20+测试集，覆盖人像肌理、人脸细节等10+类case作为算法迭代模型测试视频，作为对外客户展示；搭建内部视频模型测试平台，接入14种自研+竞品模型，实现上传视频后的统一测试与效果对比，提升模型横向评测效率，交付周期缩短83%，完成5轮模型测试，累计测试生成280+条视频；",
        ],
        metrics: ["交付周期缩短 83%", "5 轮模型测试", "累计生成 280+ 条视频", "20+ 测试集"],
      }, position: 0, visible: true,
    },
    {
      id: 2, sectionId: 1, title: "市场策略-AI产品经理实习生", wheelLabel: "洋葱学园",
      organization: "光合新知（北京）信息技术有限公司 | 洋葱学园", role: "市场策略-AI产品经理实习生",
      startDate: "2026.05", endDate: "2026.08",
      content: {
        bullets: [
          "洞察业务流程痛点：梳理销售日常业务流程，完成10场销售访谈，覆盖团长、组长、一线销售等4类角色，梳理7个关键业务流程节点，将原有人工分析流程优化为自动生成用户画像AI工作流，单次人工分析耗时缩减至3分钟；",
          "需求收集与流程文档迭代：基于1132份单成交案例复盘，沉淀画像10个维度100+个字段、数据口径说明、Skill 使用文档、产品开发计划及预览验收规范，明确字段来源、业务含义、取数方式和处理流程；",
          "用户数据分析：沉淀用户画像 Skill，打通“数仓取数→用户快照聚合→LLM 分析→结构化结果输出→画像卡接入”流程，编写并沉淀20+条用户订单、学习行为等 SQL；调试 Prompt 与结构化输出规则，从非结构化数据中提取出结构化数据；",
          "产品原型搭建/落地：独立负责前后端实现、UI设计和功能调试，完成用户画像工作台功能及交互设计，完成7版Demo迭代，基于1w+条真实用户数据完成7轮核心流程验收；",
        ],
        metrics: ["10 场访谈", "1132 份案例", "7 版 Demo", "1w+ 条真实数据"],
      }, position: 1, visible: true,
    },
    {
      id: 3, sectionId: 1, title: "业务运营—AI应用实习生", wheelLabel: "纷享销客",
      organization: "北京纷扬科技有限公司 | 纷享销客CRM", role: "业务运营—AI应用实习生",
      startDate: "2026.05", endDate: "2026.08",
      content: {
        bullets: [
          "自动化图片生成工具：针对全国15个分公司月度会议合照重复制作问题，使用 Python + Pillow 实现图片拼接、文字排版与标识生成，封装为支持批量上传与下载、在线预览的可视化工具，单次耗时缩减至5分钟；",
          "业绩回款预测看板搭建：封装业绩回款预测 Skill，通过 MCP 调用数据并由脚本完成4项指标校验，实现4个季度及7个战区月/季度预测与实际回款及偏差自动对比；",
          "销售规则产品化：梳理定价、折扣、返点及回款率等销售规则，构建最低可售价格与折扣测算逻辑，并协助迭代3版商机管理规范；",
        ],
        metrics: ["单次耗时缩减至 5 分钟", "4 项指标校验", "7 个战区", "3 版规范"],
      }, position: 2, visible: true,
    },
    {
      id: 4, sectionId: 1, title: "营运支持-营运支持实习生", wheelLabel: "Grid Coffee",
      organization: "北京单一起源咖啡有限公司 | Grid Coffee", role: "营运支持-营运支持实习生",
      startDate: "2025.12", endDate: "2026.04",
      content: {
        bullets: [
          "门店客服AI Agent产品搭建与迭代：利用 Dify 平台设计并搭建门店客服 AI Agent，完成SOP知识库（RAG）构建及多节点工作流（Workflow）编排，环比降低重复业务咨询46%；",
          "租赁合同自动化处理工作流：撰写 Python 脚本串联 Miner U 与 DeepSeek API，实现全流程自动化的结构化解析430+份保单及租赁合同条款，交付周期缩短75%；",
          "用户运营与产品反馈闭环：协调全国150+门店问题反馈的闭环处理，负责Grid Coffee小程序客服后台管理及处理邮件渠道客诉400+次；协调产品研发、经营分析、食品安全等5个部门，累计处理46条顾客产品与小程序体验反馈；建立“用户反馈—门店核实—内部流转—处理回访”机制，推动90%问题在24小时内闭环；",
          "数据分析支持运营决策：累计处理150+次门店报修及求助工单；按月分析核心咖啡制作设备使用率，归纳7类高频共性问题，期间开展4次食品陈列 test，密集陈列千次高出约10%，已被采用；主导编制《Grid Coffee 供应商服务验收标准手册》落地全国150+家门店，统一外包服务质量验收标准，推动门店投诉率环比下降31%；",
        ],
        metrics: ["重复咨询降低 46%", "解析 430+ 份合同", "处理 150+ 次工单", "投诉率环比下降 31%"],
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
