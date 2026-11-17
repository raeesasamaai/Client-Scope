import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Quote,
  Target,
  ListChecks,
  CircleHelp,
  Layers,
  CalendarDays,
  Ban,
} from "lucide-react";
import { uid, type Scope } from "../lib/model";
type Props = { scope: Scope; onChange: (s: Scope) => void; section: string };
export default function ScopeEditor({
  scope: s,
  onChange: set,
  section,
}: Props) {
  const listKey =
    section === "goals"
      ? "goals"
      : section === "assumptions"
        ? "assumptions"
        : "exclusions";
  const list = s[listKey];
  if (section === "summary")
    return (
      <div className="editor-section">
        <div className="section-title">
          <span className="section-icon">
            <Target size={20} />
          </span>
          <div>
            <h2>The project, in a nutshell.</h2>
            <p>A shared understanding of what you’re making and why.</p>
          </div>
        </div>
        <label className="field-label" htmlFor="scope-summary">
          PROJECT SUMMARY
        </label>
        <textarea
          id="scope-summary"
          className="text-input summary-input"
          value={s.summary}
          maxLength={3000}
          onChange={(e) => set({ ...s, summary: e.target.value })}
        />
        <div className="tip">
          <Quote size={17} />
          <p>
            A useful scope describes an outcome. Keep implementation decisions
            open until the requirements are clear.
          </p>
        </div>
      </div>
    );
  if (section === "deliverables")
    return (
      <div className="editor-section">
        <div className="section-title">
          <span className="section-icon">
            <ListChecks size={20} />
          </span>
          <div>
            <h2>Make “done” specific.</h2>
            <p>Review each proposal and define how you’ll accept the work.</p>
          </div>
        </div>
        {s.deliverables.map((d, i) => (
          <article className="edit-card" key={d.id}>
            <div className="edit-card-head">
              <span className="number-label">
                {String(i + 1).padStart(2, "0")}
              </span>
              <label className="sr-only" htmlFor={`dt-${d.id}`}>
                Deliverable {i + 1} title
              </label>
              <input
                id={`dt-${d.id}`}
                className="inline-title"
                value={d.title}
                maxLength={200}
                onChange={(e) =>
                  set({
                    ...s,
                    deliverables: s.deliverables.map((x) =>
                      x.id === d.id
                        ? { ...x, title: e.target.value, confirmed: false }
                        : x,
                    ),
                  })
                }
              />
              <button
                className="icon-button"
                aria-label={`Delete deliverable ${i + 1}`}
                onClick={() =>
                  set({
                    ...s,
                    deliverables: s.deliverables.filter((x) => x.id !== d.id),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
            <label className="field-label" htmlFor={`dd-${d.id}`}>
              DESCRIPTION
            </label>
            <textarea
              id={`dd-${d.id}`}
              className="text-input compact"
              value={d.description}
              maxLength={2000}
              onChange={(e) =>
                set({
                  ...s,
                  deliverables: s.deliverables.map((x) =>
                    x.id === d.id
                      ? { ...x, description: e.target.value, confirmed: false }
                      : x,
                  ),
                })
              }
            />
            <label className="field-label" htmlFor={`dc-${d.id}`}>
              ACCEPTANCE CRITERIA
            </label>
            <textarea
              id={`dc-${d.id}`}
              className="text-input compact"
              value={d.criteria}
              maxLength={2000}
              placeholder="How will you know this is complete?"
              onChange={(e) =>
                set({
                  ...s,
                  deliverables: s.deliverables.map((x) =>
                    x.id === d.id
                      ? { ...x, criteria: e.target.value, confirmed: false }
                      : x,
                  ),
                })
              }
            />
            {d.evidence && (
              <details className="evidence">
                <summary>
                  <Quote size={12} /> View brief evidence
                </summary>
                <p>{d.evidence}</p>
              </details>
            )}
            <label
              className={`confirm-toggle ${d.confirmed ? "is-confirmed" : ""}`}
            >
              <input
                type="checkbox"
                checked={d.confirmed}
                onChange={(e) =>
                  set({
                    ...s,
                    deliverables: s.deliverables.map((x) =>
                      x.id === d.id ? { ...x, confirmed: e.target.checked } : x,
                    ),
                  })
                }
              />
              <Check size={14} /> Reviewed by me
            </label>
          </article>
        ))}
        <button
          className="add-button"
          disabled={s.deliverables.length >= 30}
          onClick={() =>
            set({
              ...s,
              deliverables: [
                ...s.deliverables,
                {
                  id: uid(),
                  title: "New deliverable",
                  description: "",
                  criteria: "",
                  evidence: "",
                  confirmed: false,
                },
              ],
            })
          }
        >
          <Plus size={15} /> Add a deliverable
        </button>
      </div>
    );
  if (section === "questions")
    return (
      <div className="editor-section">
        <div className="section-title">
          <span className="section-icon">
            <CircleHelp size={20} />
          </span>
          <div>
            <h2>Ask now. Avoid surprises later.</h2>
            <p>Resolve essential questions before marking this scope ready.</p>
          </div>
        </div>
        {s.questions.map((q, i) => (
          <article className="edit-card question-edit" key={q.id}>
            <div className="edit-card-head">
              <span className="number-label">
                {String(i + 1).padStart(2, "0")}
              </span>
              <label className="sr-only" htmlFor={`qt-${q.id}`}>
                Question {i + 1}
              </label>
              <textarea
                id={`qt-${q.id}`}
                className="inline-question"
                value={q.text}
                maxLength={2000}
                onChange={(e) =>
                  set({
                    ...s,
                    questions: s.questions.map((x) =>
                      x.id === q.id ? { ...x, text: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                className="icon-button"
                aria-label={`Delete question ${i + 1}`}
                onClick={() =>
                  set({
                    ...s,
                    questions: s.questions.filter((x) => x.id !== q.id),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
            <label className="sr-only" htmlFor={`qa-${q.id}`}>
              Answer to question {i + 1}
            </label>
            <textarea
              id={`qa-${q.id}`}
              className="text-input compact"
              value={q.answer}
              maxLength={2000}
              placeholder="Add the agreed answer…"
              onChange={(e) =>
                set({
                  ...s,
                  questions: s.questions.map((x) =>
                    x.id === q.id ? { ...x, answer: e.target.value } : x,
                  ),
                })
              }
            />
            <label className="required-toggle">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) =>
                  set({
                    ...s,
                    questions: s.questions.map((x) =>
                      x.id === q.id ? { ...x, required: e.target.checked } : x,
                    ),
                  })
                }
              />{" "}
              Essential before review{" "}
              <span
                className={q.answer.trim() ? "answered-badge" : "open-badge"}
              >
                {q.answer.trim() ? "Answered" : "Open"}
              </span>
            </label>
          </article>
        ))}
        <button
          className="add-button"
          disabled={s.questions.length >= 30}
          onClick={() =>
            set({
              ...s,
              questions: [
                ...s.questions,
                {
                  id: uid(),
                  text: "New clarification question",
                  answer: "",
                  required: true,
                },
              ],
            })
          }
        >
          <Plus size={15} /> Add a question
        </button>
      </div>
    );
  if (section === "milestones")
    return (
      <div className="editor-section">
        <div className="section-title">
          <span className="section-icon">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2>A plan you can agree on.</h2>
            <p>
              Sequence the work. Durations remain uncommitted until you add
              them.
            </p>
          </div>
        </div>
        {s.milestones.map((m, i) => (
          <article className="edit-card" key={m.id}>
            <div className="edit-card-head">
              <span className="number-label">
                {String(i + 1).padStart(2, "0")}
              </span>
              <label className="sr-only" htmlFor={`mt-${m.id}`}>
                Milestone {i + 1} title
              </label>
              <input
                id={`mt-${m.id}`}
                className="inline-title"
                value={m.title}
                maxLength={200}
                onChange={(e) =>
                  set({
                    ...s,
                    milestones: s.milestones.map((x) =>
                      x.id === m.id ? { ...x, title: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                className="icon-button"
                aria-label={`Move milestone ${i + 1} up`}
                disabled={i === 0}
                onClick={() => {
                  const arr = [...s.milestones];
                  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  set({ ...s, milestones: arr });
                }}
              >
                <ArrowUp size={14} />
              </button>
              <button
                className="icon-button"
                aria-label={`Move milestone ${i + 1} down`}
                disabled={i === s.milestones.length - 1}
                onClick={() => {
                  const arr = [...s.milestones];
                  [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                  set({ ...s, milestones: arr });
                }}
              >
                <ArrowDown size={14} />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete milestone ${i + 1}`}
                onClick={() =>
                  set({
                    ...s,
                    milestones: s.milestones.filter((x) => x.id !== m.id),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
            <label className="sr-only" htmlFor={`md-${m.id}`}>
              Milestone {i + 1} description
            </label>
            <textarea
              id={`md-${m.id}`}
              className="text-input compact"
              value={m.description}
              maxLength={2000}
              onChange={(e) =>
                set({
                  ...s,
                  milestones: s.milestones.map((x) =>
                    x.id === m.id ? { ...x, description: e.target.value } : x,
                  ),
                })
              }
            />
            <label className="duration-label">
              Estimated working days
              <input
                type="number"
                min={1}
                max={365}
                value={m.days ?? ""}
                placeholder="TBD"
                onChange={(e) =>
                  set({
                    ...s,
                    milestones: s.milestones.map((x) =>
                      x.id === m.id
                        ? {
                            ...x,
                            days: e.target.value
                              ? Math.max(
                                  1,
                                  Math.min(
                                    365,
                                    Math.round(Number(e.target.value)),
                                  ),
                                )
                              : null,
                          }
                        : x,
                    ),
                  })
                }
              />
            </label>
          </article>
        ))}
        <button
          className="add-button"
          disabled={s.milestones.length >= 20}
          onClick={() =>
            set({
              ...s,
              milestones: [
                ...s.milestones,
                {
                  id: uid(),
                  title: "New milestone",
                  description: "",
                  days: null,
                },
              ],
            })
          }
        >
          <Plus size={15} /> Add a milestone
        </button>
      </div>
    );
  return (
    <div className="editor-section">
      <div className="section-title">
        <span className="section-icon">
          {section === "goals" ? (
            <Target size={20} />
          ) : section === "assumptions" ? (
            <Layers size={20} />
          ) : (
            <Ban size={20} />
          )}
        </span>
        <div>
          <h2>
            {section === "goals"
              ? "Keep the outcome in sight."
              : section === "assumptions"
                ? "Bring assumptions into the open."
                : "Draw a clear boundary."}
          </h2>
          <p>
            {section === "goals"
              ? "Review the goals taken from the brief."
              : section === "assumptions"
                ? "These are proposals to discuss, not agreed facts."
                : "Separate this project from a possible future phase."}
          </p>
        </div>
      </div>
      {list.map((item, i) => (
        <div className="simple-list-item" key={item.id}>
          <span className="number-label">{String(i + 1).padStart(2, "0")}</span>
          <label className="sr-only" htmlFor={`li-${item.id}`}>
            {listKey} item {i + 1}
          </label>
          <textarea
            id={`li-${item.id}`}
            className="text-input compact"
            value={item.text}
            maxLength={2000}
            onChange={(e) =>
              set({
                ...s,
                [listKey]: list.map((x) =>
                  x.id === item.id ? { ...x, text: e.target.value } : x,
                ),
              })
            }
          />
          <button
            className="icon-button"
            aria-label={`Delete ${listKey} item ${i + 1}`}
            onClick={() =>
              set({ ...s, [listKey]: list.filter((x) => x.id !== item.id) })
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        className="add-button"
        disabled={list.length >= 20}
        onClick={() =>
          set({ ...s, [listKey]: [...list, { id: uid(), text: "" }] })
        }
      >
        <Plus size={15} /> Add{" "}
        {section === "goals"
          ? "a goal"
          : section === "assumptions"
            ? "an assumption"
            : "an exclusion"}
      </button>
    </div>
  );
}
