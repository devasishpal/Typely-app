import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AuthRequiredModalProps {
  nextPath: string;
}

export function AuthRequiredModal({ nextPath }: AuthRequiredModalProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      navigate('/typing-test', { replace: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Sign In Required
          </DialogTitle>
          <DialogDescription>
            Please sign in to access this feature.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to="/typing-test">Continue as Guest</Link>
          </Button>
          <Button asChild>
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`}>Sign In</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
