import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { AlertCircle, Calendar, Mail, MoreVertical, Shield, User } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { profileApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PRODUCTION_APP_ORIGIN = 'https://typelyapp.vercel.com';
const DELETE_LINK_VERIFICATION_KEY = 'typely_delete_link_verification';

const getAuthRedirectUrl = (path: string) => {
  const configuredAppUrl =
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
    (import.meta.env.VITE_APP_URL as string | undefined);

  if (configuredAppUrl) {
    try {
      const origin = new URL(configuredAppUrl).origin;
      return `${origin}${path}`;
    } catch {
      // Fall through to runtime origin when env value is malformed.
    }
  }

  const runtimeOrigin = window.location.origin;
  const runtimeHost = window.location.hostname;
  const isLocalhost = runtimeHost === 'localhost' || runtimeHost === '127.0.0.1';

  if (isLocalhost) {
    return `${runtimeOrigin}${path}`;
  }

  try {
    const runtimeUrl = new URL(runtimeOrigin);
    const productionUrl = new URL(PRODUCTION_APP_ORIGIN);
    const isVercelPreview =
      runtimeUrl.hostname.endsWith('.vercel.app') &&
      runtimeUrl.hostname !== productionUrl.hostname;

    if (isVercelPreview) {
      return `${productionUrl.origin}${path}`;
    }
  } catch {
    // Fall through to runtime origin when URL parsing fails.
  }

  return `${runtimeOrigin}${path}`;
};

const getResetPasswordRedirectUrl = () => getAuthRedirectUrl('/reset-password');
const getDeleteAccountRedirectUrl = () => getAuthRedirectUrl('/delete-account?flow=delete-account');
export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sendingDeleteLink, setSendingDeleteLink] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setAvatarPreview(profile?.avatar_url ?? null);
  }, [profile?.full_name, profile?.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleResetPassword = async () => {
    if (!user) return;
    const email = profile?.email || user.email || (profile?.username ? `${profile.username}@miaoda.com` : null);
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email is linked to this account.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const redirectTo = getResetPasswordRedirectUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Email sent',
      description: 'Check your inbox for the password reset link.',
    });
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

  const handleDeleteAccount = async () => {
    setIsDeleteDialogOpen(true);
  };

  const handleSendDeleteMagicLink = async () => {
    if (!user) return;

    const email = profile?.email || user.email || null;
    if (!email) {
      toast({
        title: 'Email required',
        description: 'No email is linked to this account. Add an email before requesting account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setSendingDeleteLink(true);
    const redirectTo = getDeleteAccountRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });
    setSendingDeleteLink(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send deletion verification email.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleteDialogOpen(false);

    try {
      if (user?.id) {
        window.localStorage.setItem(
          DELETE_LINK_VERIFICATION_KEY,
          JSON.stringify({
            userId: user.id,
            verifiedAt: Date.now(),
          })
        );
      }
    } catch {
      // Ignore storage errors.
    }

    toast({
      title: 'Email sent',
      description: 'Check your email and open the secure link to continue account deletion.',
    });
  };

  const openNameDialog = () => {
    setIsNameDialogOpen(true);
  };

  const openAvatarDialog = () => {
    setIsAvatarDialogOpen(true);
  };

  const handleSaveName = async () => {
    if (!user) return;
    const trimmedName = fullName.trim();
    setSavingName(true);
    const { error } = await profileApi.updateProfile(user.id, { full_name: trimmedName || null });
    setSavingName(false);

    if (error) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update your name. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title: 'Profile updated',
      description: trimmedName ? 'Your name has been updated.' : 'Name removed.',
    });
    setIsNameDialogOpen(false);
  };

  const handleRemovePicture = async () => {
    if (!user) return;
    setSavingAvatar(true);

    const currentUrl = avatarPreview ?? profile?.avatar_url ?? null;
    if (currentUrl && currentUrl.includes('/storage/v1/object/public/avatars/')) {
      const path = currentUrl.split('/storage/v1/object/public/avatars/')[1];
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }

    const { error } = await profileApi.updateProfile(user.id, { avatar_url: null });
    setSavingAvatar(false);

    if (error) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not remove your profile picture.',
        variant: 'destructive',
      });
      return;
    }

    setAvatarPreview(null);
    await refreshProfile();
    toast({
      title: 'Profile picture removed',
      description: 'Your avatar has been removed.',
    });
    setIsAvatarDialogOpen(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });

    setSavingAvatar(true);
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setSavingAvatar(false);
      toast({
        title: 'Upload failed',
        description:
          uploadError.message?.includes('Bucket not found')
            ? 'Storage bucket "avatars" not found. Create it in Supabase Storage.'
            : uploadError.message || 'Could not upload profile picture.',
        variant: 'destructive',
      });
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = data?.publicUrl ?? null;

    const { error: updateError } = await profileApi.updateProfile(user.id, { avatar_url: avatarUrl });
    setSavingAvatar(false);

    if (updateError) {
      toast({
        title: 'Update failed',
        description: updateError.message || 'Could not save your profile picture.',
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title: 'Profile picture updated',
      description: 'Your avatar has been updated.',
    });
    setIsAvatarDialogOpen(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-56 -left-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and personal information.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-widest">
              Account
            </Badge>
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
              {profile?.role === 'admin' ? 'Administrator' : 'User'}
            </Badge>
          </div>
        </div>

        <div className="mx-auto grid w-full gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Profile Overview */}
          <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Profile actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={openNameDialog}>
                      Add or Update Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={openAvatarDialog}>
                      Update Picture
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="flex flex-wrap items-center gap-5">
                <Avatar className="h-20 w-20 ring-4 ring-primary/15">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt="Profile picture" />}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(profile?.username || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold">{profile?.username || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.full_name || 'Complete your profile for a richer experience.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="text-sm font-semibold">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm font-semibold">{profile?.country || 'Not set'}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-semibold capitalize">{profile?.role || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Username</span>
                  <span className="ml-auto font-medium">{profile?.username || 'N/A'}</span>
                </div>

                {profile?.email && !profile.email.includes('@miaoda.com') && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email</span>
                    <span className="ml-auto font-medium">{profile.email}</span>
                  </div>
                )}

                {profile?.full_name && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="ml-auto font-medium">{profile.full_name}</span>
                  </div>
                )}

                {profile?.date_of_birth && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="ml-auto font-medium">
                      {new Date(profile.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {profile?.country && (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Country</span>
                    <span className="ml-auto font-medium">{profile.country}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since</span>
                  <span className="ml-auto font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role</span>
                  <span className="ml-auto font-medium capitalize">{profile?.role || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={handleResetPassword} disabled={loading}>
                  {loading ? 'Sending...' : 'Reset Password'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <p>Deleting your account is irreversible.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Name</DialogTitle>
            <DialogDescription>Add or update your full name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Add your full name"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName ? 'Saving...' : fullName.trim() ? 'Update Name' : 'Add Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>Upload a JPG, PNG, or WebP image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Profile Picture</label>
            <Input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              disabled={savingAvatar}
            />
            <span className="text-xs text-muted-foreground">
              {savingAvatar ? 'Uploading...' : 'JPG, PNG, or WebP'}
            </span>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleRemovePicture}
              disabled={savingAvatar || !avatarPreview}
            >
              {savingAvatar ? 'Removing...' : 'Remove Picture'}
            </Button>
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)} disabled={savingAvatar}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? We will send a verification magic link to your email. After opening that link,
              you can permanently delete your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingDeleteLink}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSendDeleteMagicLink();
              }}
              disabled={sendingDeleteLink}
            >
              {sendingDeleteLink ? 'Sending...' : 'Yes, Send Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
