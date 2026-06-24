import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", af: "Afrikaans", zu: "isiZulu", xh: "isiXhosa",
  fr: "French", es: "Spanish", pt: "Portuguese", de: "German",
  ar: "Arabic", zh: "Chinese", ja: "Japanese",
};

async function userLanguage(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("language").eq("id", userId).maybeSingle();
  const code = (data?.language as string | null) || "en";
  return LANGUAGE_NAMES[code] ?? "English";
}

function langRule(lang: string): string {
  return ` Respond in ${lang}. Never switch languages unless explicitly asked. Keep JSON keys in English; translate only string values.`;
}

async function callGateway(system: string, user: string, jsonMode = false): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Rate limit hit, please retry in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please upgrade.");
  if (!res.ok) throw new Error(`AI error: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/* ============== EMAIL ============== */
const EmailInput = z.object({
  recipient_type: z.string().min(1),
  tone: z.string().min(1),
  prompt: z.string().min(3).max(4000),
  language: z.string().default("en"),
});
export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    const lang = await userLanguage(context.supabase, context.userId);
    const raw = await callGateway(
      `You are an expert email writer.${langRule(lang)} Output strict JSON with keys: subject, body, cta, improvements. Body should be ready-to-send.`,
      `Recipient: ${data.recipient_type}\nTone: ${data.tone}\nGoal: ${data.prompt}`,
      true,
    );
    const parsed = safeJson(raw, { subject: "", body: raw, cta: "", improvements: "" });
    const { data: row } = await context.supabase.from("emails").insert({
      user_id: context.userId,
      recipient_type: data.recipient_type,
      tone: data.tone,
      prompt: data.prompt,
      subject: parsed.subject,
      body: parsed.body,
      cta: parsed.cta,
      improvements: parsed.improvements,
    }).select().single();
    return row ?? parsed;
  });

/* ============== MEETING ============== */
const MeetingInput = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().min(10).max(20000),
  language: z.string().default("en"),
});
export const analyzeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data, context }) => {
    const lang = await userLanguage(context.supabase, context.userId);
    const raw = await callGateway(
      `You are a meeting analyst.${langRule(lang)} Output strict JSON with keys: executive_summary (string), key_points (string[]), decisions (string[]), action_items (array of {task,owner,deadline}), efficiency_score (0-100 integer), efficiency_reason (string), was_necessary (boolean), alternative (string).`,
      `Meeting title: ${data.title}\nNotes:\n${data.notes}`,
      true,
    );
    const parsed = safeJson<any>(raw, { executive_summary: raw, key_points: [], decisions: [], action_items: [], efficiency_score: 50, efficiency_reason: "", was_necessary: true, alternative: "" });
    const { data: row } = await context.supabase.from("meetings").insert({
      user_id: context.userId,
      title: data.title,
      raw_notes: data.notes,
      summary: parsed,
      efficiency_score: parsed.efficiency_score ?? null,
    }).select().single();
    return row;
  });

/* ============== RESEARCH ============== */
const ResearchInput = z.object({
  topic: z.string().min(1).max(500),
  content: z.string().min(10).max(20000),
  language: z.string().default("en"),
});
export const runResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const lang = await userLanguage(context.supabase, context.userId);
    const raw = await callGateway(
      `You are an analyst.${langRule(lang)} Output strict JSON with keys: summary, key_insights (string[]), opportunities (string[]), risks (string[]), recommendations (string[]), executive_briefing (string), confidence ("low"|"medium"|"high").`,
      `Topic: ${data.topic}\nContent:\n${data.content}`,
      true,
    );
    const parsed = safeJson<any>(raw, { summary: raw, key_insights: [], opportunities: [], risks: [], recommendations: [], executive_briefing: "", confidence: "medium" });
    const { data: row } = await context.supabase.from("research_items").insert({
      user_id: context.userId,
      topic: data.topic,
      input_text: data.content,
      result: parsed,
    }).select().single();
    return row;
  });

/* ============== PRODUCTIVITY INSIGHTS ============== */
export const generateProductivityInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const lang = await userLanguage(sb, context.userId);
    const [{ data: tasks }, { data: meetings }, { data: emails }, { data: research }] = await Promise.all([
      sb.from("tasks").select("priority,status,due_date,estimated_minutes,created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("meetings").select("efficiency_score,created_at").order("created_at", { ascending: false }).limit(20),
      sb.from("emails").select("id,created_at").order("created_at", { ascending: false }).limit(30),
      sb.from("research_items").select("id,created_at").order("created_at", { ascending: false }).limit(20),
    ]);

    const summary = {
      tasks_total: tasks?.length ?? 0,
      tasks_done: tasks?.filter((t) => t.status === "done").length ?? 0,
      meetings_total: meetings?.length ?? 0,
      avg_meeting_efficiency: meetings?.length ? Math.round(meetings.reduce((a, m) => a + (m.efficiency_score ?? 50), 0) / meetings.length) : null,
      emails_total: emails?.length ?? 0,
      research_total: research?.length ?? 0,
    };

    const raw = await callGateway(
      `You are a workplace productivity coach.${langRule(lang)} Output strict JSON with keys: productivity_score (0-100 integer), burnout_risk ("low"|"medium"|"high"), hours_saved (number, conservative estimate of hours saved this week), insights (string[] of 3-5 concrete observations), recommendations (string[] of 3-5 concrete actions), focus_block_suggestion (string), confidence ("low"|"medium"|"high"). Be specific, kind, and reference the user's actual numbers.`,
      `Activity summary:\n${JSON.stringify(summary, null, 2)}`,
      true,
    );
    const parsed = safeJson<any>(raw, { productivity_score: 70, burnout_risk: "low", hours_saved: 0, insights: [], recommendations: [], focus_block_suggestion: "", confidence: "medium" });

    await sb.from("productivity_logs").upsert({
      user_id: context.userId,
      log_date: new Date().toISOString().slice(0, 10),
      productivity_score: parsed.productivity_score,
      tasks_completed: summary.tasks_done,
      meetings_count: summary.meetings_total,
      emails_generated: summary.emails_total,
      research_count: summary.research_total,
      hours_saved: parsed.hours_saved,
      burnout_risk: parsed.burnout_risk,
      insights: parsed,
    }, { onConflict: "user_id,log_date" });

    return { ...parsed, summary };
  });

