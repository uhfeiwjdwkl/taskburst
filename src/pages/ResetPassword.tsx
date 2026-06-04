import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery token is in the URL hash; Supabase processes it via getSession/onAuthStateChange.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (pwd !== pwd2) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("Password reset. You are signed in.");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Reset failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="max-w-md w-full bg-card border rounded-lg p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Reset your password</h1>
        {!ready && <p className="text-xs text-muted-foreground text-center">Waiting for reset link…</p>}
        <div className="space-y-1">
          <Label htmlFor="np">New password</Label>
          <Input id="np" type="password" minLength={6} required value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="np2">Confirm new password</Label>
          <Input id="np2" type="password" minLength={6} required value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={!ready || busy}>Set new password</Button>
      </form>
    </div>
  );
}