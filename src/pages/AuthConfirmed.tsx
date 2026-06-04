import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthConfirmed() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-semibold">Email confirmed</h1>
        <p className="text-sm text-muted-foreground">
          Your Kommenszlapf Account email has been confirmed. You can now return to TaskBurst and sign in.
        </p>
        <Button className="w-full" onClick={() => navigate("/")}>Return to TaskBurst home</Button>
      </div>
    </div>
  );
}