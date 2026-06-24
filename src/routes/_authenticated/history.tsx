import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmails, listMeetings, listResearch, listThreads } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mail, CalendarClock, FileSearch } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — ConnectSmart AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [q, setQ] = useState("");
  const tFn = useServerFn(listThreads);
  const eFn = useServerFn(listEmails);
  const mFn = useServerFn(listMeetings);
  const rFn = useServerFn(listResearch);
  const { data: threads = [] } = useQuery({ queryKey: ["threads"], queryFn: () => tFn() });
  const { data: emails = [] } = useQuery({ queryKey: ["emails"], queryFn: () => eFn() });
  const { data: meetings = [] } = useQuery({ queryKey: ["meetings"], queryFn: () => mFn() });
  const { data: research = [] } = useQuery({ queryKey: ["research"], queryFn: () => rFn() });

  const f = (s?: string) => !q || (s ?? "").toLowerCase().includes(q.toLowerCase());

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <PageHeader title="History" description="Every conversation, draft, and analysis in one place." />
      <Input className="mt-6 max-w-md" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Tabs defaultValue="chats" className="mt-6">
        <TabsList>
          <TabsTrigger value="chats"><MessageSquare className="mr-1 h-4 w-4"/>Chats</TabsTrigger>
          <TabsTrigger value="emails"><Mail className="mr-1 h-4 w-4"/>Emails</TabsTrigger>
          <TabsTrigger value="meetings"><CalendarClock className="mr-1 h-4 w-4"/>Meetings</TabsTrigger>
          <TabsTrigger value="research"><FileSearch className="mr-1 h-4 w-4"/>Research</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="mt-4 space-y-2">
          {threads.filter((t: any) => f(t.title)).map((t: any) => (
            <Link key={t.id} to="/chat/$threadId" params={{ threadId: t.id }}>
              <Card className="transition hover:shadow-elegant"><CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{t.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString()}</span>
              </CardContent></Card>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="emails" className="mt-4 space-y-2">
          {emails.filter((e: any) => f(e.subject) || f(e.prompt)).map((e: any) => (
            <Card key={e.id}><CardContent className="p-4">
              <p className="font-medium">{e.subject || "(no subject)"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{e.recipient_type} · {e.tone} · {new Date(e.created_at).toLocaleString()}</p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.body}</p>
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="meetings" className="mt-4 space-y-2">
          {meetings.filter((m: any) => f(m.title)).map((m: any) => (
            <Card key={m.id}><CardContent className="p-4">
              <p className="font-medium">{m.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.summary?.executive_summary}</p>
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="research" className="mt-4 space-y-2">
          {research.filter((r: any) => f(r.topic)).map((r: any) => (
            <Card key={r.id}><CardContent className="p-4">
              <p className="font-medium">{r.topic}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.result?.summary}</p>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}