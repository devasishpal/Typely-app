import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AdminAuthContextType {
  adminUser: Profile | null;
  loading: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ error: Error | null; user: Profile | null }>;
  signOutAdmin: () => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getAdminProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin profile:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const adminProfile = await getAdminProfile(session.user.id);
        setAdminUser(adminProfile);
      }
      
      setLoading(false);
    };

    checkAdminAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const adminProfile = await getAdminProfile(session.user.id);
        setAdminUser(adminProfile);
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const adminProfile = await getAdminProfile(data.user.id);
        
        if (!adminProfile) {
          throw new Error('Access denied. Admin privileges required.');
        }
        
        return { error: null, user: adminProfile };
      }

      return { error: null, user: null };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, signInAdmin, signOutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}