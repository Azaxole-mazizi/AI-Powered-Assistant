import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTask, deleteTask, listTasks, updateTask } from "@/lib/data.functions";
import { planTasks } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Task Planner — ConnectSmart AI" }] }),
  component: TasksPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

function TasksPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTasks);
  const createFn = useServerFn(createTask);
  const updateFn = useServerFn(updateTask);
  const deleteFn = useServerFn(deleteTask);
  const planFn = useServerFn(planTasks);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [goal, setGoal] = useState("");

  const create = useMutation({
    mutationFn: () => createFn({ data: { title, priority } }),
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "todo"|"in_progress"|"done" }) => updateFn({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const plan = useMutation({
    mutationFn: () => planFn({ data: { goal } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Added ${res.tasks?.length ?? 0} tasks`);
      setGoal("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const buckets = {
    critical: tasks.filter((t: any) => t.priority === "critical"),
    high: tasks.filter((t: any) => t.priority === "high"),
    medium: tasks.filter((t: any) => t.priority === "medium"),
    low: tasks.filter((t: any) => t.priority === "low"),
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <PageHeader title="Task Planner" description="Eisenhower matrix-style prioritisation with AI breakdown." />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Add a task</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex gap-2">
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => create.mutate()} disabled={!title.trim()} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4"/>Add</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary"/>AI breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Describe a goal or project — AI will create prioritised tasks." value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} />
            <Button onClick={() => plan.mutate()} disabled={!goal.trim() || plan.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
              {plan.isPending ? "Planning…" : "Generate task plan"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(["critical","high","medium","low"] as const).map((p) => (
          <Card key={p}>
            <CardHeader className="pb-2"><CardTitle className="text-sm capitalize">{p} <Badge variant="outline" className="ml-1">{buckets[p].length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {buckets[p].length === 0 && <p className="text-xs text-muted-foreground">No tasks</p>}
              {buckets[p].map((t: any) => (
                <div key={t.id} className="group flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
                  <Checkbox checked={t.status === "done"} onCheckedChange={(v) => update.mutate({ id: t.id, status: v ? "done" : "todo" })} className="mt-0.5" />
                  <div className="flex-1">
                    <p className={`text-sm ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                    {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[p]}`}>{p}</Badge>
                      {t.estimated_minutes && <span className="text-[10px] text-muted-foreground">{t.estimated_minutes}m</span>}
                    </div>
                  </div>
                  <button onClick={() => del.mutate(t.id)} className="opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive"/></button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <AIDisclaimer />
    </div>
  );
}