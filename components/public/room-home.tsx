"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { PublishedSiteData, SectionKind } from "@/src/features/resume/contracts";
import { FolderComponent } from "@/components/ui/folder-component";
import "./room-home.css";

type PortfolioKind = Extract<SectionKind, "internships" | "projects" | "campus" | "skills">;

const PAPER_ITEMS: Array<{ kind: PortfolioKind; image: string; left: string; top: string }> = [
  { kind: "internships", image: "/room/papers/internships.jpg", left: "13%", top: "58%" },
  { kind: "projects", image: "/room/papers/projects.jpg", left: "18%", top: "63%" },
  { kind: "campus", image: "/room/papers/campus.jpg", left: "24%", top: "57%" },
  { kind: "skills", image: "/room/papers/skills.jpg", left: "28%", top: "63%" },
];

const PAPER_STACKS: Record<PortfolioKind, string[]> = {
  internships: ["/room/papers/IMG_1512.jpg", "/room/papers/IMG_2567.jpg", "/room/papers/IMG_0015.jpg"],
  projects: ["/room/papers/new/IMG_4274.webp", "/room/papers/new/IMG_1260.webp", "/room/papers/new/IMG_5975.webp"],
  campus: ["/room/papers/new/IMG_4557.webp", "/room/papers/new/IMG_5841.webp", "/room/papers/new/IMG_4427.webp"],
  skills: ["/room/papers/new/IMG_5975.webp", "/room/papers/new/IMG_5955.webp", "/room/papers/new/IMG_4260.webp"],
};

const FOLDER_LABELS: Record<PortfolioKind, string> = {
  internships: "实习经历",
  projects: "项目经历",
  campus: "教育背景",
  skills: "技能",
};

const INTERNSHIP_LOGOS: Record<string, { src: string; alt: string; accent: string; className?: string }> = {
  阿里巴巴: { src: "/room/logos/alibaba.webp", alt: "阿里巴巴", accent: "#dc6428" },
  洋葱学园: { src: "/room/logos/onion.webp", alt: "洋葱学园", accent: "#2870cf" },
  纷享销客: { src: "/room/logos/fxiaoke.webp", alt: "纷享销客", accent: "#c89020" },
  "Grid Coffee": { src: "/room/logos/grid-coffee.webp", alt: "Grid Coffee", accent: "#68783a", className: "is-grid" },
};

const JINGRUI_AI_URL = "https://www.ahatime.com/page/home";

const EMPHASIS_TERMS = [
  "「鲸锐AI」",
  "影视后期套件工具（已上线）",
  "鲸锐API 授权页面",
  "影视套件工具官方使用手册撰写与维护",
  "优酷鲸锐超分模型推广页面搭建",
  "AIGC 影视后期竞品产品",
  "交付周期缩短83%",
  "完成5轮模型测试",
  "累计测试生成280+条视频",
  "20+测试集",
  "10+类case",
  "20+位",
  "10场",
  "4类角色",
  "7个关键业务流程节点",
  "1132份",
  "10个维度100+个字段",
  "20+条",
  "7版Demo迭代",
  "基于1w+条真实用户数据",
  "15个分公司",
  "单次耗时缩减至5分钟",
  "4项指标校验",
  "4个季度",
  "7个战区",
  "3版商机管理规范",
  "环比降低重复业务咨询46%",
  "430+份",
  "交付周期缩短75%",
  "150+门店",
  "400+次",
  "5个部门",
  "46条",
  "90%问题在24小时内闭环",
  "150+次",
  "7类高频共性问题",
  "4次食品陈列 test",
  "密集陈列千次高出约10%",
  "已被采用",
  "全国150+家门店",
  "门店投诉率环比下降31%",
] as const;

