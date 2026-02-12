import type { User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
  return data;
}

function buildFallbackProfile(user: User): Profile {
  const now = new Date().toISOString();
  const email = user.email ?? null;
  const usernameFromEmail = email ? email.split('@')[0] : null;
  const usernameFromMeta = (user.user_metadata?.username as string | undefined) ?? null;

  return {
    id: user.id,
    email,
    username: usernameFromMeta ?? usernameFromEmail,
    full_name: null,
    date_of_birth: null,
    phone: null,
    country: null,
    bio: null,
    role: 'user',
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };
}
interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; user: Profile | null }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null; user: Profile | null }>;
  signUpWithUsername: (
    username: string,
    password: string,
    email?: string
  ) => Promise<{ error: Error | null; user: Profile | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData ?? buildFallbackProfile(user));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then((profileData) => {
          setProfile(profileData ?? buildFallbackProfile(session.user));
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    // In this function, do NOT use any await calls. Use `.then()` instead to avoid deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then((profileData) => {
          setProfile(profileData ?? buildFallbackProfile(session.user));
        });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        const profileData = await getProfile(data.user.id);
        return { error: null, user: profileData ?? buildFallbackProfile(data.user) };
      }
      
      return { error: null, user: null };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const normalizedUsername = username.trim();
      if (!normalizedUsername) {
        throw new Error('Please enter your username.');
      }

      const fallbackEmail = `${normalizedUsername}@miaoda.com`;
      const candidateEmails: string[] = [fallbackEmail];

      const { data: lookedUpEmail, error: lookupError } = await supabase.rpc(
        'get_login_email_by_username',
        { p_username: normalizedUsername }
      );

      if (!lookupError && typeof lookedUpEmail === 'string' && lookedUpEmail.trim()) {
        const resolvedEmail = lookedUpEmail.trim().toLowerCase();
        if (!candidateEmails.includes(resolvedEmail)) {
          candidateEmails.unshift(resolvedEmail);
        }
      }

      let lastError: Error | null = null;

      for (const email of candidateEmails) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          lastError = error as Error;
          continue;
        }

        if (data.user) {
          const profileData = await getProfile(data.user.id);
          return { error: null, user: profileData ?? buildFallbackProfile(data.user) };
        }
      }

      if (lastError?.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid username or password.');
      }

      throw lastError ?? new Error('Failed to sign in with username.');
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signUpWithUsername = async (username: string, password: string, email?: string) => {
    try {
      const emailToUse = email?.trim() ? email.trim() : `${username}@miaoda.com`;
      const { data, error } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: {
          data: { username },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        // Wait a bit for the auth trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to get the profile
        let profileData = await getProfile(data.user.id);
        
        // If profile still doesn't exist, we'll return the basic user info
        // The profile should be created by a database trigger or on first login
        if (!profileData) {
          console.warn('Profile not immediately available after signup');
          // Return a minimal profile object
          profileData = {
            id: data.user.id,
            email: emailToUse,
            username: username,
            full_name: null,
            date_of_birth: null,
            phone: null,
            country: null,
            bio: null,
            role: 'user',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        
        
        return { error: null, user: profileData };
      }
      
      return { error: null, user: null };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signInWithEmail, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
