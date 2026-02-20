import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import AdminLayout from '@/components/layouts/AdminLayout';
import { adminCertificateApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type {
  AdminCertificateListItem,
  AdminCertificateOverviewResponse,
  CertificateRule,
  CertificateTemplate,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Move, Save, ShieldCheck, ShieldX, Trash2, Upload } from 'lucide-react';

type PositionField = 'name' | 'wpm' | 'accuracy' | 'date' | 'certificateId';
type DragTarget = PositionField | 'qr';

type BuilderDraft = {
  name: string;
  titleText: string;
  subtitleText: string;
  bodyText: string;
  showQrCode: boolean;
  fontFamily: string;
  fontWeight: string;
  fontColor: string;
  titleFontSize: number;
  subtitleFontSize: number;
  bodyFontSize: number;
  nameFontSize: number;
  wpmFontSize: number;
  accuracyFontSize: number;
  dateFontSize: number;
  certificateIdFontSize: number;
  nameX: number;
  nameY: number;
  wpmX: number;
  wpmY: number;
  accuracyX: number;
  accuracyY: number;
  dateX: number;
  dateY: number;
  certificateIdX: number;
  certificateIdY: number;
  qrX: number;
  qrY: number;
  qrSizePct: number;
};

const DEFAULT_DRAFT: BuilderDraft = {
  name: 'Primary Certificate Template',
  titleText: 'CERTIFICATE OF ACHIEVEMENT',
  subtitleText: 'This certificate is proudly presented to',
  bodyText: 'For successfully completing the Typely Typing Speed Test',
  showQrCode: false,
  fontFamily: 'Helvetica',
  fontWeight: 'bold',
  fontColor: '#111827',
  titleFontSize: 48,
  subtitleFontSize: 22,
  bodyFontSize: 20,
  nameFontSize: 52,
  wpmFontSize: 24,
  accuracyFontSize: 24,
  dateFontSize: 18,
  certificateIdFontSize: 18,
  nameX: 50,
  nameY: 34,
  wpmX: 50,
  wpmY: 56,
  accuracyX: 50,
  accuracyY: 62,
  dateX: 30,
  dateY: 74,
  certificateIdX: 70,
  certificateIdY: 74,
  qrX: 86,
  qrY: 80,
  qrSizePct: 12,
};

const PREVIEW_VALUES = {
  studentName: 'Preview User',
  wpm: 78,
  accuracy: 97.42,
  date: new Date().toLocaleDateString('en-US'),
  certificateId: 'TYP-20260219-AB12',
  verificationUrl: 'https://typely.in/verify-certificate?code=TYP-20260219-AB12',
};

const DEFAULT_RULE_DRAFT = {
  minimumWpm: 45,
  minimumAccuracy: 90,
  testType: 'timed',
  isEnabled: true,
};

const POSITION_FIELD_CONFIG: Record<
  PositionField,
  {
    label: string;
    xKey: keyof BuilderDraft;
    yKey: keyof BuilderDraft;
    sizeKey: keyof BuilderDraft;
  }
> = {
  name: {
    label: 'Name',
    xKey: 'nameX',
    yKey: 'nameY',
    sizeKey: 'nameFontSize',
  },
  wpm: {
    label: 'WPM',
    xKey: 'wpmX',
    yKey: 'wpmY',
    sizeKey: 'wpmFontSize',
  },
  accuracy: {
    label: 'Accuracy',
    xKey: 'accuracyX',
    yKey: 'accuracyY',
    sizeKey: 'accuracyFontSize',
  },
  date: {
    label: 'Date',
    xKey: 'dateX',
    yKey: 'dateY',
    sizeKey: 'dateFontSize',
  },
  certificateId: {
    label: 'Certificate ID',
    xKey: 'certificateIdX',
    yKey: 'certificateIdY',
    sizeKey: 'certificateIdFontSize',
  },
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function clampFontSize(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(180, Math.max(8, Math.round(value)));
}

function clampQrSizePercent(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(40, Math.max(4, Number(value.toFixed(2))));
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFontColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : '#111827';
}

function getFieldCoords(draft: BuilderDraft, field: PositionField) {
  const config = POSITION_FIELD_CONFIG[field];
  return {
    x: Number(draft[config.xKey]),
    y: Number(draft[config.yKey]),
  };
}

function setFieldCoords(draft: BuilderDraft, field: PositionField, nextX: number, nextY: number): BuilderDraft {
  const config = POSITION_FIELD_CONFIG[field];
  return {
    ...draft,
    [config.xKey]: clampPercent(nextX),
    [config.yKey]: clampPercent(nextY),
  };
}

function setFieldFontSize(draft: BuilderDraft, field: PositionField, nextSize: number): BuilderDraft {
  const config = POSITION_FIELD_CONFIG[field];
  const fallback = Number(DEFAULT_DRAFT[config.sizeKey]);
  return {
    ...draft,
    [config.sizeKey]: clampFontSize(nextSize, fallback),
  };
}

function toFontFamilyCss(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('times')) {
    return '"Times New Roman", Times, serif';
  }
  if (normalized.includes('courier')) {
    return '"Courier New", Courier, monospace';
  }
  return '"Helvetica Neue", Helvetica, Arial, sans-serif';
}

function draftFromTemplate(template: CertificateTemplate): BuilderDraft {
  return {
    name: template.name || DEFAULT_DRAFT.name,
    titleText: template.title_text || DEFAULT_DRAFT.titleText,
    subtitleText: template.subtitle_text || DEFAULT_DRAFT.subtitleText,
    bodyText: template.body_text || DEFAULT_DRAFT.bodyText,
    showQrCode: Boolean(template.show_qr_code),
    fontFamily: template.font_family || DEFAULT_DRAFT.fontFamily,
    fontWeight: template.font_weight || DEFAULT_DRAFT.fontWeight,
    fontColor: template.font_color || DEFAULT_DRAFT.fontColor,
    titleFontSize: clampFontSize(Number(template.title_font_size), DEFAULT_DRAFT.titleFontSize),
    subtitleFontSize: clampFontSize(Number(template.subtitle_font_size), DEFAULT_DRAFT.subtitleFontSize),
    bodyFontSize: clampFontSize(Number(template.body_font_size), DEFAULT_DRAFT.bodyFontSize),
    nameFontSize: clampFontSize(Number(template.name_font_size), DEFAULT_DRAFT.nameFontSize),
    wpmFontSize: clampFontSize(Number(template.wpm_font_size), DEFAULT_DRAFT.wpmFontSize),
    accuracyFontSize: clampFontSize(Number(template.accuracy_font_size), DEFAULT_DRAFT.accuracyFontSize),
    dateFontSize: clampFontSize(Number(template.date_font_size), DEFAULT_DRAFT.dateFontSize),
    certificateIdFontSize: clampFontSize(
      Number(template.certificate_id_font_size),
      DEFAULT_DRAFT.certificateIdFontSize
    ),
    nameX: clampPercent(Number(template.name_x_pct)),
    nameY: clampPercent(Number(template.name_y_pct)),
    wpmX: clampPercent(Number(template.wpm_x_pct)),
    wpmY: clampPercent(Number(template.wpm_y_pct)),
    accuracyX: clampPercent(Number(template.accuracy_x_pct)),
    accuracyY: clampPercent(Number(template.accuracy_y_pct)),
    dateX: clampPercent(Number(template.date_x_pct)),
    dateY: clampPercent(Number(template.date_y_pct)),
    certificateIdX: clampPercent(Number(template.certificate_id_x_pct)),
    certificateIdY: clampPercent(Number(template.certificate_id_y_pct)),
    qrX: clampPercent(Number(template.qr_x_pct ?? DEFAULT_DRAFT.qrX)),
    qrY: clampPercent(Number(template.qr_y_pct ?? DEFAULT_DRAFT.qrY)),
    qrSizePct: clampQrSizePercent(
      Number(template.qr_size_pct ?? DEFAULT_DRAFT.qrSizePct),
      DEFAULT_DRAFT.qrSizePct
    ),
  };
}

function toTemplatePayload(draft: BuilderDraft): Partial<CertificateTemplate> {
  return {
    name: draft.name.trim() || DEFAULT_DRAFT.name,
    title_text: draft.titleText.trim() || DEFAULT_DRAFT.titleText,
    subtitle_text: draft.subtitleText.trim() || DEFAULT_DRAFT.subtitleText,
    body_text: draft.bodyText.trim() || DEFAULT_DRAFT.bodyText,
    show_wpm: true,
    show_accuracy: true,
    show_date: true,
    show_certificate_id: true,
    show_qr_code: Boolean(draft.showQrCode),
    name_x_pct: clampPercent(draft.nameX),
    name_y_pct: clampPercent(draft.nameY),
    wpm_x_pct: clampPercent(draft.wpmX),
    wpm_y_pct: clampPercent(draft.wpmY),
    accuracy_x_pct: clampPercent(draft.accuracyX),
    accuracy_y_pct: clampPercent(draft.accuracyY),
    date_x_pct: clampPercent(draft.dateX),
    date_y_pct: clampPercent(draft.dateY),
    certificate_id_x_pct: clampPercent(draft.certificateIdX),
    certificate_id_y_pct: clampPercent(draft.certificateIdY),
    qr_x_pct: clampPercent(draft.qrX),
    qr_y_pct: clampPercent(draft.qrY),
    qr_size_pct: clampQrSizePercent(draft.qrSizePct, DEFAULT_DRAFT.qrSizePct),
    font_family: draft.fontFamily,
    font_weight: draft.fontWeight,
    font_color: normalizeFontColor(draft.fontColor),
    title_font_size: clampFontSize(draft.titleFontSize, DEFAULT_DRAFT.titleFontSize),
    subtitle_font_size: clampFontSize(draft.subtitleFontSize, DEFAULT_DRAFT.subtitleFontSize),
    body_font_size: clampFontSize(draft.bodyFontSize, DEFAULT_DRAFT.bodyFontSize),
    name_font_size: clampFontSize(draft.nameFontSize, DEFAULT_DRAFT.nameFontSize),
    wpm_font_size: clampFontSize(draft.wpmFontSize, DEFAULT_DRAFT.wpmFontSize),
    accuracy_font_size: clampFontSize(draft.accuracyFontSize, DEFAULT_DRAFT.accuracyFontSize),
    date_font_size: clampFontSize(draft.dateFontSize, DEFAULT_DRAFT.dateFontSize),
    certificate_id_font_size: clampFontSize(
      draft.certificateIdFontSize,
      DEFAULT_DRAFT.certificateIdFontSize
    ),
  };
}

function getFieldText(field: PositionField) {
  if (field === 'name') return PREVIEW_VALUES.studentName;
  if (field === 'wpm') return `with a speed of ${PREVIEW_VALUES.wpm} Words Per Minute`;
  if (field === 'accuracy') return `and an accuracy of ${PREVIEW_VALUES.accuracy.toFixed(2)}%.`;
  if (field === 'date') return `Date: ${PREVIEW_VALUES.date}`;
  return `Certificate ID: ${PREVIEW_VALUES.certificateId}`;
}

function formatIssuedAt(raw: string) {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function certificateStatusBadge(item: AdminCertificateListItem) {
  return item.isRevoked ? (
    <Badge variant="destructive">Revoked</Badge>
  ) : (
    <Badge className="bg-emerald-600 hover:bg-emerald-600">Valid</Badge>
  );
}

export default function AdminCertificatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'management' | 'settings' | 'issued-users'>('management');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [rules, setRules] = useState<CertificateRule[]>([]);
  const [overview, setOverview] = useState<AdminCertificateOverviewResponse | null>(null);
  const [draft, setDraft] = useState<BuilderDraft>(DEFAULT_DRAFT);
  const [ruleDraft, setRuleDraft] = useState(DEFAULT_RULE_DRAFT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draggingField, setDraggingField] = useState<DragTarget | null>(null);
  const [activeField, setActiveField] = useState<PositionField>('name');
  const [busyRuleId, setBusyRuleId] = useState<string | null>(null);
  const [busyCertificateCode, setBusyCertificateCode] = useState<string | null>(null);
  const [qrPreviewDataUrl, setQrPreviewDataUrl] = useState<string>('');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasUploadedTemplate = Boolean(template?.background_image_url);
  const titleY = Math.max(8, draft.nameY - 18);
  const subtitleY = Math.max(8, draft.nameY - 10);
  const bodyY = Math.max(8, Math.min(draft.wpmY, draft.accuracyY) - 7);
  const fontFamilyCss = useMemo(() => toFontFamilyCss(draft.fontFamily), [draft.fontFamily]);
  const enabledRule = useMemo(() => rules.find((rule) => rule.is_enabled) ?? null, [rules]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!draggingField) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      setDraft((prev) => {
        if (draggingField === 'qr') {
          return {
            ...prev,
            qrX: clampPercent(x),
            qrY: clampPercent(y),
          };
        }
        return setFieldCoords(prev, draggingField, x, y);
      });
    };

    const handlePointerUp = () => {
      setDraggingField(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingField]);

  useEffect(() => {
    let cancelled = false;

    const loadQrPreview = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(PREVIEW_VALUES.verificationUrl, {
          width: 1024,
          margin: 0,
          color: {
            dark: '#000000',
            light: '#FFFFFFFF',
          },
        });
        if (!cancelled) setQrPreviewDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to create QR preview image:', error);
        if (!cancelled) setQrPreviewDataUrl('');
      }
    };

    void loadQrPreview();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [row, ruleRows, overviewPayload] = await Promise.all([
        adminCertificateApi.getPrimaryTemplate(),
        adminCertificateApi.getRules(),
        adminCertificateApi.getOverview(),
      ]);
      setTemplate(row);
      setDraft(draftFromTemplate(row));
      setRules(ruleRows);
      setOverview(overviewPayload);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load certificate admin data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshOverview = async () => {
    try {
      const payload = await adminCertificateApi.getOverview();
      setOverview(payload);
    } catch {
      // Ignore background refresh failures.
    }
  };

  const refreshRules = async () => {
    const rows = await adminCertificateApi.getRules();
    setRules(rows);
  };

  const handleSaveSettings = async () => {
    if (!template) return;

    setSaving(true);
    try {
      const updated = await adminCertificateApi.updateTemplate(template.id, {
        ...toTemplatePayload(draft),
        is_active: Boolean(template.background_image_url),
      });
      setTemplate(updated);
      setDraft(draftFromTemplate(updated));
      await refreshOverview();
      toast({
        title: 'Saved',
        description: 'Certificate settings saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Unable to save certificate settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadTemplate = async () => {
    if (!template || !selectedFile) return;

    setUploading(true);
    try {
      const updated = await adminCertificateApi.uploadTemplateBackground(template.id, selectedFile);
      setTemplate(updated);
      setDraft(draftFromTemplate(updated));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshOverview();
      toast({
        title: 'Uploaded',
        description: 'Template uploaded. Old template was replaced and cache version updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Unable to upload template image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!template) return;
    const confirmed = window.confirm(
      'Delete the uploaded template image? This removes it from storage and disables certificate generation until a new template is uploaded.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const updated = await adminCertificateApi.deleteTemplate(template.id);
      setTemplate(updated);
      setDraft(draftFromTemplate(updated));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshOverview();
      toast({
        title: 'Deleted',
        description: 'No certificate template uploaded.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Unable to delete template image.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateRule = async () => {
    setSavingRule(true);
    try {
      await adminCertificateApi.createRule({
        minimum_wpm: ruleDraft.minimumWpm,
        minimum_accuracy: ruleDraft.minimumAccuracy,
        test_type: ruleDraft.testType,
        is_enabled: ruleDraft.isEnabled,
      });
      toast({
        title: 'Saved',
        description: 'Certificate rule created.',
      });
      await Promise.all([refreshRules(), refreshOverview()]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create certificate rule.',
        variant: 'destructive',
      });
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRuleEnabled = async (rule: CertificateRule, enabled: boolean) => {
    setBusyRuleId(rule.id);
    try {
      await adminCertificateApi.updateRule(rule.id, { is_enabled: enabled });
      await Promise.all([refreshRules(), refreshOverview()]);
      toast({
        title: 'Updated',
        description: enabled ? 'Rule enabled.' : 'Rule disabled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update certificate rule.',
        variant: 'destructive',
      });
    } finally {
      setBusyRuleId(null);
    }
  };

  const handleDeleteRule = async (rule: CertificateRule) => {
    const confirmed = window.confirm(
      `Delete this certificate rule (${rule.minimum_wpm} WPM / ${rule.minimum_accuracy}% / ${rule.test_type})?`
    );
    if (!confirmed) return;

    setBusyRuleId(rule.id);
    try {
      await adminCertificateApi.deleteRule(rule.id);
      await Promise.all([refreshRules(), refreshOverview()]);
      toast({
        title: 'Deleted',
        description: 'Certificate rule deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete certificate rule.',
        variant: 'destructive',
      });
    } finally {
      setBusyRuleId(null);
    }
  };

  const handleToggleRevocation = async (item: AdminCertificateListItem) => {
    setBusyCertificateCode(item.certificateCode);
    try {
      if (item.isRevoked) {
        await adminCertificateApi.unrevokeCertificate(item.certificateCode);
      } else {
        const reasonInput = window.prompt(
          'Optional revoke reason (visible to admins only):',
          'Revoked by administrator'
        );
        await adminCertificateApi.revokeCertificate(item.certificateCode, reasonInput ?? '');
      }

      await refreshOverview();
      toast({
        title: 'Updated',
        description: item.isRevoked ? 'Certificate restored.' : 'Certificate revoked.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update certificate status.',
        variant: 'destructive',
      });
    } finally {
      setBusyCertificateCode(null);
    }
  };

  const positionFields = useMemo(
    () => (['name', 'wpm', 'accuracy', 'date', 'certificateId'] as PositionField[]),
    []
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Certificates</h1>
            <p className="text-muted-foreground">
              Manage certificate templates, rule settings, and issued-certificate user records.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'management' | 'settings' | 'issued-users')}
          className="space-y-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="management">Certificate Management</TabsTrigger>
            <TabsTrigger value="settings">Certificate Settings</TabsTrigger>
            <TabsTrigger value="issued-users">Issued Users</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-text">Certificate Settings</h1>
              <p className="text-muted-foreground">
                Upload your certificate template and control exact text positioning for generation and PDF export.
              </p>
            </div>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Upload Template</CardTitle>
            <CardDescription>PNG/JPG only. Uploading a new file replaces and deletes the previous template file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <Button onClick={() => void handleUploadTemplate()} disabled={!selectedFile || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Template
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleDeleteTemplate()}
                disabled={!hasUploadedTemplate || deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Template
                  </>
                )}
              </Button>
            </div>
            {hasUploadedTemplate ? (
              <p className="text-sm text-muted-foreground">Active template uploaded and ready.</p>
            ) : (
              <p className="text-sm font-medium text-destructive">No certificate template uploaded.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Text Content</CardTitle>
            <CardDescription>Edit certificate wording only.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="certificate-title-text">Title</Label>
              <Input
                id="certificate-title-text"
                value={draft.titleText}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    titleText: event.target.value,
                  }))
                }
                placeholder="Certificate title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate-subtitle-text">Subtitle</Label>
              <Input
                id="certificate-subtitle-text"
                value={draft.subtitleText}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    subtitleText: event.target.value,
                  }))
                }
                placeholder="Certificate subtitle"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="certificate-body-text">Body</Label>
              <Textarea
                id="certificate-body-text"
                value={draft.bodyText}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    bodyText: event.target.value,
                  }))
                }
                placeholder="Certificate body text"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Position Controls</CardTitle>
            <CardDescription>
              Define X/Y positions in percentages. You can drag each dynamic field directly on the live preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {positionFields.map((field) => {
                const config = POSITION_FIELD_CONFIG[field];
                const coords = getFieldCoords(draft, field);
                return (
                  <div
                    key={field}
                    className={`grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr_1fr_auto] ${
                      activeField === field ? 'border-primary/60' : 'border-border/60'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${field}-x`}>X (%)</Label>
                      <Input
                        id={`${field}-x`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={coords.x}
                        onFocus={() => setActiveField(field)}
                        onChange={(event) => {
                          const next = toNumber(event.target.value, coords.x);
                          setDraft((prev) => setFieldCoords(prev, field, next, coords.y));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${field}-y`}>Y (%)</Label>
                      <Input
                        id={`${field}-y`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={coords.y}
                        onFocus={() => setActiveField(field)}
                        onChange={(event) => {
                          const next = toNumber(event.target.value, coords.y);
                          setDraft((prev) => setFieldCoords(prev, field, coords.x, next));
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant={activeField === field ? 'default' : 'outline'}
                      onClick={() => setActiveField(field)}
                    >
                      <Move className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Font Controls</CardTitle>
            <CardDescription>Set family, weight, and color for certificate wording.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={draft.fontFamily}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, fontFamily: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times Roman">Times Roman</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={draft.fontWeight}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, fontWeight: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate-font-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="certificate-font-color"
                  type="color"
                  value={normalizeFontColor(draft.fontColor)}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      fontColor: normalizeFontColor(event.target.value),
                    }))
                  }
                  className="h-10 w-16 p-1"
                />
                <Input
                  value={draft.fontColor}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      fontColor: normalizeFontColor(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Text Size Controls</CardTitle>
            <CardDescription>Adjust font size for each certificate text block.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="title-font-size">Title</Label>
              <Input
                id="title-font-size"
                type="number"
                min={8}
                max={180}
                value={draft.titleFontSize}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    titleFontSize: clampFontSize(toNumber(event.target.value, prev.titleFontSize), 48),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle-font-size">Subtitle</Label>
              <Input
                id="subtitle-font-size"
                type="number"
                min={8}
                max={180}
                value={draft.subtitleFontSize}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    subtitleFontSize: clampFontSize(
                      toNumber(event.target.value, prev.subtitleFontSize),
                      22
                    ),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body-font-size">Body</Label>
              <Input
                id="body-font-size"
                type="number"
                min={8}
                max={180}
                value={draft.bodyFontSize}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    bodyFontSize: clampFontSize(toNumber(event.target.value, prev.bodyFontSize), 20),
                  }))
                }
              />
            </div>

            {positionFields.map((field) => (
              <div key={`${field}-font-size`} className="space-y-2">
                <Label htmlFor={`${field}-font-size`}>{POSITION_FIELD_CONFIG[field].label}</Label>
                <Input
                  id={`${field}-font-size`}
                  type="number"
                  min={8}
                  max={180}
                  value={Number(draft[POSITION_FIELD_CONFIG[field].sizeKey])}
                  onChange={(event) =>
                    setDraft((prev) =>
                      setFieldFontSize(
                        prev,
                        field,
                        toNumber(event.target.value, Number(prev[POSITION_FIELD_CONFIG[field].sizeKey]))
                      )
                    )
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Verification QR</CardTitle>
            <CardDescription>
              Enable a QR code on certificates that opens the verification page for each certificate ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Show verification QR code</p>
                <p className="text-xs text-muted-foreground">
                  Users can scan this QR to verify certificate authenticity.
                </p>
              </div>
              <Switch
                checked={draft.showQrCode}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({
                    ...prev,
                    showQrCode: checked,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="qr-x">QR X (%)</Label>
                <Input
                  id="qr-x"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={draft.qrX}
                  disabled={!draft.showQrCode}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      qrX: clampPercent(toNumber(event.target.value, prev.qrX)),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-y">QR Y (%)</Label>
                <Input
                  id="qr-y"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={draft.qrY}
                  disabled={!draft.showQrCode}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      qrY: clampPercent(toNumber(event.target.value, prev.qrY)),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-size">QR Size (% width)</Label>
                <Input
                  id="qr-size"
                  type="number"
                  min={4}
                  max={40}
                  step="0.1"
                  value={draft.qrSizePct}
                  disabled={!draft.showQrCode}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      qrSizePct: clampQrSizePercent(
                        toNumber(event.target.value, prev.qrSizePct),
                        DEFAULT_DRAFT.qrSizePct
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: enable QR and drag it inside Live Preview to choose exact placement.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              Preview appears only after template upload. Drag text lines and QR code to adjust exact positions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasUploadedTemplate && template?.background_image_url ? (
              <div
                ref={previewRef}
                className="relative mx-auto aspect-[297/210] w-full max-w-6xl overflow-hidden rounded-xl border border-border/70 bg-muted/20"
              >
                <img
                  src={template.background_image_url}
                  alt="Certificate template preview"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />

                <div className="absolute inset-0">
                  <p
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{
                      left: '50%',
                      top: `${titleY}%`,
                      fontSize: draft.titleFontSize,
                      fontFamily: fontFamilyCss,
                      fontWeight: draft.fontWeight as any,
                      color: normalizeFontColor(draft.fontColor),
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {draft.titleText || 'CERTIFICATE OF ACHIEVEMENT'}
                  </p>

                  <p
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{
                      left: '50%',
                      top: `${subtitleY}%`,
                      fontSize: draft.subtitleFontSize,
                      fontFamily: fontFamilyCss,
                      fontWeight: 500,
                      color: normalizeFontColor(draft.fontColor),
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {draft.subtitleText || DEFAULT_DRAFT.subtitleText}
                  </p>

                  <p
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{
                      left: '50%',
                      top: `${bodyY}%`,
                      fontSize: draft.bodyFontSize,
                      fontFamily: fontFamilyCss,
                      fontWeight: 500,
                      color: normalizeFontColor(draft.fontColor),
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {draft.bodyText || DEFAULT_DRAFT.bodyText}
                  </p>

                  {positionFields.map((field) => {
                    const config = POSITION_FIELD_CONFIG[field];
                    const coords = getFieldCoords(draft, field);
                    const isActive = activeField === field;
                    const size = Number(draft[config.sizeKey]);
                    return (
                      <button
                        key={field}
                        type="button"
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-2 py-1 text-center ${
                          isActive ? 'bg-primary/20 ring-1 ring-primary' : 'bg-black/10'
                        }`}
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          fontSize: size,
                          fontFamily: fontFamilyCss,
                          fontWeight: draft.fontWeight as any,
                          color: normalizeFontColor(draft.fontColor),
                          whiteSpace: 'nowrap',
                          cursor: 'grab',
                          userSelect: 'none',
                          touchAction: 'none',
                        }}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          setActiveField(field);
                          setDraggingField(field);
                        }}
                      >
                        {getFieldText(field)}
                      </button>
                    );
                  })}

                  {draft.showQrCode && qrPreviewDataUrl ? (
                    <div
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded bg-white/95 p-1 shadow-md ${
                        draggingField === 'qr' ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        left: `${draft.qrX}%`,
                        top: `${draft.qrY}%`,
                        width: `${draft.qrSizePct}%`,
                        aspectRatio: '1 / 1',
                        userSelect: 'none',
                        cursor: 'grab',
                        touchAction: 'none',
                      }}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setDraggingField('qr');
                      }}
                    >
                      <img
                        src={qrPreviewDataUrl}
                        alt="Certificate verification QR preview"
                        className="h-full w-full rounded-sm"
                        draggable={false}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                <p className="font-medium text-foreground">No certificate template uploaded.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a template image to enable live preview and certificate generation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Save Settings</CardTitle>
            <CardDescription>Persist all template, layout, and typography settings to the database.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => void handleSaveSettings()} disabled={!template || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totals.totalIssued ?? 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revoked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totals.totalRevoked ?? 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totals.activeTemplates ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Certificate Rules</CardTitle>
                <CardDescription>Configure certificate eligibility thresholds and rule state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-min-wpm">Minimum WPM</Label>
                    <Input
                      id="rule-min-wpm"
                      type="number"
                      value={ruleDraft.minimumWpm}
                      onChange={(event) =>
                        setRuleDraft((prev) => ({
                          ...prev,
                          minimumWpm: Number(event.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-min-accuracy">Minimum Accuracy</Label>
                    <Input
                      id="rule-min-accuracy"
                      type="number"
                      value={ruleDraft.minimumAccuracy}
                      onChange={(event) =>
                        setRuleDraft((prev) => ({
                          ...prev,
                          minimumAccuracy: Number(event.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select
                      value={ruleDraft.testType}
                      onValueChange={(value) =>
                        setRuleDraft((prev) => ({
                          ...prev,
                          testType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timed">Timed</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Enable Rule</Label>
                    <div className="flex h-10 items-center">
                      <Switch
                        checked={ruleDraft.isEnabled}
                        onCheckedChange={(checked) =>
                          setRuleDraft((prev) => ({
                            ...prev,
                            isEnabled: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => void handleCreateRule()} disabled={savingRule}>
                    {savingRule ? 'Saving...' : 'Create Rule'}
                  </Button>
                </div>

                <div className="rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Minimum WPM</TableHead>
                        <TableHead>Minimum Accuracy</TableHead>
                        <TableHead>Test Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[250px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.length > 0 ? (
                        rules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.minimum_wpm}</TableCell>
                            <TableCell>{rule.minimum_accuracy}%</TableCell>
                            <TableCell className="capitalize">{rule.test_type}</TableCell>
                            <TableCell>
                              {rule.is_enabled ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600">Enabled</Badge>
                              ) : (
                                <Badge variant="outline">Disabled</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="min-w-[110px] justify-center"
                                  variant={rule.is_enabled ? 'outline' : 'default'}
                                  disabled={busyRuleId === rule.id}
                                  onClick={() => void handleToggleRuleEnabled(rule, !rule.is_enabled)}
                                >
                                  {busyRuleId === rule.id
                                    ? 'Updating...'
                                    : rule.is_enabled
                                      ? 'Disable'
                                      : 'Enable'}
                                </Button>
                                <Button
                                  size="sm"
                                  className="min-w-[110px] justify-center"
                                  variant="destructive"
                                  disabled={busyRuleId === rule.id}
                                  onClick={() => void handleDeleteRule(rule)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3 shrink-0" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No certificate rules found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {enabledRule ? (
                  <p className="text-sm text-muted-foreground">
                    Active rule: {enabledRule.minimum_wpm} WPM, {enabledRule.minimum_accuracy}% accuracy,{' '}
                    <span className="capitalize">{enabledRule.test_type}</span> tests.
                  </p>
                ) : (
                  <p className="text-sm text-destructive">No active rule enabled.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issued-users" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Top Certificate Earners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Certificates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(overview?.topEarners ?? []).length > 0 ? (
                        (overview?.topEarners ?? []).map((earner) => (
                          <TableRow key={earner.userId}>
                            <TableCell>{earner.username}</TableCell>
                            <TableCell>{earner.fullName || '-'}</TableCell>
                            <TableCell>{earner.certificateCount}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No certificate earners found yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Users Who Received Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate Code</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>WPM</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Issued At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(overview?.recentCertificates ?? []).length > 0 ? (
                        (overview?.recentCertificates ?? []).map((item) => (
                          <TableRow key={item.certificateCode}>
                            <TableCell className="font-mono text-xs">{item.certificateCode}</TableCell>
                            <TableCell>{item.studentName}</TableCell>
                            <TableCell>{item.testName}</TableCell>
                            <TableCell>{item.wpm}</TableCell>
                            <TableCell>{item.accuracy.toFixed(2)}%</TableCell>
                            <TableCell>{formatIssuedAt(item.issuedAt)}</TableCell>
                            <TableCell>{certificateStatusBadge(item)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={item.isRevoked ? 'outline' : 'destructive'}
                                disabled={busyCertificateCode === item.certificateCode}
                                onClick={() => void handleToggleRevocation(item)}
                              >
                                {busyCertificateCode === item.certificateCode ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : item.isRevoked ? (
                                  <>
                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <ShieldX className="mr-1 h-3 w-3" />
                                    Revoke
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No issued certificates found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
