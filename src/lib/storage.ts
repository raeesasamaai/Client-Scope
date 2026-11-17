import {
  workspaceSchema,
  type Workspace,
  documentSchema,
  type ScopeDoc,
} from "./model";
export const KEY = "clientscope:workspace:v1";
export function readWorkspace(): { workspace: Workspace; warning: string } {
  try {
    const raw = localStorage.getItem(KEY);
    return {
      workspace: raw
        ? workspaceSchema.parse(JSON.parse(raw))
        : { version: 1, documents: [] },
      warning: "",
    };
  } catch {
    return {
      workspace: { version: 1, documents: [] },
      warning:
        "Your saved workspace could not be read. Export any available work before replacing browser data.",
    };
  }
}
export function persist(workspace: Workspace) {
  try {
    localStorage.setItem(KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}
export function importDocument(raw: string): ScopeDoc {
  if (raw.length > 250000)
    throw new Error(
      "This file is too large. Import a scope smaller than 250 KB.",
    );
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a ClientScope JSON export.",
    );
  }
  const container = parsed as { document?: unknown } | null;
  const result = documentSchema.safeParse(container?.document ?? parsed);
  if (!result.success)
    throw new Error(
      "This file is not a valid ClientScope export. Your existing scopes have not changed.",
    );
  const doc = result.data;
  const scope = doc.scope
    ? {
        ...doc.scope,
        deliverables: doc.scope.deliverables.map((x) => ({
          ...x,
          id: crypto.randomUUID(),
        })),
        questions: doc.scope.questions.map((x) => ({
          ...x,
          id: crypto.randomUUID(),
        })),
        milestones: doc.scope.milestones.map((x) => ({
          ...x,
          id: crypto.randomUUID(),
        })),
        goals: doc.scope.goals.map((x) => ({ ...x, id: crypto.randomUUID() })),
        assumptions: doc.scope.assumptions.map((x) => ({
          ...x,
          id: crypto.randomUUID(),
        })),
        exclusions: doc.scope.exclusions.map((x) => ({
          ...x,
          id: crypto.randomUUID(),
        })),
      }
    : null;
  return {
    ...doc,
    scope,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
    ready: false,
  };
}
