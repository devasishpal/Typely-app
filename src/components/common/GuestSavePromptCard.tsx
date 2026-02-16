import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GuestSavePromptCardProps {
  signInHref: string;
  onContinueAsGuest: () => void;
}

export function GuestSavePromptCard({ signInHref, onContinueAsGuest }: GuestSavePromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-primary/25 bg-gradient-card shadow-lg">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Lock className="h-4 w-4 text-primary" />
            Save Your Progress?
          </CardTitle>
          <CardDescription>
            Sign in to save your typing history, track improvement, and access leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link to={signInHref}>Sign In & Save Progress</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onContinueAsGuest}
            className="w-full sm:w-auto"
          >
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
