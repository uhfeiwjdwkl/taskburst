import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { activateSync, deactivateSync } from "./kommenszlapfSync";

type Profile = { username: string; email: string } | null;

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile;
  loading: boolean;
  signUp: (args: { username: string; email: string; password: string }) => Promise<void>;
  signIn: (args: { identifier: string; password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function KommenszlapfAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeId: string | null = null;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      const uid = sess?.user?.id ?? null;
      if (uid && uid !== activeId) {
        activeId = uid;
        // Defer to avoid running supabase calls inside the callback
        setTimeout(async () => {
          try {
            await activateSync(uid);
            const { data } = await (supabase as any)
              .from("kommenszlapf_profiles")
              .select("username,email")
              .eq("user_id", uid)
              .maybeSingle();
            setProfile(data ?? null);
          } catch (e) {
            console.warn("[kommenszlapf-auth] activate failed (offline?)", e);
          }
        }, 0);
      } else if (!uid && activeId) {
        activeId = null;
        deactivateSync();
        setProfile(null);
      }
    });

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((e) => console.warn("[kommenszlapf-auth] getSession failed", e))
      .finally(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp: AuthCtx["signUp"] = async ({ username, email, password }) => {
    const redirectTo = `${window.location.origin}/auth/confirmed`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo, data: { username } },
    });
    if (error) throw error;
  };

  const signIn: AuthCtx["signIn"] = async ({ identifier, password }) => {
    const identifierTrim = identifier.trim();
    if (identifierTrim.includes("@")) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifierTrim,
        password,
      });
      if (error) throw error;
      return;
    }
    // Username sign-in goes through an edge function that resolves the
    // email server-side and returns a session. The email itself is never
    // sent to the client, preventing username -> email enumeration.
    const { data, error } = await supabase.functions.invoke(
      "lookup-email-by-username",
      { body: { username: identifierTrim, password } },
    );
    if (error || !data?.session) {
      throw new Error(data?.error ?? "Invalid username or password");
    }
    const { error: setErr } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (setErr) throw setErr;
  };

  const resetPassword: AuthCtx["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const refreshProfile: AuthCtx["refreshProfile"] = async () => {
    if (!user) return;
    try {
      const { data } = await (supabase as any)
        .from("kommenszlapf_profiles")
        .select("username,email")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data ?? null);
    } catch (e) {
      console.warn("[kommenszlapf-auth] refreshProfile failed", e);
    }
  };

  const signOut: AuthCtx["signOut"] = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.warn(e); }
  };

  return (
    <Ctx.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, resetPassword, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKommenszlapfAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKommenszlapfAuth must be used within KommenszlapfAuthProvider");
  return ctx;
}