const EMPHASIS_PATTERN = new RegExp(
  `(${EMPHASIS_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

function renderInternshipBullet(bullet: string) {
  const separator = bullet.indexOf("：");
  const label = separator >= 0 ? bullet.slice(0, separator + 1) : "";
  const body = separator >= 0 ? bullet.slice(separator + 1) : bullet;
  return (
    <>
      {label ? <strong className="room-home__responsibility-label">{label}</strong> : null}
      <span className="room-home__responsibility-copy">
        {body.split(EMPHASIS_PATTERN).map((part, index) => {
          if (part === "「鲸锐AI」") {
            return (
              <a
                key={`${part}-${index}`}
                className="room-home__jingrui-link"
                href={JINGRUI_AI_URL}
                target="_blank"
                rel="noreferrer"
                title={JINGRUI_AI_URL}
                aria-label={`鲸锐AI官网：${JINGRUI_AI_URL}（新窗口打开）`}
              >
                {part}<span aria-hidden="true">↗</span>
              </a>
            );
          }
          return EMPHASIS_TERMS.includes(part as (typeof EMPHASIS_TERMS)[number])
            ? <strong key={`${part}-${index}`}>{part}</strong>
            : part;
        })}
      </span>
    </>
  );
}

function getInternshipMetricParts(metric: string) {
  const match = metric.match(/\d+(?:\.\d+)?(?:w|\+)?(?:%|\s*轮|\s*分钟|\s*项|\s*个战区|\s*家门店)?/i);
  if (!match || match.index === undefined) return { value: metric, label: "" };
  const start = match.index;
  const end = start + match[0].length;
  return { value: match[0], label: `${metric.slice(0, start)}${metric.slice(end)}`.trim() };
}

export function RoomHome({ data }: { data: PublishedSiteData }) {
  const studyVideoRef = useRef<HTMLVideoElement>(null);
  const greetingActiveRef = useRef(false);
  const paperCloseRef = useRef<HTMLButtonElement>(null);
  const paperTriggerRef = useRef<HTMLButtonElement>(null);
  const [characterState, setCharacterState] = useState<"study" | "greet">("study");
  const [greetingOpen, setGreetingOpen] = useState(false);
  const [papersOpen, setPapersOpen] = useState(false);
  const [paperIndex, setPaperIndex] = useState(0);
  const [folderStage, setFolderStage] = useState<"folders" | "detail">("folders");
  const [internshipIndex, setInternshipIndex] = useState(0);
  const [internshipDropping, setInternshipDropping] = useState(false);
  const greetingText = `你好，我是${data.identity.name}。\n从一张草稿纸开始，看看我做过的事。`;
  const [greetingChars, setGreetingChars] = useState(0);

  const selectedPaper = PAPER_ITEMS[paperIndex];
  const section = useMemo(
    () => data.sections.find((item) => item.kind === selectedPaper.kind),
    [data.sections, selectedPaper.kind],
  );
  const entries = section?.entries ?? [];
  const internships = data.sections.find((item) => item.kind === "internships")?.entries ?? [];
  const activeInternship = internships[internshipIndex];
  const timelineInternships = internships.length > 0
    ? [-1, 0, 1].map((offset) => ({
      offset,
      internship: internships[(internshipIndex + offset + internships.length) % internships.length],
    }))
    : [];

  useEffect(() => {
    if (!greetingOpen) return;
    const delay = greetingChars >= greetingText.length ? 4000 : 58;
    const timer = window.setTimeout(() => {
      setGreetingChars((value) => (value >= greetingText.length ? 0 : value + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [greetingChars, greetingOpen, greetingText]);

  const typedGreeting = greetingText.slice(0, greetingChars);
  const greetingBreak = typedGreeting.indexOf("\n");
  const greetingTitle = greetingBreak === -1 ? typedGreeting : typedGreeting.slice(0, greetingBreak);
  const greetingBody = greetingBreak === -1 ? "" : typedGreeting.slice(greetingBreak + 1);
  const greetingComplete = greetingChars >= greetingText.length;

  const setStudyPlayback = (closeGreeting: boolean) => {
    const video = studyVideoRef.current;
    if (!video) return;
    greetingActiveRef.current = false;
    if (closeGreeting) {
      setGreetingOpen(false);
      setGreetingChars(0);
    }
    setCharacterState("study");
    video.loop = true;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  const startStudy = () => setStudyPlayback(true);
  const returnToStudy = () => setStudyPlayback(false);

  const greet = () => {
    if (papersOpen || greetingActiveRef.current || characterState === "greet") return;
    const video = studyVideoRef.current;
    if (!video) return;
    greetingActiveRef.current = true;
    setGreetingOpen(true);
    setGreetingChars(0);
    setCharacterState("greet");
    video.loop = false;
    video.currentTime = 4;
    void video.play().catch(() => undefined);
  };

  const openPapers = (index: number) => {
    paperTriggerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setPaperIndex(index);
    setFolderStage("folders");
    setPapersOpen(true);
    startStudy();
  };

  const closePapers = () => {
    setPapersOpen(false);
    window.requestAnimationFrame(() => paperTriggerRef.current?.focus());
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (papersOpen) closePapers();
      }
      if (!papersOpen) return;
      if (folderStage !== "detail") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPaperIndex((value) => (value + PAPER_ITEMS.length - 1) % PAPER_ITEMS.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPaperIndex((value) => (value + 1) % PAPER_ITEMS.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [folderStage, papersOpen]);

  useEffect(() => {
    if (!papersOpen) return;
    const frame = window.requestAnimationFrame(() => paperCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [papersOpen]);

  const dropInternshipCard = () => {
    if (internshipDropping || internships.length < 2) return;
    setInternshipDropping(true);
  };

  const finishInternshipDrop = () => {
    if (!internshipDropping) return;
    setInternshipIndex((value) => (value + 1) % internships.length);
    setInternshipDropping(false);
  };

  useEffect(() => {
    if (!internshipDropping) return;
    const fallback = window.setTimeout(() => {
      setInternshipIndex((value) => (value + 1) % internships.length);
      setInternshipDropping(false);
    }, 720);
    return () => window.clearTimeout(fallback);
  }, [internshipDropping, internships.length]);

  useEffect(() => {
    if (greetingOpen || papersOpen || internships.length < 2) return;
    const timer = window.setInterval(() => {
      setInternshipIndex((value) => (value + 1) % internships.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [greetingOpen, internships.length, papersOpen]);

  return (
    <main className="room-home">
      <div className="room-home__base" aria-hidden={papersOpen ? true : undefined} inert={papersOpen || undefined}>
      <video
        ref={studyVideoRef}
        className="room-home__study-video"
        src="/room/video/study-loop.mp4"
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
        onEnded={() => {
          if (greetingActiveRef.current) returnToStudy();
          else startStudy();
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (characterState === "study" && video.currentTime >= 3) {
            video.currentTime = 0;
          }
        }}
        aria-hidden="true"
      />
      <section className="room-home__hud" aria-label="个人主页入口">
        <div className="room-home__title-block">
          <p>PORTFOLIO</p>
          <h1>{data.identity.name}</h1>
          <span>把复杂的事情，做成清晰的体验。</span>
          <button type="button" className="room-home__intro-action" onClick={greet}>和我打个招呼 <b aria-hidden="true">↗</b></button>
        </div>
        <nav
          className={`room-home__quick-nav${greetingOpen ? " is-suppressed" : ""}`}
          aria-label="快速查看经历"
          aria-hidden={greetingOpen || undefined}
          inert={greetingOpen || undefined}
        >
          {activeInternship ? (
            <section className="room-home__internship-carousel" aria-label="实习经历轮播">
              <div className="room-home__internship-heading">
                <p>INTERNSHIPS / EXPERIENCE</p>
              </div>
              <div className="room-home__internship-timeline" aria-live="polite">
                <div className="room-home__internship-timeline-line" aria-hidden="true" />
                <div className="room-home__internship-timeline-list">
                  {timelineInternships.map(({ offset, internship }) => {
                    const isActive = offset === 0;
                    const logo = INTERNSHIP_LOGOS[internship.wheelLabel];
                    return (
                      <article key={`${internship.id}-${offset}`} className={`room-home__internship-timeline-item${isActive ? " is-active" : ""}`}>
                        <span className="room-home__internship-timeline-node" aria-hidden="true" />
                        <div className="room-home__internship-timeline-content">
                          <time>{internship.startDate} — {internship.endDate}</time>
                          <div className="room-home__internship-summary-brand">
                            {logo ? (
                              <div className={`room-home__summary-logo ${logo.className ?? ""}`}>
                                <img src={logo.src} alt={`${logo.alt} Logo`} />
                              </div>
                            ) : null}
                            <span>{internship.organization}</span>
                          </div>
                          <h2>{internship.role ?? internship.title}</h2>
                          {isActive && internship.bullets[0] ? <p className="room-home__internship-proof">{internship.bullets[0]}</p> : null}
                          {isActive && internship.metrics[0] ? <strong><small>关键结果</small>{internship.metrics[0]}</strong> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <button type="button" className="room-home__internship-all" onClick={() => openPapers(0)}>
                查看完整实习经历 ↗
              </button>
            </section>
          ) : null}
        </nav>
      </section>

      <button
        className="room-home__girl-hitbox"
        type="button"
        onClick={greet}
        aria-label="点击女孩让她起身打招呼"
      ><span aria-hidden="true"><i />点击认识我</span></button>

      <button
        className="room-home__chair-hitbox"
        type="button"
        onClick={startStudy}
        aria-label="点击椅子让她回到学习状态"
      />

      {PAPER_ITEMS.map((paper, index) => (
        <button
          key={paper.kind}
          type="button"
          className="room-home__paper-hitbox"
          style={{ left: paper.left, top: paper.top }}
          onClick={() => openPapers(index)}
          aria-label={`查看${FOLDER_LABELS[paper.kind]}`}
        />
      ))}

      {greetingOpen && !papersOpen ? (
        <aside className="room-home__greeting-card" aria-live="polite">
          <p className="room-home__greeting-kicker">NICE TO MEET YOU</p>
          <h2 aria-label={greetingText}>{greetingTitle}</h2>
          <p>{greetingBody}<span className={`room-home__typing-cursor${greetingComplete ? " is-hidden" : ""}`} aria-hidden="true" /></p>
          <div className={`room-home__greeting-links${greetingComplete ? " is-ready" : ""}`}>
            <a href="https://jobsearching-peach.vercel.app/" target="_blank" rel="noreferrer" tabIndex={greetingComplete ? 0 : -1}>查看我的作品网站 ↗</a>
            <a href="https://bcnizuea2jyo.feishu.cn/wiki/CF5KwoIVPiiC8GkzrLZcJfBlnVc?from=from_copylink" target="_blank" rel="noreferrer" tabIndex={greetingComplete ? 0 : -1}>查看我的 AI 作品集 ↗</a>
          </div>
        </aside>
      ) : null}
      </div>

      {papersOpen ? (
      <div className={`room-home__paper-overlay room-home__paper-overlay--${folderStage}`} role="dialog" aria-modal="true" aria-labelledby="room-home-paper-title">
          <button className="room-home__overlay-backdrop" type="button" onClick={closePapers} aria-label="返回房间" />
          <div className="room-home__paper-viewer">
            <div className="room-home__paper-header">
              <div>
                <p className="room-home__paper-eyebrow">MY NOTES / 01</p>
                <h2 id="room-home-paper-title">从一张草稿纸开始</h2>
                <p>四个文件夹，分别记录我的教育背景、实习经历、项目经历与技能。</p>
              </div>
              <button ref={paperCloseRef} type="button" className="room-home__close room-home__paper-close" onClick={closePapers} aria-label="返回房间">×</button>
            </div>

            {folderStage === "folders" ? (
              <div className="room-home__folder-grid" aria-label="经历文件夹">
                {PAPER_ITEMS.map((paper, index) => (
                  <article className={`room-home__folder-tile${index === paperIndex ? " is-highlighted" : ""}`} key={paper.kind}>
                    <FolderComponent
                      color="blue"
                      size="sm"
                      label={FOLDER_LABELS[paper.kind]}
                      cards={PAPER_STACKS[paper.kind]}
                      onOpen={() => {
                        setPaperIndex(index);
                        setFolderStage("detail");
                      }}
                    />
                    <p>{FOLDER_LABELS[paper.kind]}</p>
                    <span>{data.sections.find((item) => item.kind === paper.kind)?.entries.length ?? 0} 段内容</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`room-home__experience-layout room-home__experience-layout--${selectedPaper.kind}`}>
                <aside className="room-home__folder-rail">
                  <button type="button" className="room-home__back-button" onClick={() => setFolderStage("folders")}>← 返回文件夹</button>
                  <div className="room-home__selected-folder">
                    <FolderComponent color="blue" size="sm" initialOpen label={FOLDER_LABELS[selectedPaper.kind]} cards={PAPER_STACKS[selectedPaper.kind]} />
                  </div>
                  <p className="room-home__selected-folder-label" aria-hidden="true">{FOLDER_LABELS[selectedPaper.kind]}</p>
                  <div className="room-home__folder-switcher">
                    {PAPER_ITEMS.map((paper, index) => (
                      <button key={paper.kind} type="button" className={index === paperIndex ? "is-active" : ""} onClick={() => setPaperIndex(index)}>{FOLDER_LABELS[paper.kind]}</button>
                    ))}
                  </div>
                </aside>
                <section className={`room-home__paper-card room-home__paper-card--${selectedPaper.kind}`} role="tabpanel" aria-labelledby="room-home-paper-title">
                  {selectedPaper.kind === "internships" && activeInternship ? (
                    <div className="room-home__internship-detail">
                      <section className="room-home__internship-stack" aria-label="实习经历卡片">
                        <div className="room-home__internship-heading room-home__internship-detail-heading">
                          <h2>实习经历</h2>
                          <div><span>{String(internshipIndex + 1).padStart(2, "0")} / {String(internships.length).padStart(2, "0")} · 点击卡片翻阅 ↓</span></div>
                        </div>
                        <div className="room-home__internship-deck">
                          <article
                            key={activeInternship.id}
                            className={`room-home__internship-card${internshipDropping ? " is-dropping" : ""}`}
                            style={{ "--internship-accent": INTERNSHIP_LOGOS[activeInternship.wheelLabel]?.accent ?? "#8d4e3a" } as CSSProperties}
                            role="button"
                            tabIndex={0}
                            aria-label={`当前为${activeInternship.wheelLabel}实习经历，点击查看下一段实习`}
                            aria-live="polite"
                            onClick={dropInternshipCard}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              dropInternshipCard();
                            }}
                            onAnimationEnd={finishInternshipDrop}
                          >
                            <header className="room-home__internship-card-header">
                              <div className="room-home__internship-company">
                                <div className={`room-home__company-logo ${INTERNSHIP_LOGOS[activeInternship.wheelLabel]?.className ?? ""}`}>
                                  {INTERNSHIP_LOGOS[activeInternship.wheelLabel] ? (
                                    <img src={INTERNSHIP_LOGOS[activeInternship.wheelLabel].src} alt={`${INTERNSHIP_LOGOS[activeInternship.wheelLabel].alt} Logo`} />
                                  ) : null}
                                </div>
                                <p>{activeInternship.organization}</p>
                              </div>
                              {activeInternship.startDate ? <time>{activeInternship.startDate}–{activeInternship.endDate}</time> : null}
                              <h3>{activeInternship.role ?? activeInternship.title}</h3>
                            </header>
                            <section className="room-home__internship-overview" aria-label={`${activeInternship.wheelLabel}工作路径与成果`}>
                              {activeInternship.wheelLabel === "阿里巴巴" ? (
                                <div className="room-home__model-evidence">
                                  <span className="room-home__evidence-label">超分模型评测</span>
                                  <ol aria-label="20多个测试集、10多类case、14种模型和5轮测试的评测证据链">
                                    <li><strong>20+</strong><span>测试集</span></li>
                                    <li><strong>10+</strong><span>类case</span></li>
                                    <li><strong>14</strong><span>种模型</span></li>
                                    <li><strong>5</strong><span>轮测试</span></li>
                                  </ol>
                                  <div className="room-home__model-result"><strong>83%</strong><span>交付周期缩短</span></div>
                                </div>
                              ) : (
                                <ul className="room-home__internship-evidence">
                                  {activeInternship.metrics.map((metric) => {
                                    const parts = getInternshipMetricParts(metric);
                                    return <li key={metric}><strong>{parts.value}</strong><span>{parts.label}</span></li>;
                                  })}
                                </ul>
                              )}
                            </section>
                            <div className="room-home__internship-content">
                              <div className="room-home__internship-card-body">
                                <ol>
                                  {activeInternship.bullets.map((bullet) => <li key={bullet}>{renderInternshipBullet(bullet)}</li>)}
                                </ol>
                              </div>
                            </div>
                          </article>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className={`room-home__paper-copy room-home__paper-copy--${selectedPaper.kind}`}>
                      <div className="room-home__detail-intro">
                        <div>
                          <h2>{FOLDER_LABELS[selectedPaper.kind]}</h2>
                          {selectedPaper.kind === "projects" ? <p>{section?.summary ?? `这里记录我的${FOLDER_LABELS[selectedPaper.kind]}。`}</p> : null}
                        </div>
                      </div>
                      {entries.length > 0 ? entries.map((entry) => (
                        <article className="room-home__structured-entry" key={entry.id}>
                          {selectedPaper.kind !== "skills" ? <div className="room-home__entry-heading">
                            <div>
                              <h3>{selectedPaper.kind === "campus" ? "学业路径" : entry.title}</h3>
                              {entry.organization || entry.role ? <p>{[entry.organization, entry.role].filter(Boolean).join(" · ")}</p> : null}
                            </div>
                            {selectedPaper.kind !== "campus" && (entry.startDate || entry.endDate) ? <time>{[entry.startDate, entry.endDate].filter(Boolean).join(" — ")}</time> : null}
                          </div> : null}
                          {selectedPaper.kind === "projects" ? (
                            <div className="room-home__project-grid">
                              <section><span>研究重点</span><p>{entry.bullets[0]}</p></section>
                              <section><span>执行与结果</span><p>{entry.bullets[1]}</p></section>
                              <div className="room-home__fact-strip">{entry.metrics.map((metric) => <span key={metric}>{metric}</span>)}</div>
                            </div>
                          ) : selectedPaper.kind === "campus" ? (
                            <div className="room-home__education-timeline">
                              <article className="room-home__education-timeline-item">
                                <time>2021.09 — 2025.07</time>
                                <span className="room-home__education-timeline-node" aria-hidden="true" />
                                <div>
                                  <h4>中南民族大学 <span>GPA 3.99/5（专业排名 3/72）</span></h4>
                                  <p>经济统计学本科，获国家奖学金、优秀毕业生与校优秀学生干部。</p>
                                  <p>{entry.bullets[2]}</p>
                                  <p>{entry.bullets[3]}</p>
                                </div>
                              </article>
                              <article className="room-home__education-timeline-item">
                                <time>2025.09 — 2027.07</time>
                                <span className="room-home__education-timeline-node" aria-hidden="true" />
                                <div>
                                  <h4>北京语言大学 <span>GPA 3.77/4.0</span></h4>
                                  <p>数字经济硕士，获校奖学金三等奖。</p>
                                </div>
                              </article>
                            </div>
                          ) : (
                            <div className="room-home__skills-grid">
                              {entry.bullets.map((bullet) => {
                                const separator = bullet.indexOf("：");
                                return <div key={bullet}><span>{separator >= 0 ? bullet.slice(0, separator) : "能力"}</span><p>{separator >= 0 ? bullet.slice(separator + 1) : bullet}</p></div>;
                              })}
                            </div>
                          )}
                        </article>
                      )) : <p className="room-home__empty-state">这部分内容正在整理，稍后补充。</p>}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}

    </main>
  );
}
