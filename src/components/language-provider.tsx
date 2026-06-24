import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/data.functions";
import { supabase } from "@/integrations/supabase/client";
import { applyLanguage } from "@/lib/i18n";
import { useState } from "react";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const getFn = useServerFn(getProfile);

  // Restore cached language immediately on mount (works for public routes too).
  useEffect(() => {
    try {
      const cached = typeof localStorage !== "undefined" ? localStorage.getItem("cs_lang") : null;
      if (cached) applyLanguage(cached);
    } catch { /* ignore */ }
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // When signed in, read the user's saved language from their profile and apply it.
  const { data: profile } = useQuery({
    queryKey: ["profile", "language"],
    queryFn: () => getFn(),
    enabled: signedIn,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (profile?.language) applyLanguage(profile.language);
  }, [profile?.language]);

  return <>{children}</>;
}