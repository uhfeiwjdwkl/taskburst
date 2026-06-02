import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKommenszlapfAuth } from "@/lib/kommenszlapfAuth";
import { toast } from "sonner";

export function KommenszlapfAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, profile, signIn, signUp, signOut } = useKommenszlapfAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  const [suUser, setSuUser] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn({ email: siEmail.trim(), password: siPass });
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
    setBusy(true);
    try {
      await signUp({ username: suUser.trim(), email: suEmail.trim(), password: suPass });
      toast.success("Kommenszlapf Account created. Check your email if confirmation is required.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Sign up failed");
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

  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kommenszlapf Account</DialogTitle>
            <DialogDescription>
              Signed in as <strong>{profile?.username ?? user.email}</strong>. Your data
              syncs across kommenszlapf.website automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Username:</span> {profile?.username ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
          </div>
          <Button variant="destructive" onClick={handleSignOut} disabled={busy}>
            Sign out
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kommenszlapf Account</DialogTitle>
          <DialogDescription>
            Optional. Sign in to sync your data across kommenszlapf.website. Without an
            account the app keeps working locally on this device.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="si-pass">Password</Label>
                <Input id="si-pass" type="password" required value={siPass} onChange={(e) => setSiPass(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
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
                <Input id="su-pass" type="password" required minLength={6} value={suPass} onChange={(e) => setSuPass(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>Create Kommenszlapf Account</Button>
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