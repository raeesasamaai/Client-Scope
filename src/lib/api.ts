import { planBrief } from "./planner";
import { scopeSchema } from "./model";
export async function analyse(brief: string, signal: AbortSignal) {
  try {
    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(14000)]),
    });
    if (!res.ok) throw new Error("Analysis unavailable");
    const data = await res.json();
    return scopeSchema.parse(data.scope);
  } catch (error) {
    if (signal.aborted) throw error;
    return planBrief(brief);
  }
}
