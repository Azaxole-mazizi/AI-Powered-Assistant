import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", af: "Afrikaans", zu: "isiZulu", xh: "isiXhosa",
  fr: "French", es: "Spanish", pt: "Portuguese", de: "German",
  ar: "Arabic", zh: "Chinese", ja: "Japanese",
};

const BASE_PROMPT = `You are ConnectSmart AI, a warm, sharp workplace productivity coach inside a SaaS app. You help with task planning, meeting prep, email drafting, research synthesis, and burnout prevention.

Rules:
- Be concise and practical. Use short paragraphs and bullet points.
- Never fabricate facts. If unsure, say so and suggest how to verify.
- Acknowledge confidence levels when relevant.
- End substantive answers with a short "Next actions" list when appropriate.
- Remind users (when relevant) to review AI outputs before business decisions.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.replace("Bearer ", "");

        const sbUrl = process.env.SUPABASE_URL!;
        const sbKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(sbUrl, sbKey, {
          global: { headers: { Authorization: `Bearer ${token}`, apikey: sbKey } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
        if (claimErr || !claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });
        const userId = claims.claims.sub;

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages ?? [];
        const threadId = body.threadId;
        if (!Array.isArray(messages) || !threadId) return new Response("Bad request", { status: 400 });

        const { data: thread } = await supabase.from("threads").select("id,title").eq("id", threadId).maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        // Read the user's preferred language so the model always responds in it.
        const { data: profile } = await supabase.from("profiles").select("language").eq("id", userId).maybeSingle();
        const langCode = (profile?.language as string | null) || "en";
        const langName = LANGUAGE_NAMES[langCode] ?? "English";
        const SYSTEM_PROMPT = `${BASE_PROMPT}\n- Always respond in ${langName} (${langCode}). Never switch languages unless the user explicitly asks.`;

        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as any,
            client_id: lastUser.id,
          });
        }
        if (thread.title === "New conversation" && lastUser) {
          const text = (lastUser.parts as any[]).map((p) => (p.type === "text" ? p.text : "")).join(" ").slice(0, 60).trim();
          if (text) await supabase.from("threads").update({ title: text }).eq("id", threadId);
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
            if (assistant) {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as any,
                client_id: assistant.id,
              });
              await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
            }
          },
        });
      },
    },
  },
});