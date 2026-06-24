import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ConnectSmart AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.welcomeBack"));
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: String(fd.get("name") ?? "") },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.accountCreated"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-primary lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-primary-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-xl font-semibold">{t("app.name")}</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">{t("auth.heroTitle")}</h2>
          <p className="mt-4 max-w-md opacity-90">{t("auth.heroDesc")}</p>
        </div>
        <p className="text-sm opacity-70">{t("common.reviewDisclaimer")}</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
            <span className="font-display text-lg font-semibold">{t("app.name")}</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("auth.signIn")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.hint")}</p>
          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.createAccount")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-1.5"><Label htmlFor="si-email">{t("auth.email")}</Label><Input id="si-email" name="email" type="email" required autoComplete="email" /></div>
                <div className="space-y-1.5"><Label htmlFor="si-pw">{t("auth.password")}</Label><Input id="si-pw" name="password" type="password" required autoComplete="current-password" /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant">{loading ? t("auth.signInLoading") : t("auth.signIn")}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-1.5"><Label htmlFor="su-name">{t("auth.fullName")}</Label><Input id="su-name" name="name" type="text" required /></div>
                <div className="space-y-1.5"><Label htmlFor="su-email">{t("auth.email")}</Label><Input id="su-email" name="email" type="email" required autoComplete="email" /></div>
                <div className="space-y-1.5"><Label htmlFor="su-pw">{t("auth.password")}</Label><Input id="su-pw" name="password" type="password" minLength={6} required autoComplete="new-password" /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant">{loading ? t("auth.createLoading") : t("auth.createAccount")}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}