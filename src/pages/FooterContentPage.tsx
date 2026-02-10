import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export type FooterContentKey =
  | 'support_center'
  | 'faq'
  | 'contact_us'
  | 'about'
  | 'blog'
  | 'careers'
  | 'privacy_policy'
  | 'terms_of_service';

interface FooterContentPageProps {
  title: string;
  field: FooterContentKey;
  subtitle?: string;
}

export default function FooterContentPage({ title, field, subtitle }: FooterContentPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadContent = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: err } = await supabase
          .from('site_settings')
          .select(field)
          .limit(1)
          .maybeSingle();

        if (err) throw err;

        if (!active) return;
        const value = data?.[field];
        setContent(typeof value === 'string' ? value : '');
      } catch (err) {
        if (!active) return;
        const errMsg = err instanceof Error ? err.message : 'Failed to load content';
        setError(errMsg);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContent();
    return () => {
      active = false;
    };
  }, [field]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
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
            <p className="text-muted-foreground">Loading details...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {content ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No details added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
