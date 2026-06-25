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
import { useTranslation } from "react-i18next";
import { applyLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ConnectSmart AI" }, { name: "description", content: "Manage your ConnectSmart profile, language, theme, working hours, notifications and productivity goal preferences." }, { property: "og:title", content: "Settings — ConnectSmart AI" }, { property: "og:description", content: "Manage your ConnectSmart profile, language, theme, working hours, notifications and productivity goal preferences." }] }),
  component: SettingsPage,
});

function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  useEffect(() => { if (form.theme) applyTheme(form.theme); }, [form.theme]);
  // Live-preview language change without waiting for save.
  useEffect(() => { if (form.language) applyLanguage(form.language); }, [form.language]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => {
      if (form.language) applyLanguage(form.language);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profile", "language"] });
      toast.success(t("settings.saved"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  function setField(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("settings.profileCard")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>{t("settings.fullName")}</Label><Input value={form.full_name ?? ""} onChange={(e) => setField("full_name", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{t("settings.timezone")}</Label><Input value={form.timezone ?? ""} onChange={(e) => setField("timezone", e.target.value)} placeholder="UTC"/></div>
              <div className="space-y-1.5"><Label>{t("settings.language")}</Label>
                <Select value={form.language ?? "en"} onValueChange={(v) => setField("language", v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{SUPPORTED_LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("settings.themeCard")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>{t("settings.appearance")}</Label>
              <Select value={form.theme ?? "system"} onValueChange={(v) => setField("theme", v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("settings.colorTheme")}</Label>
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
              <p className="text-xs text-muted-foreground">{t("settings.colorThemeHelp")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("settings.workGoalsCard")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{t("settings.workStart")}</Label><Input type="time" value={form.work_hours_start ?? "09:00"} onChange={(e) => setField("work_hours_start", e.target.value)}/></div>
              <div className="space-y-1.5"><Label>{t("settings.workEnd")}</Label><Input type="time" value={form.work_hours_end ?? "17:00"} onChange={(e) => setField("work_hours_end", e.target.value)}/></div>
            </div>
            <div className="space-y-1.5"><Label>{t("settings.productivityGoal")}</Label>
              <Textarea rows={3} value={form.productivity_goal ?? ""} onChange={(e) => setField("productivity_goal", e.target.value)} placeholder={t("settings.productivityGoalPlaceholder")}/>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">{t("settings.notifications")}</p><p className="text-xs text-muted-foreground">{t("settings.notificationsDesc")}</p></div>
              <Switch checked={form.notifications_enabled ?? true} onCheckedChange={(v) => setField("notifications_enabled", v)}/>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-primary text-primary-foreground shadow-elegant">
          {save.isPending ? t("common.saving") : t("settings.savePrefs")}
        </Button>
      </div>
    </div>
  );
}