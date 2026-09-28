"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  projects: ["/room/papers/IMG_2567.jpg", "/room/papers/IMG_0015.jpg", "/room/papers/IMG_1512.jpg"],
  campus: ["/room/papers/IMG_0015.jpg", "/room/papers/IMG_1512.jpg", "/room/papers/IMG_2567.jpg"],
  skills: ["/room/papers/IMG_1512.jpg", "/room/papers/IMG_0015.jpg", "/room/papers/IMG_2567.jpg"],
};

const FOLDER_LABELS: Record<PortfolioKind, string> = {
  internships: "实习经历",
  projects: "项目经历",
  campus: "教育背景",
  skills: "技能",
};

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
  const [carouselPaused, setCarouselPaused] = useState(false);
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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (carouselPaused || prefersReducedMotion || greetingOpen || papersOpen || internships.length < 2) return;
    const timer = window.setInterval(() => {
      setInternshipIndex((value) => (value + 1) % internships.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [carouselPaused, greetingOpen, internships.length, papersOpen]);

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
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
          onFocus={() => setCarouselPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setCarouselPaused(false);
          }}
        >
          {activeInternship ? (
            <section className="room-home__internship-carousel" aria-label="实习经历轮播">
              <div className="room-home__internship-heading">
                <p>实习经历</p>
              </div>
              <article key={activeInternship.id} className="room-home__internship-slide" aria-live="polite">
                <h2>{activeInternship.title}</h2>
                <p className="room-home__internship-meta">
                  {activeInternship.organization ? <span>{activeInternship.organization}</span> : null}
                  {activeInternship.role ? <span>{activeInternship.role}</span> : null}
                  {activeInternship.startDate ? <time>{activeInternship.startDate} — {activeInternship.endDate}</time> : null}
                </p>
                {activeInternship.bullets[0] ? <p className="room-home__internship-proof">{activeInternship.bullets[0]}</p> : null}
                {activeInternship.metrics[0] ? <strong><small>关键结果</small>{activeInternship.metrics[0]}</strong> : null}
              </article>
              <div className="room-home__carousel-controls">
                <button type="button" aria-label="上一段实习" onClick={() => setInternshipIndex((value) => (value + internships.length - 1) % internships.length)}>上一段</button>
                <div className="room-home__carousel-pages" aria-label="选择实习经历">
                  {internships.map((internship, index) => (
                    <button
                      key={internship.id}
                      type="button"
                      className={index === internshipIndex ? "is-active" : ""}
                      aria-label={`查看第 ${index + 1} 段实习`}
                      aria-current={index === internshipIndex ? "true" : undefined}
                      onClick={() => setInternshipIndex(index)}
                    />
                  ))}
                  <span>{String(internshipIndex + 1).padStart(2, "0")} / {String(internships.length).padStart(2, "0")}</span>
                </div>
                <button type="button" aria-label="下一段实习" onClick={() => setInternshipIndex((value) => (value + 1) % internships.length)}>下一段</button>
              </div>
              <button className="room-home__internship-all" type="button" onClick={() => openPapers(0)}>查看全部实习经历</button>
            </section>
          ) : null}
          <div className="room-home__index-grid">
            {PAPER_ITEMS.map((paper, index) => (
              <button key={paper.kind} type="button" onClick={() => openPapers(index)}>
                {FOLDER_LABELS[paper.kind]}
              </button>
            ))}
          </div>
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
              <div className="room-home__experience-layout">
                <aside className="room-home__folder-rail">
                  <button type="button" className="room-home__back-button" onClick={() => setFolderStage("folders")}>← 返回文件夹</button>
                  <div className="room-home__selected-folder">
                    <FolderComponent color="blue" size="md" initialOpen label={FOLDER_LABELS[selectedPaper.kind]} cards={PAPER_STACKS[selectedPaper.kind]} />
                  </div>
                  <p className="room-home__selected-folder-label" aria-hidden="true">{FOLDER_LABELS[selectedPaper.kind]}</p>
                  <div className="room-home__folder-switcher">
                    {PAPER_ITEMS.map((paper, index) => (
                      <button key={paper.kind} type="button" className={index === paperIndex ? "is-active" : ""} onClick={() => setPaperIndex(index)}>{FOLDER_LABELS[paper.kind]}</button>
                    ))}
                  </div>
                </aside>
                <section className="room-home__paper-card" role="tabpanel" aria-labelledby="room-home-paper-title">
                  <div className="room-home__paper-copy">
                    <p className="room-home__paper-label">{FOLDER_LABELS[selectedPaper.kind]}</p>
                    <h2>{FOLDER_LABELS[selectedPaper.kind]}</h2>
                    <span className="room-home__count">{entries.length} 段内容</span>
                    <p>{section?.summary ?? `这里记录我的${FOLDER_LABELS[selectedPaper.kind]}。`}</p>
                    <div className="room-home__entry-list">
                      {entries.length > 0 ? entries.map((entry) => (
                        <article className="room-home__entry" key={entry.id}>
                          <div className="room-home__entry-heading">
                            <div>
                              <h3>{entry.title}</h3>
                              {entry.organization || entry.role ? <p>{[entry.organization, entry.role].filter(Boolean).join(" · ")}</p> : null}
                            </div>
                            {entry.startDate || entry.endDate ? <time>{[entry.startDate, entry.endDate].filter(Boolean).join(" — ")}</time> : null}
                          </div>
                          {entry.bullets.length > 0 ? <ul>{entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                          {entry.metrics.length > 0 ? <div className="room-home__metrics">{entry.metrics.map((metric) => <span key={metric}>{metric}</span>)}</div> : null}
                        </article>
                      )) : <p className="room-home__empty-state">这部分内容正在整理，稍后补充。</p>}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
