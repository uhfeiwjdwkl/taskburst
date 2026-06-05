import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useKommenszlapfAuth } from "@/lib/kommenszlapfAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, AlertTriangle, Download, Trash2, UserCog } from "lucide-react";
import { exportAllData } from "@/lib/exportImport";

function PasswordInput({
  id, value, onChange, required, minLength, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void;
  required?: boolean; minLength?: number; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function KommenszlapfAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, profile, signIn, signUp, signOut, resetPassword, refreshProfile } = useKommenszlapfAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);

  const [siIdentifier, setSiIdentifier] = useState("");
  const [siPass, setSiPass] = useState("");

  const [suUser, setSuUser] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suPass2, setSuPass2] = useState("");

  const [fpEmail, setFpEmail] = useState("");

  // Signed-in management state
  const [mode, setMode] = useState<"home" | "username" | "email" | "password" | "delete">("home");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd1, setConfirmPwd1] = useState("");
  const [confirmPwd2, setConfirmPwd2] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn({ identifier: siIdentifier.trim(), password: siPass });
      toast.success("Signed in to your Kommenszlapf Account");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suUser.trim()) {
      toast.error("Username is required");
      return;
    }
    if (suPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (suPass !== suPass2) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await signUp({ username: suUser.trim(), email: suEmail.trim(), password: suPass });
      toast.success("Account created — check your inbox to confirm your email before signing in.");
      setTab("signin");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await resetPassword(fpEmail);
      toast.success("Password reset email sent. Check your inbox.");
      setTab("signin");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      toast.success("Signed out");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const requireDoublePassword = async (): Promise<boolean> => {
    if (!user?.email) return false;
    if (!confirmPwd1 || confirmPwd1 !== confirmPwd2) {
      toast.error("Enter your password twice and ensure they match");
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email, password: confirmPwd1,
    });
    if (error) { toast.error("Password incorrect"); return false; }
    return true;
  };

  const handleExportData = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Use the same export-all-data pipeline as the local "Export All" button
      // so account exports and local exports are identical zips.
      await exportAllData();
      toast.success("Account data exported");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    } finally { setBusy(false); }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) { toast.error("New username required"); return; }
    setBusy(true);
    try {
      if (!(await requireDoublePassword())) return;
      const { error } = await (supabase as any)
        .from("kommenszlapf_profiles")
        .update({ username: newUsername.trim() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Username updated");
      setMode("home"); setNewUsername(""); setConfirmPwd1(""); setConfirmPwd2("");
    } catch (e: any) { toast.error(e?.message ?? "Update failed"); }
    finally { setBusy(false); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) { toast.error("New email required"); return; }
    setBusy(true);
    try {
      if (!(await requireDoublePassword())) return;
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Confirm the change via the email we just sent.");
      setMode("home"); setNewEmail(""); setConfirmPwd1(""); setConfirmPwd2("");
    } catch (e: any) { toast.error(e?.message ?? "Update failed"); }
    finally { setBusy(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    try {
      if (!(await requireDoublePassword())) return;
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed");
      setMode("home"); setNewPassword(""); setConfirmPwd1(""); setConfirmPwd2("");
    } catch (e: any) { toast.error(e?.message ?? "Update failed"); }
    finally { setBusy(false); }
  };

  const handleDeleteAccount = async () => {
    setBusy(true);
    try {
      if (!(await requireDoublePassword())) return;
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Account deleted");
      await signOut();
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message ?? "Delete failed"); }
    finally { setBusy(false); }
  };

  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kommenszlapf Account</DialogTitle>
            <DialogDescription>
              Signed in as <strong>{profile?.username ?? user.email}</strong>. Your data syncs across kommenszlapf.website automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Username:</span> {profile?.username ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
          </div>

          {mode === "home" && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button variant="outline" onClick={handleExportData} disabled={busy}>
                <Download className="h-4 w-4 mr-2" /> Export account data
              </Button>
              <Button variant="outline" onClick={() => setMode("username")}>
                <UserCog className="h-4 w-4 mr-2" /> Change username
              </Button>
              <Button variant="outline" onClick={() => setMode("email")}>
                Change email
              </Button>
              <Button variant="outline" onClick={() => setMode("password")}>
                Change password
              </Button>
              <Button variant="destructive" onClick={() => setMode("delete")}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete account
              </Button>
              <Button variant="ghost" onClick={handleSignOut} disabled={busy}>
                Sign out
              </Button>
            </div>
          )}

          {mode !== "home" && (
            <div className="space-y-3 pt-2 border-t mt-2">
              {mode === "username" && (
                <div className="space-y-2">
                  <Label>New username</Label>
                  <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                </div>
              )}
              {mode === "email" && (
                <div className="space-y-2">
                  <Label>New email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
              )}
              {mode === "password" && (
                <div className="space-y-2">
                  <Label>New password</Label>
                  <PasswordInput id="new-pass" value={newPassword} onChange={setNewPassword} minLength={6} />
                </div>
              )}
              {mode === "delete" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This permanently deletes your Kommenszlapf Account and all data stored under it.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Confirm current password</Label>
                <PasswordInput id="cp1" value={confirmPwd1} onChange={setConfirmPwd1} />
              </div>
              <div className="space-y-2">
                <Label>Re-enter current password</Label>
                <PasswordInput id="cp2" value={confirmPwd2} onChange={setConfirmPwd2} />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setMode("home"); setConfirmPwd1(""); setConfirmPwd2(""); }} disabled={busy}>Cancel</Button>
                {mode === "username" && <Button onClick={handleChangeUsername} disabled={busy}>Update username</Button>}
                {mode === "email" && <Button onClick={handleChangeEmail} disabled={busy}>Update email</Button>}
                {mode === "password" && <Button onClick={handleChangePassword} disabled={busy}>Update password</Button>}
                {mode === "delete" && <Button variant="destructive" onClick={handleDeleteAccount} disabled={busy}>Delete account</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kommenszlapf Account</DialogTitle>
          <DialogDescription>
            Optional. Sign in to sync your data across kommenszlapf.website. Without an
            account the app keeps working locally on this device.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Alert className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Signing in will <strong>replace all data on this device</strong> with the data from your account.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSignIn} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="si-id">Email or username</Label>
                <Input id="si-id" required value={siIdentifier} onChange={(e) => setSiIdentifier(e.target.value)} placeholder="you@example.com or yourname" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="si-pass">Password</Label>
                <PasswordInput id="si-pass" value={siPass} onChange={setSiPass} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              <button type="button" className="text-xs text-muted-foreground hover:underline w-full text-center" onClick={() => setTab("forgot")}>
                Forgot password?
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <Alert className="mb-3">
              <AlertDescription className="text-xs">
                After creating your account, <strong>check your email inbox</strong> for a confirmation link before signing in.
                Unconfirmed accounts are automatically removed after 24 hours.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSignUp} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="su-user">Username</Label>
                <Input id="su-user" required value={suUser} onChange={(e) => setSuUser(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="su-pass">Password</Label>
                <PasswordInput id="su-pass" value={suPass} onChange={setSuPass} required minLength={6} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="su-pass2">Confirm password</Label>
                <PasswordInput id="su-pass2" value={suPass2} onChange={setSuPass2} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Create Kommenszlapf Account</Button>
            </form>
          </TabsContent>
          <TabsContent value="forgot">
            <form onSubmit={handleForgot} className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Enter your account email and we'll send you a password reset link.
              </p>
              <div className="space-y-1">
                <Label htmlFor="fp-email">Email</Label>
                <Input id="fp-email" type="email" required value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Send reset email</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function KommenszlapfAccountButton() {
  const { user, profile } = useKommenszlapfAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {user ? `👤 ${profile?.username ?? user.email}` : "Sign in"}
      </Button>
      <KommenszlapfAccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// Item suitable for use inside a dropdown menu — opens the account dialog.
export function KommenszlapfAccountMenuItem() {
  const { user, profile } = useKommenszlapfAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
      >
        <span className="mr-2">👤</span>
        {user ? (profile?.username ?? user.email) : "Sign in / Create account"}
      </button>
      <KommenszlapfAccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}