/* ============== TASK BREAKDOWN ============== */
const PlanInput = z.object({
  goal: z.string().min(3).max(2000),
  language: z.string().default("en"),
});
export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const lang = await userLanguage(context.supabase, context.userId);
    const raw = await callGateway(
      `You break large goals into actionable tasks using the Eisenhower matrix.${langRule(lang)} Output strict JSON: { tasks: [{ title, description, priority ("critical"|"high"|"medium"|"low"), estimated_minutes (int) }] } — 3 to 7 tasks.`,
      data.goal,
      true,
    );
    const parsed = safeJson<{ tasks: Array<{ title: string; description?: string; priority: "critical"|"high"|"medium"|"low"; estimated_minutes?: number }> }>(raw, { tasks: [] });
    if (parsed.tasks.length) {
      await context.supabase.from("tasks").insert(parsed.tasks.map((t) => ({
        user_id: context.userId,
        title: t.title,
        description: t.description ?? null,
        priority: t.priority,
        estimated_minutes: t.estimated_minutes ?? null,
      })));
    }
    return parsed;
  });

/* ============== OPTIMIZE PROMPT ============== */
export const optimizePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ prompt: z.string().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const raw = await callGateway(
      "You rewrite user prompts to be clearer, more specific, and produce better AI output. Return only the optimized prompt, no commentary.",
      data.prompt,
    );
    return { original: data.prompt, optimized: raw.trim() };
  });