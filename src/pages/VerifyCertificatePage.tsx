import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { certificateApi } from '@/db/api';
import type { CertificateVerificationResponse } from '@/types';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '') ||
  'https://typelyapp.vercel.app';

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

export default function VerifyCertificatePage() {
  const params = useParams<{ certificateCode?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCode = searchParams.get('code') || params.certificateCode || '';
  const [inputCode, setInputCode] = useState(normalizeCode(paramCode));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerificationResponse | null>(null);

  useEffect(() => {
    setInputCode(normalizeCode(paramCode));
  }, [paramCode]);

  useEffect(() => {
    const code = normalizeCode(paramCode);
    if (!code) return;
    void verifyCode(code);
  }, [paramCode]);

  const verifyCode = async (code: string) => {
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const verification = await certificateApi.verifyByCode(code);
      setResult(verification);
    } catch (apiError: any) {
      setError(apiError?.message || 'Unable to verify certificate.');
      setResult({
        valid: false,
        message: 'Invalid certificate.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizeCode(inputCode);
    if (!code) {
      setResult({
        valid: false,
        message: 'Enter a certificate ID.',
      });
      return;
    }

    const currentQueryCode = normalizeCode(searchParams.get('code') || '');
    setSearchParams({ code }, { replace: true });
    if (currentQueryCode === code) {
      void verifyCode(code);
    }
  };

  const normalizedCode = normalizeCode(inputCode);
  const canonicalUrl = useMemo(() => {
    if (!normalizedCode) return `${SITE_URL}/verify-certificate`;
    return `${SITE_URL}/verify-certificate?code=${encodeURIComponent(normalizedCode)}`;
  }, [normalizedCode]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageMeta
        title="Certificate Verification | Typely"
        description="Verify Typely certificates by certificate ID."
        canonicalUrl={canonicalUrl}
      />

      <div>
        <h1 className="text-3xl font-bold">Certificate Verification</h1>
        <p className="text-muted-foreground">Enter a certificate ID to check if it is valid.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="certificate-code">Certificate ID</Label>
              <Input
                id="certificate-code"
                placeholder="TYP-YYYYMMDD-XXXX"
                value={inputCode}
                onChange={(event) => setInputCode(normalizeCode(event.target.value))}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Certificate ID: {normalizedCode || 'N/A'}</CardTitle>
            {loading ? (
              <Badge variant="outline">Checking...</Badge>
            ) : result?.valid ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Valid Certificate</Badge>
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
              <p className="font-medium text-destructive">Invalid certificate.</p>
              <p className="text-sm text-destructive/90">
                {result?.message || 'Certificate could not be validated.'}
              </p>
              {error ? (
                <p className="mt-2 text-xs text-destructive/90">Verification service message: {error}</p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (normalizedCode) void verifyCode(normalizedCode);
              }}
            >
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
