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
import { User, LogOut, LayoutDashboard, BookOpen, Target, TrendingUp, Trophy, Shield } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { supabase } from '@/db/supabase';
import { useEffect, useState } from 'react';

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl shadow-card">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden shadow-card">
              <img
                src="/favicon.png"
                alt="Typely logo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-xl font-bold gradient-text">TYPELY</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/lessons"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <BookOpen className="w-4 h-4" />
                Lessons
              </NavLink>
              <NavLink
                to="/practice"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <Target className="w-4 h-4" />
                Practice
              </NavLink>
              <NavLink
                to="/typing-test"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <Target className="w-4 h-4" />
                Test
              </NavLink>
              <NavLink
                to="/statistics"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <TrendingUp className="w-4 h-4" />
                Statistics
              </NavLink>
              <NavLink
                to="/achievements"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2",
                    isActive && "text-success"
                  )
                }
              >
                <Trophy className="w-4 h-4" />
                Achievements
              </NavLink>
              {profile?.role === 'admin' && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2",
                      isActive && "text-success"
                    )
                  }
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </NavLink>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {avatarSrc && (
                      <AvatarImage src={avatarSrc} alt="Profile picture" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
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
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.email}
                      </p>
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
                    <Link to="/admin/users" className="cursor-pointer">
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
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
