import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateProductivityInsights } from "@/lib/ai.functions";
import { listTasks, listMeetings, listEmails, listResearch, listProductivityLogs } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, CalendarClock, Mail, FileSearch, Activity, AlertTriangle, Clock } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ConnectSmart AI" }] }),
  component: Dashboard,
});

function riskColor(r?: string | null) {
  if (r === "high") return "bg-destructive/15 text-destructive border-destructive/30";
  if (r === "medium") return "bg-warning/15 text-warning border-warning/30";
  return "bg-success/15 text-success border-success/30";
}

function Dashboard() {
  const qc = useQueryClient();
  const tasksFn = useServerFn(listTasks);
  const meetingsFn = useServerFn(listMeetings);
  const emailsFn = useServerFn(listEmails);
  const researchFn = useServerFn(listResearch);
  const logsFn = useServerFn(listProductivityLogs);
  const insightsFn = useServerFn(generateProductivityInsights);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => tasksFn() });
  const { data: meetings = [] } = useQuery({ queryKey: ["meetings"], queryFn: () => meetingsFn() });
  const { data: emails = [] } = useQuery({ queryKey: ["emails"], queryFn: () => emailsFn() });
  const { data: research = [] } = useQuery({ queryKey: ["research"], queryFn: () => researchFn() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => logsFn() });

  const latest: any = logs[0];
  const score = latest?.productivity_score ?? 0;
  const insights = latest?.insights ?? null;

  const generate = useMutation({
    mutationFn: () => insightsFn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logs"] }); toast.success("Insights refreshed"); },
    onError: (e: any) => toast.error(e.message),
  });

  const chartData = [...logs].reverse().map((l: any) => ({
    date: new Date(l.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: l.productivity_score ?? 0,
  }));

  const tasksDone = tasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <PageHeader
        title="Welcome back"
        description="Your AI-powered productivity overview."
        action={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="mr-2 h-4 w-4" /> {generate.isPending ? "Analyzing…" : "Generate insights"}
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Productivity Score</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-4xl font-bold text-gradient">{score}<span className="text-xl text-muted-foreground">/100</span></div>
            <Progress value={score} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <StatCard icon={CheckCircle2} label="Tasks completed" value={tasksDone} hint={`${tasks.length} total`} />
        <StatCard icon={CalendarClock} label="Meetings analyzed" value={meetings.length} />
        <StatCard icon={Mail} label="Emails generated" value={emails.length} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileSearch} label="Research requests" value={research.length} />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hours saved (est.)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 font-display text-3xl font-semibold"><Clock className="h-6 w-6 text-primary" /> {latest?.hours_saved ?? 0}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Burnout risk</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="outline" className={`text-sm capitalize ${riskColor(latest?.burnout_risk)}`}>
              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {latest?.burnout_risk ?? "low"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Productivity trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet — generate your first insight.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> AI insights</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!insights ? (
              <p className="text-muted-foreground">Click <strong>Generate insights</strong> to get coaching tailored to your activity.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insights</p>
                  <ul className="mt-1 space-y-1">{(insights.insights ?? []).map((i: string, idx: number) => <li key={idx}>• {i}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendations</p>
                  <ul className="mt-1 space-y-1">{(insights.recommendations ?? []).map((i: string, idx: number) => <li key={idx}>→ {i}</li>)}</ul>
                </div>
                {insights.focus_block_suggestion && (
                  <div className="rounded-lg bg-primary/10 p-3 text-primary"><strong>Focus block:</strong> {insights.focus_block_suggestion}</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 font-display text-3xl font-semibold"><Icon className="h-6 w-6 text-primary" /> {value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}