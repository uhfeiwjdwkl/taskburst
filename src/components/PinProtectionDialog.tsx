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
import { verifyPin } from '@/lib/pin';

interface PinProtectionDialogProps {
  open: boolean;
  onSuccess: () => void;
  pinHash: string;
}

export const PinProtectionDialog = ({ open, onSuccess, pinHash }: PinProtectionDialogProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setIsVerifying(true);
    setError(false);
    
    try {
      const isValid = await verifyPin(pin, pinHash);
      if (isValid) {
        onSuccess();
      } else {
        setError(true);
        setPin('');
      }
    } catch (e) {
      console.error('PIN verification failed:', e);
      setError(true);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-sm bg-background border shadow-lg"
        showClose={false}
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
            disabled={isVerifying}
          />
          {error && (
            <p className="text-sm text-destructive">Incorrect PIN. Please try again.</p>
          )}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={isVerifying || !pin}
          >
            {isVerifying ? 'Verifying...' : 'Unlock'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
