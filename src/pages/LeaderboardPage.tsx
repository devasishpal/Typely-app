import { useEffect, useMemo, useState } from 'react';
import { Cloud, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { leaderboardApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import {
  getGuestNickname,
  getLocalLeaderboardEntries,
  setGuestNickname,
} from '@/lib/guestProgress';
import type { LeaderboardScore } from '@/types';

type LeaderboardItem = {
  id: string;
  nickname: string;
  wpm: number;
  accuracy: number;
  duration: number;
  created_at: string;
  isLocal: boolean;
  isGuest: boolean;
};

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [remoteScores, setRemoteScores] = useState<LeaderboardScore[]>([]);
  const [nicknameInput, setNicknameInput] = useState(getGuestNickname());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await leaderboardApi.getTopScores(100);
      setRemoteScores(data);
      setLoading(false);
    };

    load();
  }, []);

  const mergedScores = useMemo<LeaderboardItem[]>(() => {
    const local = getLocalLeaderboardEntries(100).map((entry) => ({
      id: entry.id,
      nickname: entry.nickname,
      wpm: entry.wpm,
      accuracy: entry.accuracy,
      duration: entry.duration,
      created_at: entry.date,
      isLocal: true,
      isGuest: !entry.user_id,
    }));

    const remote = remoteScores.map((entry) => ({
      id: entry.id,
      nickname: entry.nickname,
      wpm: entry.wpm,
      accuracy: entry.accuracy,
      duration: entry.duration,
      created_at: entry.created_at,
      isLocal: false,
      isGuest: !entry.user_id,
    }));

    return [...remote, ...local]
      .sort((a, b) => {
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 100);
  }, [remoteScores]);

  const handleSaveGuestNickname = () => {
    const saved = setGuestNickname(nicknameInput);
    if (!saved) {
      toast({
        title: 'Invalid nickname',
        description: 'Use at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Nickname saved',
      description: `Scores will be submitted as ${saved}.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 gradient-text">Leaderboard</h1>
          <p className="text-muted-foreground">
            Top typing scores across Typely. Guest entries are read-only and clearly marked.
          </p>
        </div>
        <Badge variant="outline" className="inline-flex items-center gap-2 px-3 py-1">
          <Cloud className="h-4 w-4" />
          {user ? 'Cloud Sync Enabled' : 'Guest Mode'}
        </Badge>
      </div>

      {!user && (
        <Card>
          <CardHeader>
            <CardTitle>Guest Nickname</CardTitle>
            <CardDescription>
              Choose how your scores appear on the leaderboard. Default format is Guest1234.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="Enter nickname"
              className="sm:max-w-xs"
            />
            <Button type="button" onClick={handleSaveGuestNickname}>
              Save Nickname
            </Button>
          </CardContent>
        </Card>
      )}

      {user && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              New scores are linked to your account as{' '}
              <span className="font-medium text-foreground">{profile?.username || 'Member'}</span>.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Global Rankings
          </CardTitle>
          <CardDescription>Ranked by WPM, then accuracy.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full bg-muted" />
              ))}
            </div>
          ) : mergedScores.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
              No leaderboard entries yet. Complete a test to submit your first score.
            </div>
          ) : (
            <div className="space-y-2">
              {mergedScores.map((entry, index) => (
                <div
                  key={`${entry.id}-${index}`}
                  className="grid grid-cols-[44px_minmax(0,1fr)_74px_86px_72px] items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-3"
                >
                  <div className="text-sm font-semibold text-muted-foreground">#{index + 1}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.isGuest ? 'Guest' : 'Account'} {entry.isLocal ? '- Local cache' : '- Cloud'}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">{entry.wpm} WPM</div>
                  <div className="text-sm text-muted-foreground">{entry.accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">{entry.duration}s</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

