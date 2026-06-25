import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail, optimizePrompt } from "@/lib/ai.functions";
import { listEmails } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Email Generator — ConnectSmart AI" }, { name: "description", content: "Draft professional emails in any tone — client, team, manager — with AI-optimised structure and language for faster replies." }, { property: "og:title", content: "Email Generator — ConnectSmart AI" }, { property: "og:description", content: "Draft professional emails in any tone — client, team, manager — with AI-optimised structure and language for faster replies." }] }),
  component: EmailPage,
});

const RECIPIENTS = ["Client", "Team", "Manager", "Sales outreach", "Customer support", "Follow-up"];
const TONES = ["Formal", "Informal", "Friendly", "Persuasive", "Professional", "Executive"];

function EmailPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const listFn = useServerFn(listEmails);
  const genFn = useServerFn(generateEmail);
  const optFn = useServerFn(optimizePrompt);

  const { data: emails = [] } = useQuery({ queryKey: ["emails"], queryFn: () => listFn() });

  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [tone, setTone] = useState(TONES[4]);
  const [prompt, setPrompt] = useState("");
  const [optimized, setOptimized] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: () => genFn({ data: { recipient_type: recipient, tone, prompt } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emails"] }); setPrompt(""); setOptimized(null); toast.success("Email drafted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const optimize = useMutation({
    mutationFn: () => optFn({ data: { prompt } }),
    onSuccess: (res: any) => { setOptimized(res.optimized); setPrompt(res.optimized); toast.success("Prompt optimized"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <PageHeader title={t("pages.email.title")} description={t("pages.email.desc")} />

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">New email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger><SelectValue placeholder="Recipient" /></SelectTrigger>
              <SelectContent>{RECIPIENTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue placeholder="Tone" /></SelectTrigger>
              <SelectContent>{TONES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea placeholder="What is this email about? Include key facts." rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          {optimized && <p className="text-xs text-muted-foreground"><strong className="text-foreground">Optimized:</strong> {optimized}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generate.mutate()} disabled={!prompt.trim() || generate.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="mr-2 h-4 w-4"/> {generate.isPending ? "Drafting…" : "Generate email"}
            </Button>
            <Button onClick={() => optimize.mutate()} disabled={!prompt.trim() || optimize.isPending} variant="outline">
              <Wand2 className="mr-2 h-4 w-4"/> Optimize prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Recent drafts</h2>
        {emails.length === 0 && <p className="text-sm text-muted-foreground">No drafts yet.</p>}
        {emails.map((e: any) => (
          <Card key={e.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{e.subject || "(no subject)"}</CardTitle>
                  <p className="text-xs text-muted-foreground">{e.recipient_type} · {e.tone} · {new Date(e.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`${e.subject}\n\n${e.body}`); toast.success("Copied"); }}>
                  <Copy className="h-4 w-4"/>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <pre className="whitespace-pre-wrap font-sans">{e.body}</pre>
              {e.cta && <p className="text-xs text-muted-foreground"><strong className="text-foreground">CTA:</strong> {e.cta}</p>}
              {e.improvements && <p className="text-xs text-muted-foreground"><strong className="text-foreground">Suggested improvements:</strong> {e.improvements}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <AIDisclaimer />
    </div>
  );
}