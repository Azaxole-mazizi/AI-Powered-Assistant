import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, MessageSquare, ListTodo, CalendarClock, Mail, FileSearch,
  BarChart3, History as HistoryIcon, Settings as SettingsIcon, LogOut, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/chat", key: "chat", icon: MessageSquare },
  { to: "/tasks", key: "tasks", icon: ListTodo },
  { to: "/meetings", key: "meetings", icon: CalendarClock },
  { to: "/email", key: "email", icon: Mail },
  { to: "/research", key: "research", icon: FileSearch },
  { to: "/reports", key: "reports", icon: BarChart3 },
  { to: "/history", key: "history", icon: HistoryIcon },
  { to: "/settings", key: "settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success(t("common.signedOut"));
    nav({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-base font-semibold tracking-tight">{t("app.name")}</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = loc.pathname === item.to || (item.to !== "/dashboard" && loc.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 rounded-lg bg-gradient-primary p-3 text-primary-foreground shadow-elegant">
            <div className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5" /> {t("common.aiPowered")}</div>
            <p className="mt-1 text-xs opacity-90">{t("common.aiPoweredDesc")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> {t("common.signOut")}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}