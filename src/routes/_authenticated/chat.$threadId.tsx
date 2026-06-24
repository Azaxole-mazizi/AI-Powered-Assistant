import { createFileRoute, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getThreadMessages } from "@/lib/data.functions";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: () => {
    const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
    return <ChatThread key={threadId} threadId={threadId} />;
  },
});

function ChatThread({ threadId }: { threadId: string }) {
  const fetchMessages = useServerFn(getThreadMessages);
  const { data: initial = [] } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => fetchMessages({ data: { threadId } }),
  });

  return <ChatInner threadId={threadId} initial={initial as UIMessage[]} />;
}

function ChatInner({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { threadId },
    prepareSendMessagesRequest: async ({ messages, body }) => {
      const { data } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
      return {
        body: { messages, threadId, ...(body ?? {}) },
        headers,
      };
    },
  });

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initial,
    transport,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { taRef.current?.focus(); }, [threadId, status]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    void sendMessage({ text });
    setInput("");
  }

  const loading = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-border bg-gradient-surface p-8 text-center">
              <img src={logo} alt="" width={48} height={48} className="mx-auto h-12 w-12" />
              <h2 className="mt-3 font-display text-xl font-semibold">How can I help you today?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try: "Plan my Monday around 3 client calls and a launch deadline."</p>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div className={isUser ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm" : "max-w-[85%] text-foreground"}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm">{text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-li:my-0.5 prose-headings:font-display">
                      <ReactMarkdown>{text || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Sparkles className="h-4 w-4 animate-pulse" /></div>
              <span className="animate-pulse">Thinking…</span>
            </div>
          )}
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error.message}</div>}
        </div>
      </div>
      <form onSubmit={submit} className="border-t border-border bg-background/80 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
            placeholder="Message ConnectSmart AI…"
            rows={1}
            className="min-h-[44px] resize-none"
          />
          <Button type="submit" disabled={!input.trim() || loading} className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">AI outputs should be reviewed before business decisions.</p>
      </form>
    </div>
  );
}