import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

interface PinProtectionDialogProps {
  open: boolean;
  onSuccess: () => void;
  correctPin: string;
}

export const PinProtectionDialog = ({ open, onSuccess, correctPin }: PinProtectionDialogProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Enter PIN
          </DialogTitle>
          <DialogDescription>
            Enter your PIN to access TaskBurst
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            className={error ? 'border-destructive' : ''}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">Incorrect PIN. Please try again.</p>
          )}
          <Button onClick={handleSubmit} className="w-full">
            Unlock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
