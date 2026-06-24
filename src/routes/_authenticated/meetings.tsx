import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMeeting } from "@/lib/ai.functions";
import { listMeetings } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meeting Intelligence — ConnectSmart AI" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const listFn = useServerFn(listMeetings);
  const analyzeFn = useServerFn(analyzeMeeting);

  const { data: meetings = [] } = useQuery({ queryKey: ["meetings"], queryFn: () => listFn() });

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const analyze = useMutation({
    mutationFn: () => analyzeFn({ data: { title, notes } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meetings"] }); setTitle(""); setNotes(""); toast.success("Meeting analyzed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <PageHeader title={t("pages.meetings.title")} description={t("pages.meetings.desc")} />

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Analyze a meeting</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Paste meeting notes or a transcript…" rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={() => analyze.mutate()} disabled={!title.trim() || notes.length < 10 || analyze.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="mr-2 h-4 w-4" /> {analyze.isPending ? "Analyzing…" : "Analyze meeting"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Recent meetings</h2>
        {meetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings analyzed yet.</p>}
        {meetings.map((m: any) => {
          const s = m.summary ?? {};
          return (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-primary/10 text-primary">Efficiency: {m.efficiency_score ?? "—"}/100</Badge>
                    {s.was_necessary === false && <Badge variant="outline" className="ml-2 bg-warning/10 text-warning">Could be email</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {s.executive_summary && <p className="text-muted-foreground">{s.executive_summary}</p>}
                {!!s.key_points?.length && (
                  <div><p className="text-xs font-semibold uppercase text-muted-foreground">Key points</p>
                    <ul className="mt-1 space-y-0.5">{s.key_points.map((k: string, i: number) => <li key={i}>• {k}</li>)}</ul></div>
                )}
                {!!s.decisions?.length && (
                  <div><p className="text-xs font-semibold uppercase text-muted-foreground">Decisions</p>
                    <ul className="mt-1 space-y-0.5">{s.decisions.map((k: string, i: number) => <li key={i}>✓ {k}</li>)}</ul></div>
                )}
                {!!s.action_items?.length && (
                  <div><p className="text-xs font-semibold uppercase text-muted-foreground">Action items</p>
                    <ul className="mt-1 space-y-1">{s.action_items.map((a: any, i: number) => (
                      <li key={i} className="rounded-md bg-accent/40 p-2">
                        <span className="font-medium">{a.task}</span>
                        {a.owner && <span className="ml-2 text-xs text-muted-foreground">@{a.owner}</span>}
                        {a.deadline && <span className="ml-2 text-xs text-muted-foreground">· due {a.deadline}</span>}
                      </li>
                    ))}</ul></div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <AIDisclaimer />
    </div>
  );
}