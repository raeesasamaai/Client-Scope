import type { ScopeDoc } from "../lib/model";
import { readiness } from "../lib/model";
export default function Preview({ doc }: { doc: ScopeDoc }) {
  const s = doc.scope;
  if (!s) return null;
  return (
    <article className="document-preview" id="print-document">
      <div className="document-letterhead">
        <span>CLIENTSCOPE / PROJECT SCOPE</span>
        <span>
          {doc.ready && readiness(doc).percent === 100
            ? "READY FOR CLIENT REVIEW"
            : "WORKING DRAFT"}
        </span>
      </div>
      <h1>{doc.title || "Untitled project"}</h1>
      <div className="document-meta">
        <span>
          Prepared for <strong>{doc.client || "Client to be confirmed"}</strong>
        </span>
        <span>{new Date(doc.updatedAt).toLocaleDateString("en-ZA")}</span>
      </div>
      <p className="document-summary">{s.summary}</p>
      {s.goals.length > 0 && (
        <section>
          <h2>01 / Project goals</h2>
          <ul>
            {s.goals.map((g) => (
              <li key={g.id}>{g.text}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2>02 / Deliverables</h2>
        {s.deliverables.map((d, i) => (
          <div className="preview-deliverable" key={d.id}>
            <h3>
              {i + 1}. {d.title}
              <small>{d.confirmed ? "Reviewed" : "Proposed"}</small>
            </h3>
            <p>{d.description}</p>
            <div className="acceptance">
              <strong>Acceptance criteria</strong>
              <p>{d.criteria || "To be defined."}</p>
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2>03 / Questions & decisions</h2>
        {s.questions.map((q) => (
          <div className="preview-question" key={q.id}>
            <h3>
              {q.text}
              {q.required && <small>Essential</small>}
            </h3>
            <p>{q.answer || "To be confirmed with the client."}</p>
          </div>
        ))}
      </section>
      <section className="preview-columns">
        <div>
          <h2>04 / Proposed assumptions</h2>
          <ul>
            {s.assumptions.map((a) => (
              <li key={a.id}>{a.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>05 / Exclusions & future work</h2>
          <ul>
            {s.exclusions.map((a) => (
              <li key={a.id}>{a.text}</li>
            ))}
          </ul>
        </div>
      </section>
      <section>
        <h2>06 / Proposed milestones</h2>
        {s.milestones.map((m, i) => (
          <div className="preview-milestone" key={m.id}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{m.title}</h3>
              <p>{m.description}</p>
            </div>
            <small>
              {m.days
                ? `${m.days} working days · estimate`
                : "Duration to be agreed"}
            </small>
          </div>
        ))}
      </section>
      <div className="document-disclaimer">
        Prepared with ClientScope. This is a planning document, not a signed
        agreement. Costs, dates, responsibilities and third-party services
        require confirmation.
      </div>
    </article>
  );
}
