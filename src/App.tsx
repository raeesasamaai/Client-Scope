import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Layers3,
  LoaderCircle,
  Menu,
  MessageSquareText,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { analyse } from "./lib/api";
import {
  makeDoc,
  readiness,
  templates,
  type ScopeDoc,
  type Scope,
} from "./lib/model";
import { planBrief } from "./lib/planner";
import { importDocument, persist, readWorkspace } from "./lib/storage";
import { download, markdown, safeFilename } from "./lib/export";
import Dialog from "./components/Dialog";
const ScopeEditor = lazy(() => import("./components/ScopeEditor"));
import Preview from "./components/Preview";

const sections = [
  ["summary", "Overview"],
  ["deliverables", "Deliverables"],
  ["questions", "Questions"],
  ["milestones", "Milestones"],
  ["goals", "Goals"],
  ["assumptions", "Assumptions"],
  ["exclusions", "Exclusions"],
];
const relativeDate = (date: number) =>
  new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
export default function App() {
  const [initial] = useState(readWorkspace);
  const [docs, setDocs] = useState(initial.workspace.documents);
  const docsRef = useRef(docs);
  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<
    "overview" | "scopes" | "templates" | "editor"
  >("overview");
  const [tab, setTab] = useState<"brief" | "scope" | "preview">("brief");
  const [section, setSection] = useState("summary");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("clientscope:theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const [search, setSearch] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState<
    "guide" | "export" | "delete" | "regenerate" | "privacy" | null
  >(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState("");
  const request = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const doc = docs.find((d) => d.id === active);
  const ready = doc ? readiness(doc) : null;
  const reduce = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("clientscope:theme", theme);
    } catch {
      /* Preferences remain usable without storage. */
    }
  }, [theme]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    heading.current?.focus();
  }, [view, active, tab]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  function commit(next: ScopeDoc[]) {
    docsRef.current = next;
    setDocs(next);
    setSaved(persist({ version: 1, documents: next }));
  }
  function update(id: string, patch: Partial<ScopeDoc>) {
    commit(
      docsRef.current.map((d) =>
        d.id === id
          ? {
              ...d,
              ...patch,
              updatedAt: Date.now(),
              ready: patch.ready === true ? true : false,
            }
          : d,
      ),
    );
  }
  function leave(next: typeof view) {
    request.current?.abort();
    setBusy(false);
    setView(next);
    setSidebar(false);
    setSearch("");
  }
  function select(d: ScopeDoc) {
    request.current?.abort();
    setBusy(false);
    setActive(d.id);
    setView("editor");
    setTab(d.scope ? "scope" : "brief");
    setSection("summary");
    setSidebar(false);
  }
  function create(template?: (typeof templates)[number]) {
    if (docsRef.current.length >= 100) {
      setToast(
        "Your workspace holds up to 100 scopes. Export and remove older ones first.",
      );
      return;
    }
    const d = makeDoc(template?.title, template?.client, template?.brief);
    commit([d, ...docsRef.current]);
    select(d);
    setTab("brief");
    setToast(
      template
        ? "Example brief added. Edit it to make it yours."
        : "A fresh start. Add your project details and brief.",
    );
  }
  async function generate() {
    if (!doc) return;
    if (doc.brief.trim().length < 40) {
      setToast("Add a little more context: at least 40 characters.");
      return;
    }
    setModal(null);
    setBusy(true);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const snapshot = doc;
    try {
      const scope = useAI
        ? await analyse(snapshot.brief, controller.signal)
        : planBrief(snapshot.brief);
      if (controller.signal.aborted) return;
      const current = docsRef.current.find((d) => d.id === snapshot.id);
      if (!current || current.brief !== snapshot.brief) {
        setToast(
          "The brief changed. Generate again to use the latest version.",
        );
        return;
      }
      update(snapshot.id, { scope, sourceBrief: snapshot.brief });
      setTab("scope");
      setSection("summary");
      setToast(
        scope.mode === "ai"
          ? "Your AI-assisted draft is ready to review."
          : useAI
            ? "AI was unavailable. Your local scope draft is ready."
            : "Your local scope draft is ready to review.",
      );
    } catch {
      if (!controller.signal.aborted)
        setToast(
          "Analysis was interrupted. Your brief and existing scope are safe.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function setScope(scope: Scope) {
    if (doc) update(doc.id, { scope });
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 250000)
        throw new Error("Please choose a file smaller than 250 KB.");
      if (docsRef.current.length >= 100)
        throw new Error(
          "Workspace limit reached. Export and remove an older scope first.",
        );
      const d = importDocument(await file.text());
      commit([d, ...docsRef.current]);
      select(d);
      setToast("Scope imported as a new draft.");
    } catch (e) {
      setToast(
        e instanceof Error
          ? e.message
          : "This is not a valid ClientScope file.",
      );
    }
  }
  async function importBrief(file: File | undefined) {
    if (!file || !doc) return;
    try {
      if (file.size > 40000)
        throw new Error("Choose a text brief smaller than 40 KB.");
      const text = await file.text();
      if (text.length > 10000)
        throw new Error("Briefs can contain up to 10,000 characters.");
      update(doc.id, { brief: text });
      setToast("Brief imported. Review it before generating a scope.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not read this file.");
    }
  }
  async function copyScope() {
    if (!doc?.scope) return;
    try {
      await navigator.clipboard.writeText(markdown(doc));
      setToast("Scope copied as Markdown.");
    } catch {
      setToast(
        "Clipboard access is unavailable. Download the Markdown file instead.",
      );
    }
  }
  function exportAs(type: "md" | "json") {
    if (!doc?.scope) return;
    download(
      type === "md"
        ? markdown(doc)
        : JSON.stringify(
            { format: "clientscope", version: 1, document: doc },
            null,
            2,
          ),
      `${safeFilename(doc.title)}.${type}`,
      type === "md" ? "text/markdown;charset=utf-8" : "application/json",
    );
    setToast(`${type === "md" ? "Markdown" : "Editable JSON"} exported.`);
  }
  function printScope() {
    setModal(null);
    setTab("preview");
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }
  const filtered = docs
    .filter((d) =>
      `${d.title} ${d.client}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      {sidebar && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "mobile-open" : ""}`}>
        <button className="brand" onClick={() => leave("overview")}>
          <span className="brand-mark">
            <span />
            <i />
          </span>
          <span>
            ClientScope<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="workspace-switch">
          <span className="workspace-avatar">RS</span>
          <div>
            <strong>Personal workspace</strong>
            <small>Raeesa Samaai</small>
          </div>
          <ChevronsUpDown size={14} />
        </div>
        <button className="new-scope-button" onClick={() => create()}>
          <Plus size={17} /> New scope <span>+</span>
        </button>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "scopes", label: "My scopes", icon: FolderOpen },
            { id: "templates", label: "Starter briefs", icon: Layers3 },
          ].map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "selected" : ""}`}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => leave(n.id as typeof view)}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "scopes" && (
                <span className="nav-count">{docs.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-recent">
          <span className="nav-label">RECENT SCOPES</span>
          {[...docs]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 4)
            .map((d) => (
              <button
                className={`recent-link ${d.id === active && view === "editor" ? "active" : ""}`}
                key={d.id}
                onClick={() => select(d)}
              >
                <FileText size={14} />
                <span>{d.title || "Untitled project"}</span>
              </button>
            ))}
          {docs.length === 0 && (
            <p className="sidebar-empty">Your next project starts here.</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-glow">
            <span className="tiny-star">✧</span>
            <h3>
              A little clarity.
              <br />A better beginning.
            </h3>
            <p>
              Make room for the work
              <br />
              you love doing.
            </p>
            <button onClick={() => setModal("guide")}>
              Meet your workspace <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="theme-control" role="group" aria-label="Colour theme">
            <button
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={14} /> Light
            </button>
            <button
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
          <button className="sidebar-help" onClick={() => setModal("privacy")}>
            <ShieldCheck size={14} /> Local by default <CircleHelp size={13} />
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setSidebar(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "editor"
                ? doc?.title || "Untitled project"
                : view === "overview"
                  ? "Overview"
                  : view === "scopes"
                    ? "My scopes"
                    : "Starter briefs"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="save-status">
              <span className={`status-dot ${saved ? "" : "not-saved"}`} />
              {saved ? "Saved on this device" : "Storage unavailable"}
            </span>
            <button
              className="icon-button"
              aria-label="Open workspace guide"
              onClick={() => setModal("guide")}
            >
              <CircleHelp size={18} />
            </button>
            <span className="profile-avatar">RS</span>
          </div>
        </header>
        <main
          id="main"
          className={`main-grid ${view === "editor" && tab === "preview" ? "preview-grid" : ""}`}
        >
          <div className="main-content">
            {!saved && (
              <div className="notice warning" role="alert">
                Your browser couldn’t save these changes. Keep this tab open and
                export your work.
              </div>
            )}
            {initial.warning && (
              <div className="notice warning">{initial.warning}</div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view === "editor" ? `${view}-${active}` : view}
                initial={{ opacity: 0, y: reduce ? 0 : 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              >
                {(view === "overview" || view === "scopes") && (
                  <>
                    <div className="page-heading">
                      <div>
                        <span className="eyebrow">
                          YOUR SPACE TO MAKE THINGS CLEAR
                        </span>
                        <h1 ref={heading} tabIndex={-1}>
                          {view === "overview"
                            ? "Good work starts here."
                            : "Every project, in perspective."}
                        </h1>
                        <p>
                          {view === "overview"
                            ? "Less back-and-forth. More shared understanding."
                            : "Keep the brief, the decisions, and the plan together."}
                        </p>
                      </div>
                      <button
                        className="button secondary import-top"
                        onClick={() => importRef.current?.click()}
                      >
                        <Upload size={15} /> Import scope
                      </button>
                    </div>
                    {view === "overview" && (
                      <section className="welcome-card">
                        <div className="welcome-grid" />
                        <span className="hero-pill">
                          <Sparkles size={13} /> FROM “A QUICK IDEA” TO A CLEAR
                          PLAN
                        </span>
                        <h2>
                          Clear briefs.
                          <br />
                          <span>Confident projects.</span>
                        </h2>
                        <p>
                          Turn scattered thoughts into deliverables,
                          <br className="desktop-br" /> better questions, and a
                          scope you can stand behind.
                        </p>
                        <div className="hero-actions">
                          <button
                            className="button primary"
                            onClick={() => create()}
                          >
                            Create your first draft <ArrowRight size={16} />
                          </button>
                          <button
                            className="text-button"
                            onClick={() => create(templates[0])}
                          >
                            Try an example <ArrowUpRight size={14} />
                          </button>
                        </div>
                        <div className="orb-art" aria-hidden="true">
                          <div className="orb-ring ring-one" />
                          <div className="orb-ring ring-two" />
                          <div className="orb-globe" />
                          <span className="orb-spark spark-one">✧</span>
                          <span className="orb-spark spark-two">✧</span>
                          <div className="floating-note note-top">
                            <span className="mini-dot" /> The brief, untangled.
                          </div>
                          <div className="floating-note note-bottom">
                            <CheckCheck size={13} /> Ready for a better handoff.
                          </div>
                        </div>
                        <div className="hero-footer">
                          <span>
                            <ShieldCheck size={12} /> Yours to edit. Yours to
                            keep.
                          </span>
                          <span>NO ACCOUNT NEEDED</span>
                        </div>
                      </section>
                    )}
                    <section className="scope-library">
                      <div className="library-heading">
                        <h2>
                          {view === "overview" ? "On your desk" : "Your scopes"}{" "}
                          <span>{docs.length}</span>
                        </h2>
                        <label className="search-input">
                          <Search size={15} />
                          <span className="sr-only">Search scopes</span>
                          <input
                            placeholder="Find a scope…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            maxLength={120}
                          />
                        </label>
                      </div>
                      {filtered.length ? (
                        <div className="scope-cards">
                          {filtered.map((d) => (
                            <article className="scope-card" key={d.id}>
                              <div className="scope-card-top">
                                <span className="scope-icon">
                                  <FileText size={20} />
                                </span>
                                <span
                                  className={`status-pill ${d.ready ? "ready" : ""}`}
                                >
                                  {d.ready
                                    ? "Ready for review"
                                    : d.scope
                                      ? "In progress"
                                      : "Brief draft"}
                                </span>
                                <button
                                  className="icon-button"
                                  aria-label={`Delete ${d.title}`}
                                  onClick={() => {
                                    setDeleteId(d.id);
                                    setModal("delete");
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <button
                                className="scope-open"
                                onClick={() => select(d)}
                              >
                                <h3>{d.title || "Untitled project"}</h3>
                                <p>{d.client || "Client to be confirmed"}</p>
                              </button>
                              <div className="scope-card-footer">
                                <span>
                                  <Clock3 size={12} />{" "}
                                  {relativeDate(d.updatedAt)}
                                </span>
                                <button
                                  className="text-button"
                                  onClick={() => select(d)}
                                >
                                  Open scope <ArrowUpRight size={13} />
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-library">
                          <span className="empty-icon">
                            <FolderOpen size={25} />
                          </span>
                          <h3>
                            {search
                              ? "No matching scopes."
                              : "A clear desk. A fresh start."}
                          </h3>
                          <p>
                            {search
                              ? "Try a different project or client name."
                              : "Create a scope from your brief, or explore an example to see how it works."}
                          </p>
                          <button
                            className="text-button"
                            onClick={() => (search ? setSearch("") : create())}
                          >
                            {search ? "Clear search" : "Create a new scope"}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </section>
                    <div className="workspace-footnote">
                      <span>Thoughtful tools for thoughtful work.</span>
                      <button onClick={() => setModal("privacy")}>
                        Privacy & credits <ArrowUpRight size={11} />
                      </button>
                    </div>
                  </>
                )}
                {view === "templates" && (
                  <>
                    <div className="page-heading">
                      <div>
                        <span className="eyebrow">SKIP THE BLANK PAGE</span>
                        <h1 ref={heading} tabIndex={-1}>
                          Start with a little direction.
                        </h1>
                        <p>
                          Example briefs for real conversations. Make one your
                          own.
                        </p>
                      </div>
                    </div>
                    <div className="templates-grid">
                      {templates.map((t, i) => (
                        <article className="template-card" key={t.title}>
                          <span className="template-number">0{i + 1}</span>
                          <span className="template-kind">{t.kind}</span>
                          <h2>{t.title}</h2>
                          <p>{t.description}</p>
                          <div className="template-snippet">
                            {t.brief.slice(0, 150)}…
                          </div>
                          <button
                            className="button secondary"
                            onClick={() => create(t)}
                          >
                            Use this starter <ArrowRight size={15} />
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
                {view === "editor" && doc && (
                  <>
                    <div className="document-heading">
                      <div className="document-heading-title">
                        <span className="eyebrow">PROJECT WORKSPACE</span>
                        <label className="sr-only" htmlFor="project-title">
                          Project title
                        </label>
                        <input
                          id="project-title"
                          className="project-title-input"
                          value={doc.title}
                          onChange={(e) =>
                            update(doc.id, { title: e.target.value })
                          }
                          maxLength={120}
                          placeholder="Give your project a name"
                        />
                        <div className="client-line">
                          <span>Prepared for</span>
                          <label className="sr-only" htmlFor="client-name">
                            Client name
                          </label>
                          <input
                            id="client-name"
                            value={doc.client}
                            maxLength={120}
                            placeholder="Client name"
                            onChange={(e) =>
                              update(doc.id, { client: e.target.value })
                            }
                          />
                          <span
                            className={`status-pill ${doc.ready ? "ready" : ""}`}
                          >
                            {doc.ready
                              ? "Ready for client review"
                              : "Working draft"}
                          </span>
                        </div>
                      </div>
                      <button
                        className="button secondary"
                        disabled={!doc.scope}
                        onClick={() => setModal("export")}
                      >
                        <Download size={15} /> Export
                      </button>
                    </div>
                    <div
                      className="workflow-tabs"
                      role="tablist"
                      aria-label="Project workflow"
                    >
                      {[
                        { id: "brief", label: "The brief", number: "01" },
                        { id: "scope", label: "Build the scope", number: "02" },
                        {
                          id: "preview",
                          label: "Preview & export",
                          number: "03",
                        },
                      ].map((t) => (
                        <button
                          role="tab"
                          id={`tab-${t.id}`}
                          aria-selected={tab === t.id}
                          aria-controls={`panel-${t.id}`}
                          className={tab === t.id ? "active" : ""}
                          disabled={t.id !== "brief" && !doc.scope}
                          key={t.id}
                          onClick={() => setTab(t.id as typeof tab)}
                        >
                          <span>{t.number}</span>
                          {t.label}
                          {t.id === "brief" && doc.brief.length >= 40 && (
                            <Check size={12} />
                          )}
                        </button>
                      ))}
                    </div>
                    <div
                      role="tabpanel"
                      id={`panel-${tab}`}
                      aria-labelledby={`tab-${tab}`}
                    >
                      {tab === "brief" && (
                        <section className="brief-card">
                          <div className="section-title">
                            <span className="section-icon">
                              <MessageSquareText size={21} />
                            </span>
                            <div>
                              <h2>Let’s start with the messy part.</h2>
                              <p>
                                Paste the email, the notes, or the “quick idea”.
                                We’ll help you find the structure.
                              </p>
                            </div>
                          </div>
                          <div className="brief-toolbar">
                            <label
                              htmlFor="brief-input"
                              className="field-label"
                            >
                              YOUR CLIENT’S BRIEF
                            </label>
                            <button
                              className="text-button"
                              onClick={() => fileRef.current?.click()}
                            >
                              <Upload size={13} /> Import .txt / .md
                            </button>
                          </div>
                          <textarea
                            id="brief-input"
                            className="brief-textarea"
                            value={doc.brief}
                            disabled={busy}
                            onChange={(e) =>
                              update(doc.id, { brief: e.target.value })
                            }
                            maxLength={10000}
                            placeholder={
                              "“We need a new website. Something clean and modern, with a booking feature. It should be pretty simple…”\n\nSound familiar? Start here. Include goals, requested features, timing, and any constraints you already know."
                            }
                          />
                          <div className="brief-caption">
                            <span>
                              <ShieldCheck size={12} /> Stays on your device
                              unless you enable AI below.
                            </span>
                            <span>
                              {doc.brief.length.toLocaleString()} / 10,000
                            </span>
                          </div>
                          <div className="analysis-options">
                            <div>
                              <label className="ai-switch">
                                <input
                                  type="checkbox"
                                  checked={useAI}
                                  disabled={busy}
                                  onChange={(e) => setUseAI(e.target.checked)}
                                />
                                <span className="switch-track" />
                                <span>Enhance with AI</span>
                                <Sparkles size={13} />
                              </label>
                              <p>
                                {useAI
                                  ? "Your brief will be sent to the configured AI provider. Local analysis is the fallback."
                                  : "Local analysis: structured suggestions, no API key needed."}
                              </p>
                            </div>
                            <button
                              className="button primary"
                              disabled={busy || doc.brief.trim().length < 40}
                              onClick={() =>
                                doc.scope
                                  ? setModal("regenerate")
                                  : void generate()
                              }
                            >
                              {busy ? (
                                <LoaderCircle size={16} className="spin" />
                              ) : (
                                <Sparkles size={15} />
                              )}{" "}
                              {busy
                                ? "Finding the clarity…"
                                : doc.scope
                                  ? "Regenerate scope"
                                  : "Create my scope"}
                              {!busy && <ArrowRight size={16} />}
                            </button>
                          </div>
                          <div className="brief-tip">
                            <span className="tip-bulb">✧</span>
                            <p>
                              <strong>
                                A starting point, not a commitment.
                              </strong>{" "}
                              Every suggestion is editable. Budgets and dates
                              stay unconfirmed until you agree them.
                            </p>
                          </div>
                        </section>
                      )}
                      {tab === "scope" && doc.scope && (
                        <>
                          <div className="scope-toolbar">
                            <div
                              className="scope-subtabs"
                              role="group"
                              aria-label="Scope section"
                            >
                              {sections.map(([key, label]) => (
                                <button
                                  key={key}
                                  aria-pressed={section === key}
                                  className={section === key ? "active" : ""}
                                  onClick={() => setSection(key)}
                                >
                                  {label}
                                  {key === "questions" && (
                                    <span>
                                      {
                                        doc.scope!.questions.filter(
                                          (q) => !q.answer.trim(),
                                        ).length
                                      }
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          {doc.brief !== doc.sourceBrief && (
                            <div className="notice warning">
                              Your brief has changed since this draft was
                              generated. Review the changes or regenerate from
                              the Brief tab before marking it ready.
                            </div>
                          )}
                          <Suspense
                            fallback={
                              <p className="notice" role="status">
                                Opening your scope editor…
                              </p>
                            }
                          >
                            <ScopeEditor
                              scope={doc.scope}
                              onChange={setScope}
                              section={section}
                            />
                          </Suspense>
                        </>
                      )}
                      {tab === "preview" && doc.scope && (
                        <>
                          <div className="preview-toolbar">
                            <span>
                              <FileCheck2 size={15} /> Your handoff, taking
                              shape.
                            </span>
                            <button
                              className="text-button"
                              onClick={printScope}
                            >
                              Print / save PDF <ArrowUpRight size={14} />
                            </button>
                          </div>
                          <Preview doc={doc} />
                        </>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <aside className="inspector">
            {view === "editor" && doc ? (
              <>
                <div className="inspector-header">
                  <span className="inspector-icon">
                    <FileCheck2 size={20} />
                  </span>
                  <h2>Scope clarity</h2>
                  <p>A few checks for a better handoff.</p>
                </div>
                <div className="readiness-meter">
                  <span>
                    {ready!.percent}
                    <small>%</small>
                  </span>
                  <p>REVIEW READINESS</p>
                  <div className="meter-track">
                    <div style={{ width: `${ready!.percent}%` }} />
                  </div>
                </div>
                <div className="inspector-checks">
                  {ready!.checks.map((c) => (
                    <div key={c.label} className={c.ok ? "check-done" : ""}>
                      {c.ok ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="empty-check" />
                      )}
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="button secondary ready-button"
                  disabled={ready!.percent !== 100 || doc.ready}
                  onClick={() => {
                    update(doc.id, { ready: true });
                    setToast(
                      "Marked ready for client review. This does not record client approval.",
                    );
                  }}
                >
                  <CheckCheck size={16} />
                  {doc.ready ? "Ready for review" : "Mark ready for review"}
                </button>
                <div className="inspector-divider" />
                <span className="eyebrow">AT A GLANCE</span>
                <div className="inspector-stat">
                  <span>Deliverables</span>
                  <strong>{doc.scope?.deliverables.length ?? "—"}</strong>
                </div>
                <div className="inspector-stat">
                  <span>Open questions</span>
                  <strong>
                    {doc.scope?.questions.filter((q) => !q.answer.trim())
                      .length ?? "—"}
                  </strong>
                </div>
                <div className="inspector-stat">
                  <span>Milestones</span>
                  <strong>{doc.scope?.milestones.length ?? "—"}</strong>
                </div>
                <div className="mode-card">
                  <Sparkles size={14} />
                  <div>
                    <strong>
                      {doc.scope?.mode === "ai"
                        ? "AI-assisted draft"
                        : doc.scope
                          ? "Local draft"
                          : "Your brief, your words"}
                    </strong>
                    <p>
                      {doc.scope
                        ? "Suggestions are proposals. Review before sharing."
                        : "Turn a rough idea into a shared understanding."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="inspector-header">
                  <span className="inspector-icon">
                    <Sparkles size={21} />
                  </span>
                  <h2>A clearer way to work.</h2>
                  <p>
                    From the first conversation
                    <br />
                    to a confident handoff.
                  </p>
                </div>
                <div className="process-list">
                  {[
                    {
                      title: "Capture the brief",
                      text: "Gather the thoughts, requests, and loose ends.",
                    },
                    {
                      title: "Find the structure",
                      text: "Define deliverables. Surface the right questions.",
                    },
                    {
                      title: "Make it yours",
                      text: "Review, refine, and share a clear plan.",
                    },
                  ].map((s, i) => (
                    <div key={s.title}>
                      <span>0{i + 1}</span>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  ))}
                </div>
                <div className="inspector-divider" />
                <span className="eyebrow">MADE FOR YOUR NEXT PROJECT</span>
                <div className="benefit">
                  <CheckCircle2 size={15} />
                  <span>Editable from start to finish</span>
                </div>
                <div className="benefit">
                  <CheckCircle2 size={15} />
                  <span>Clear acceptance criteria</span>
                </div>
                <div className="benefit">
                  <CheckCircle2 size={15} />
                  <span>Markdown, JSON & print exports</span>
                </div>
                <div className="inspector-note">
                  <BookOpen size={18} />
                  <p>Good questions are part of the deliverable.</p>
                  <button
                    className="text-button"
                    onClick={() => setModal("guide")}
                  >
                    A quick walkthrough <ArrowUpRight size={13} />
                  </button>
                </div>
              </>
            )}
            <div className="inspector-bottom">
              <span>DESIGNED & BUILT FOR</span>
              <a
                href="https://github.com/raeesasamaai/Client-Scope"
                target="_blank"
                rel="noreferrer"
              >
                Raeesa Samaai <ArrowUpRight size={12} />
              </a>
            </div>
          </aside>
        </main>
      </div>
      <input
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="sr-only"
        tabIndex={-1}
        ref={fileRef}
        onChange={(e) => {
          void importBrief(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        ref={importRef}
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="toast" role="status" aria-live="polite">
        {toast && (
          <span>
            <CheckCircle2 size={16} />
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={14} />
            </button>
          </span>
        )}
      </div>
      <Dialog
        open={modal !== null}
        title={
          modal === "export"
            ? "Ready to take it with you?"
            : modal === "delete"
              ? "Remove this scope?"
              : modal === "regenerate"
                ? "Build a fresh draft?"
                : modal === "privacy"
                  ? "Your workspace. Your information."
                  : "A clearer start, in three steps."
        }
        onClose={() => setModal(null)}
      >
        {modal === "export" ? (
          <>
            <p>
              Export your current draft, including unresolved questions. Use
              JSON to keep an editable backup.
            </p>
            <div className="export-options">
              <button onClick={() => exportAs("md")}>
                <FileText size={22} />
                <span>
                  <strong>Markdown document</strong>
                  <small>A clean scope for your docs and handoff.</small>
                </span>
                <ArrowDownToLine size={17} />
              </button>
              <button onClick={() => exportAs("json")}>
                <Download size={22} />
                <span>
                  <strong>Editable JSON backup</strong>
                  <small>Import it into ClientScope later.</small>
                </span>
                <ArrowDownToLine size={17} />
              </button>
              <button onClick={printScope}>
                <FileCheck2 size={22} />
                <span>
                  <strong>Print / save as PDF</strong>
                  <small>Opens your browser’s print dialog.</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => void copyScope()}>
                <Copy size={22} />
                <span>
                  <strong>Copy to clipboard</strong>
                  <small>Your complete scope as Markdown.</small>
                </span>
                <Copy size={17} />
              </button>
            </div>
          </>
        ) : modal === "delete" ? (
          <>
            <p>
              This removes the scope from this browser. Export an editable JSON
              backup first if you want to keep it.
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Keep scope
              </button>
              <button
                className="button danger"
                onClick={() => {
                  commit(docsRef.current.filter((d) => d.id !== deleteId));
                  if (active === deleteId) leave("scopes");
                  setModal(null);
                  setDeleteId(null);
                  setToast("Scope removed from this workspace.");
                }}
              >
                <Trash2 size={15} /> Remove scope
              </button>
            </div>
          </>
        ) : modal === "regenerate" ? (
          <>
            <p>
              This replaces the generated scope, including your edits, answers
              and milestone order. Your original brief stays intact. Export a
              JSON backup first if you need the current version.
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Keep my edits
              </button>
              <button
                className="button primary"
                onClick={() => void generate()}
              >
                Generate a fresh draft <ArrowRight size={15} />
              </button>
            </div>
          </>
        ) : modal === "privacy" ? (
          <>
            <p>
              ClientScope saves scopes in this browser’s local storage. It has
              no account system, analytics or cloud sync. Clearing site data
              removes your saved workspace.
            </p>
            <p>
              Local analysis runs on your device. If you explicitly enable AI,
              your brief is sent through the server to APInex when a provider
              key is configured. The interface labels the resulting mode. Never
              enter sensitive client information without permission. Hosting and
              AI providers may retain normal request logs.
            </p>
            <p>
              Ready for review means you reviewed the draft; it does not
              represent client approval or a signed contract. All suggested
              assumptions, costs and dates need confirmation.
            </p>
            <p>
              Original interface and implementation created for Raeesa Samaai.
              Icons: Lucide (ISC). Fonts: Manrope and Outfit (SIL OFL). Licence
              texts ship with the app.
            </p>
            <a
              className="button secondary"
              href="https://github.com/raeesasamaai/Client-Scope"
              target="_blank"
              rel="noreferrer"
            >
              View source <ArrowUpRight size={15} />
            </a>
          </>
        ) : (
          <>
            <ol className="guide-list">
              <li>
                <strong>Bring the brief.</strong> Create a scope and paste your
                notes, or choose a starter brief. Local analysis works without
                an API key.
              </li>
              <li>
                <strong>Review the proposals.</strong> Edit deliverables and
                acceptance criteria, answer the essential questions, and arrange
                milestones. Check “Reviewed by me” on each deliverable.
              </li>
              <li>
                <strong>Share a clear plan.</strong> Preview the document,
                export Markdown or an editable JSON backup, or print to PDF.
                “Ready” means ready for a conversation, not a signed commitment.
              </li>
            </ol>
            <p>
              Changes save automatically on this device. Light and dark themes
              are available at the bottom of the navigation.
            </p>
            <button className="button primary" onClick={() => setModal(null)}>
              Let’s get started <ArrowRight size={15} />
            </button>
          </>
        )}
      </Dialog>
    </div>
  );
}
