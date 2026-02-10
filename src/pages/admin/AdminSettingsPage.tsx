import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SiteSettings {
  id: string;
  typing_test_times: number[] | string[];
  support_center: string | null;
  faq: string | null;
  contact_us: string | null;
  about: string | null;
  blog: string | null;
  careers: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [testOptionsOpen, setTestOptionsOpen] = useState(false);
  const [testTimesInput, setTestTimesInput] = useState('');
  const [formData, setFormData] = useState({
    typing_test_times: [] as number[],
    support_center: '',
    faq: '',
    contact_us: '',
    about: '',
    blog: '',
    careers: '',
    privacy_policy: '',
    terms_of_service: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    loadSettings();
  }, [user, navigate]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (err) throw err;

      if (data) {
        setSettings(data);
        const times = Array.isArray(data.typing_test_times)
          ? data.typing_test_times.map((t) => Number(t)).filter((t) => Number.isFinite(t))
          : [];
        setFormData({
          typing_test_times: times,
          support_center: data.support_center || '',
          faq: data.faq || '',
          contact_us: data.contact_us || '',
          about: data.about || '',
          blog: data.blog || '',
          careers: data.careers || '',
          privacy_policy: data.privacy_policy || '',
          terms_of_service: data.terms_of_service || '',
        });
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createErr } = await supabase
          .from('site_settings')
          .insert({
            typing_test_times: [30, 60, 120],
            support_center: '',
            faq: '',
            contact_us: '',
            about: '',
            blog: '',
            careers: '',
            privacy_policy: '',
            terms_of_service: '',
          })
          .select()
          .maybeSingle();

        if (createErr) throw createErr;

        if (newSettings) {
          setSettings(newSettings);
          const times = Array.isArray(newSettings.typing_test_times)
            ? newSettings.typing_test_times.map((t) => Number(t)).filter((t) => Number.isFinite(t))
            : [];
          setFormData({
            typing_test_times: times,
            support_center: newSettings.support_center || '',
            faq: newSettings.faq || '',
            contact_us: newSettings.contact_us || '',
            about: newSettings.about || '',
            blog: newSettings.blog || '',
            careers: newSettings.careers || '',
            privacy_policy: newSettings.privacy_policy || '',
            terms_of_service: newSettings.terms_of_service || '',
          });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errMsg);
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        typing_test_times: formData.typing_test_times,
        support_center: formData.support_center,
        faq: formData.faq,
        contact_us: formData.contact_us,
        about: formData.about,
        blog: formData.blog,
        careers: formData.careers,
        privacy_policy: formData.privacy_policy,
        terms_of_service: formData.terms_of_service,
        updated_at: new Date().toISOString(),
      };

      if (!settings?.id) {
        const { data: created, error: createErr } = await supabase
          .from('site_settings')
          .insert(payload)
          .select()
          .maybeSingle();

        if (createErr) throw createErr;

        if (created) {
          setSettings(created as SiteSettings);
        }
      } else {
        const { error: err } = await supabase
          .from('site_settings')
          .update(payload)
          .eq('id', settings.id);

        if (err) throw err;
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });

      loadSettings();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save settings';
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Settings</h1>
          <p className="text-muted-foreground">Manage footer page content and configuration</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading settings...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Footer Pages</CardTitle>
              <CardDescription>Manage the content displayed on footer pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support_center">Support Center</Label>
                  <Textarea
                    id="support_center"
                    value={formData.support_center}
                    onChange={(e) => setFormData({ ...formData, support_center: e.target.value })}
                    placeholder="Add support center details..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faq">FAQ</Label>
                  <Textarea
                    id="faq"
                    value={formData.faq}
                    onChange={(e) => setFormData({ ...formData, faq: e.target.value })}
                    placeholder="Add frequently asked questions..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_us">Contact Us</Label>
                  <Textarea
                    id="contact_us"
                    value={formData.contact_us}
                    onChange={(e) => setFormData({ ...formData, contact_us: e.target.value })}
                    placeholder="Add contact details..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    placeholder="Add company overview..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blog">Blog</Label>
                  <Textarea
                    id="blog"
                    value={formData.blog}
                    onChange={(e) => setFormData({ ...formData, blog: e.target.value })}
                    placeholder="Add blog information..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careers">Careers</Label>
                  <Textarea
                    id="careers"
                    value={formData.careers}
                    onChange={(e) => setFormData({ ...formData, careers: e.target.value })}
                    placeholder="Add careers details..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy_policy">Privacy Policy</Label>
                  <Textarea
                    id="privacy_policy"
                    value={formData.privacy_policy}
                    onChange={(e) => setFormData({ ...formData, privacy_policy: e.target.value })}
                    placeholder="Add privacy policy..."
                    disabled={saving}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms_of_service">Terms of Service</Label>
                  <Textarea
                    id="terms_of_service"
                    value={formData.terms_of_service}
                    onChange={(e) => setFormData({ ...formData, terms_of_service: e.target.value })}
                    placeholder="Add terms of service..."
                    disabled={saving}
                    rows={6}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader>
              <CardTitle className="text-lg">Typing Test Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Configure typing test options and parameters
              </div>
              <Dialog open={testOptionsOpen} onOpenChange={setTestOptionsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setTestTimesInput(formData.typing_test_times.join(', '));
                    }}
                  >
                    Configure Test Options
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Typing Test Options</DialogTitle>
                    <DialogDescription>
                      Set available test durations (in minutes), comma-separated.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="typing_test_times">Test Durations</Label>
                    <Input
                      id="typing_test_times"
                      value={testTimesInput}
                      onChange={(e) => setTestTimesInput(e.target.value)}
                      placeholder="10, 30, 60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: 10, 30, 60
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTestOptionsOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const parsed = testTimesInput
                          .split(',')
                          .map((v) => Number(v.trim()))
                          .filter((v) => Number.isFinite(v) && v > 0);
                        if (parsed.length === 0) {
                          toast({
                            title: 'Error',
                            description: 'Please enter at least one valid duration.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setFormData({ ...formData, typing_test_times: parsed });
                        setTestOptionsOpen(false);
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
