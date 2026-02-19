import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { certificateApi } from '@/db/api';
import type { CertificateVerificationResponse } from '@/types';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '') ||
  'https://typelyapp.vercel.app';

export default function VerifyCertificatePage() {
  const { certificateCode } = useParams<{ certificateCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerificationResponse | null>(null);

  const normalizedCode = useMemo(
    () => (certificateCode ? certificateCode.trim().toUpperCase() : ''),
    [certificateCode]
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!normalizedCode) {
        if (mounted) {
          setLoading(false);
          setResult({
            valid: false,
            message: 'Invalid or revoked certificate.',
          });
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const verification = await certificateApi.verifyByCode(normalizedCode);
        if (!mounted) return;
        setResult(verification);
      } catch (apiError: any) {
        if (!mounted) return;
        setError(apiError?.message || 'Unable to verify certificate.');
        setResult({
          valid: false,
          message: 'Invalid or revoked certificate.',
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [normalizedCode]);

  const canonicalUrl = normalizedCode
    ? `${SITE_URL}/verify-certificate/${encodeURIComponent(normalizedCode)}`
    : `${SITE_URL}/verify-certificate`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageMeta
        title="Certificate Verification | Typely"
        description="Verify Typely typing certificates instantly with certificate ID and QR-backed authenticity checks."
        canonicalUrl={canonicalUrl}
      />

      <div>
        <h1 className="text-3xl font-bold">Certificate Verification</h1>
        <p className="text-muted-foreground">
          Validate the authenticity of a Typely typing certificate.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Certificate ID: {normalizedCode || 'N/A'}</CardTitle>
            {loading ? (
              <Badge variant="outline">Checking...</Badge>
            ) : result?.valid ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Valid</Badge>
            ) : (
              <Badge variant="destructive">Invalid</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Verifying certificate...</p>
          ) : result?.valid && result.certificate ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Student Name</p>
                <p className="text-base font-medium">{result.certificate.studentName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Test Name</p>
                <p className="text-base font-medium">{result.certificate.testName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">WPM</p>
                <p className="text-base font-medium">{result.certificate.wpm}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
                <p className="text-base font-medium">{result.certificate.accuracy.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Issue Date</p>
                <p className="text-base font-medium">
                  {new Date(result.certificate.issuedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Certificate ID</p>
                <p className="text-base font-medium">{result.certificate.certificateId}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="font-medium text-destructive">Invalid or revoked certificate.</p>
              <p className="text-sm text-destructive/90">
                {result?.message || 'Invalid or revoked certificate.'}
              </p>
              {error ? (
                <p className="mt-2 text-xs text-destructive/90">
                  Verification service message: {error}
                </p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
