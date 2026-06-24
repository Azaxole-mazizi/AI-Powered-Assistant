import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runResearch } from "@/lib/ai.functions";
import { listResearch } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — ConnectSmart AI" }] }),
  component: ResearchPage,
});

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5">{items.map((i, idx) => <li key={idx}>• {i}</li>)}</ul>
    </div>
  );
}

function ResearchPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const listFn = useServerFn(listResearch);
  const runFn = useServerFn(runResearch);

  const { data: items = [] } = useQuery({ queryKey: ["research"], queryFn: () => listFn() });

  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");

  const go = useMutation({
    mutationFn: () => runFn({ data: { topic, content } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["research"] }); setTopic(""); setContent(""); toast.success("Research complete"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <PageHeader title={t("pages.research.title")} description={t("pages.research.desc")} />
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Analyze content</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Topic or document title" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Textarea placeholder="Paste the article, report or notes to analyze…" rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={() => go.mutate()} disabled={!topic || content.length < 10 || go.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <FileSearch className="mr-2 h-4 w-4"/> {go.isPending ? "Analyzing…" : "Run analysis"}
          </Button>
        </CardContent>
      </Card>
      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Recent research</h2>
        {items.length === 0 && <p className="text-sm text-muted-foreground">No research yet.</p>}
        {items.map((r: any) => {
          const res = r.result ?? {};
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{r.topic}</CardTitle>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  {res.confidence && <Badge variant="outline" className="capitalize">Confidence: {res.confidence}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {res.summary && <p className="text-muted-foreground">{res.summary}</p>}
                <Section title="Key insights" items={res.key_insights} />
                <Section title="Opportunities" items={res.opportunities} />
                <Section title="Risks" items={res.risks} />
                <Section title="Recommendations" items={res.recommendations} />
                {res.executive_briefing && (
                  <div className="rounded-lg bg-primary/10 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase text-primary">Executive briefing</p>
                    <p className="mt-1">{res.executive_briefing}</p>
                  </div>
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