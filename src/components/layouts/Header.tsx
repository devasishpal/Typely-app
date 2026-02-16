import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Target,
  TrendingUp,
  Trophy,
  Shield,
  Cloud,
  BookText,
} from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { supabase } from '@/db/supabase';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name || typeof name !== 'string') return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    let isActive = true;

    const resolveAvatar = async () => {
      const url = profile?.avatar_url ?? null;
      if (!url) {
        setAvatarSrc(null);
        return;
      }

      if (url.includes('/storage/v1/object/public/avatars/')) {
        setAvatarSrc(url);
        return;
      }

      const marker = '/storage/v1/object/avatars/';
      const fallbackMarker = '/avatars/';
      let path: string | null = null;

      if (url.includes(marker)) {
        path = url.split(marker)[1] ?? null;
      } else if (url.includes(fallbackMarker)) {
        path = url.split(fallbackMarker)[1] ?? null;
      }

      if (!path) {
        setAvatarSrc(url);
        return;
      }

      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
      if (!isActive) return;
      if (error) {
        setAvatarSrc(url);
        return;
      }
      setAvatarSrc(data?.signedUrl ?? url);
    };

    resolveAvatar();
    return () => {
      isActive = false;
    };
  }, [profile?.avatar_url]);

  const desktopNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      'text-muted-foreground hover:bg-muted/45 hover:text-foreground',
      'after:pointer-events-none after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out',
      'hover:after:scale-x-100',
      isActive && 'bg-success/10 text-success after:scale-x-100 after:bg-success'
    );

  const desktopAdminNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      'text-primary hover:bg-primary/10 hover:text-primary/80',
      'after:pointer-events-none after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out',
      'hover:after:scale-x-100',
      isActive && 'text-success after:scale-x-100 after:bg-success'
    );

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md shadow-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <div className="flex flex-shrink-0 items-center">
            <Link to={user ? '/dashboard' : '/'} className="flex flex-shrink-0 items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 shadow-card">
                <img src="/favicon.png" alt="Typely logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold gradient-text">TYPELY</span>
            </Link>
          </div>

          <div className="relative flex min-w-0 flex-1 items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-background via-background/85 to-transparent"
            />

            <nav
              className="scrollbar-orbit flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap scroll-smooth"
              aria-label="Primary navigation"
            >
              <div className="mx-auto flex w-max min-w-max items-center gap-4 px-6 sm:gap-5 lg:gap-6">
                <NavLink to="/dashboard" className={desktopNavLinkClasses}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/guide" className={desktopNavLinkClasses}>
                  <BookText className="h-4 w-4" />
                  Guide
                </NavLink>
                <NavLink to="/lessons" className={desktopNavLinkClasses}>
                  <BookOpen className="h-4 w-4" />
                  Lessons
                </NavLink>
                <NavLink to="/practice" className={desktopNavLinkClasses}>
                  <Target className="h-4 w-4" />
                  Practice
                </NavLink>
                <NavLink to="/typing-test" className={desktopNavLinkClasses}>
                  <Target className="h-4 w-4" />
                  Test
                </NavLink>
                <NavLink to="/statistics" className={desktopNavLinkClasses}>
                  <TrendingUp className="h-4 w-4" />
                  Statistics
                </NavLink>
                <NavLink to="/leaderboard" className={desktopNavLinkClasses}>
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </NavLink>
                <NavLink to="/achievements" className={desktopNavLinkClasses}>
                  <Trophy className="h-4 w-4" />
                  Achievements
                </NavLink>
                {profile?.role === 'admin' && (
                  <NavLink to="/admin_Dev/users" className={desktopAdminNavLinkClasses}>
                    <Shield className="h-4 w-4" />
                    Admin
                  </NavLink>
                )}
              </div>
            </nav>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-background via-background/85 to-transparent"
            />
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
            <ModeToggle />

            {user ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <Badge variant="outline" className="hidden items-center gap-1.5 xl:inline-flex">
                  <Cloud className="h-3.5 w-3.5" />
                  Cloud Sync Enabled
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-border bg-muted/40">
                        {avatarSrc && <AvatarImage src={avatarSrc} alt="Profile picture" />}
                        <AvatarFallback className="bg-transparent text-primary">
                          {getInitials(profile?.username || null)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.username || 'User'}</p>
                        {profile?.email && !profile.email.includes('@miaoda.com') && (
                          <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin_Dev/users" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex flex-shrink-0 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/20 text-muted-foreground sm:inline-flex">
                      <Cloud className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Sign in to sync across devices</TooltipContent>
                </Tooltip>
                <Button asChild variant="ghost" className="hidden flex-shrink-0 sm:inline-flex">
                  <Link to="/login">Sign In (Optional)</Link>
                </Button>
                <Button asChild className="flex-shrink-0">
                  <Link to="/lessons">Start Typing</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
