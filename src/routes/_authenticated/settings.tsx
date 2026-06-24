import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateProfile } from "@/lib/data.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ConnectSmart AI" }] }),
  component: SettingsPage,
});

const LANGUAGES = [
  ["en","English"],["fr","Français"],["es","Español"],["pt","Português"],
  ["de","Deutsch"],["ar","العربية"],["zh","中文"],["ja","日本語"],
  ["zu","isiZulu"],["xh","isiXhosa"],["af","Afrikaans"],
] as const;

function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

function SettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  useEffect(() => { if (form.theme) applyTheme(form.theme); }, [form.theme]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Preferences saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  function setField(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <PageHeader title="Settings" description="Customize your ConnectSmart AI workspace." />
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input value={form.full_name ?? ""} onChange={(e) => setField("full_name", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Timezone</Label><Input value={form.timezone ?? ""} onChange={(e) => setField("timezone", e.target.value)} placeholder="UTC"/></div>
              <div className="space-y-1.5"><Label>Language</Label>
                <Select value={form.language ?? "en"} onValueChange={(v) => setField("language", v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{LANGUAGES.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Appearance</Label>
              <Select value={form.theme ?? "system"} onValueChange={(v) => setField("theme", v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Color theme</Label>
              <Select value={form.color_theme ?? "green"} onValueChange={(v) => setField("color_theme", v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green Productivity (default)</SelectItem>
                  <SelectItem value="blue">Blue Professional</SelectItem>
                  <SelectItem value="purple">Purple AI</SelectItem>
                  <SelectItem value="orange">Orange Energy</SelectItem>
                  <SelectItem value="black">Black Executive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Saved with your profile (Green is fully styled).</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Work & goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Work start</Label><Input type="time" value={form.work_hours_start ?? "09:00"} onChange={(e) => setField("work_hours_start", e.target.value)}/></div>
              <div className="space-y-1.5"><Label>Work end</Label><Input type="time" value={form.work_hours_end ?? "17:00"} onChange={(e) => setField("work_hours_end", e.target.value)}/></div>
            </div>
            <div className="space-y-1.5"><Label>Productivity goal</Label>
              <Textarea rows={3} value={form.productivity_goal ?? ""} onChange={(e) => setField("productivity_goal", e.target.value)} placeholder="e.g. Ship the Q3 launch with under 2 hours of meetings per day."/>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Notifications</p><p className="text-xs text-muted-foreground">Email digests and burnout warnings.</p></div>
              <Switch checked={form.notifications_enabled ?? true} onCheckedChange={(v) => setField("notifications_enabled", v)}/>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
          {save.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </div>
  );
}