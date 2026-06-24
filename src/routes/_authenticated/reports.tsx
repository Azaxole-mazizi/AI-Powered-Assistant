import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProductivityLogs } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Productivity Reports — ConnectSmart AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const fn = useServerFn(listProductivityLogs);
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => fn() });

  const chart = [...logs].reverse().map((l: any) => ({
    date: new Date(l.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: l.productivity_score ?? 0,
    hours: Number(l.hours_saved ?? 0),
    tasks: l.tasks_completed ?? 0,
    meetings: l.meetings_count ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <PageHeader title={t("pages.reports.title")} description={t("pages.reports.desc")} />

      {chart.length === 0 ? (
        <Card className="mt-6"><CardContent className="p-12 text-center text-sm text-muted-foreground">No reports yet — generate insights from the Dashboard.</CardContent></Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Productivity score</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11}/>
                  <YAxis domain={[0,100]} stroke="var(--muted-foreground)" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}/>
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} fill="url(#g)"/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hours saved</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11}/>
                  <YAxis stroke="var(--muted-foreground)" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}/>
                  <Bar dataKey="hours" fill="var(--primary-glow)" radius={6}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Activity volume</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11}/>
                  <YAxis stroke="var(--muted-foreground)" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}/>
                  <Bar dataKey="tasks" stackId="a" fill="var(--primary)" radius={[0,0,6,6]}/>
                  <Bar dataKey="meetings" stackId="a" fill="var(--chart-3)" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      <AIDisclaimer />
    </div>
  );
}