import { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Award, Loader2, Plus, ShieldCheck, ShieldX, Trash2, Upload } from 'lucide-react';

type TemplateDraft = {
  name: string;
  titleText: string;
  backgroundImageUrl: string;
  showWpm: boolean;
  showAccuracy: boolean;
  showDate: boolean;
  showCertificateId: boolean;
  isActive: boolean;
};

const EMPTY_TEMPLATE_DRAFT: TemplateDraft = {
  name: '',
  titleText: 'Certificate of Typing Excellence',
  backgroundImageUrl: '',
  showWpm: true,
  showAccuracy: true,
  showDate: true,
  showCertificateId: true,
  isActive: false,
};

const DEFAULT_RULE_DRAFT = {
  minimumWpm: 45,
  minimumAccuracy: 90,
  testType: 'timed',
  isEnabled: true,
};

function normalizeTemplateDraft(template: CertificateTemplate): TemplateDraft {
  return {
    name: template.name,
    titleText: template.title_text,
    backgroundImageUrl: template.background_image_url ?? '',
    showWpm: template.show_wpm,
    showAccuracy: template.show_accuracy,
    showDate: template.show_date,
    showCertificateId: template.show_certificate_id,
    isActive: template.is_active,
  };
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
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [rules, setRules] = useState<CertificateRule[]>([]);
  const [overview, setOverview] = useState<AdminCertificateOverviewResponse | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(EMPTY_TEMPLATE_DRAFT);
  const [templateBackgroundFile, setTemplateBackgroundFile] = useState<File | null>(null);

  const [ruleDraft, setRuleDraft] = useState(DEFAULT_RULE_DRAFT);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [busyRuleId, setBusyRuleId] = useState<string | null>(null);
  const [busyCertificateCode, setBusyCertificateCode] = useState<string | null>(null);

  const enabledRule = useMemo(
    () => rules.find((rule) => rule.is_enabled) ?? null,
    [rules]
  );

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateRows, ruleRows, overviewPayload] = await Promise.all([
        adminCertificateApi.getTemplates(),
        adminCertificateApi.getRules(),
        adminCertificateApi.getOverview(),
      ]);
      setTemplates(templateRows);
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

  const refreshTemplates = async () => {
    const rows = await adminCertificateApi.getTemplates();
    setTemplates(rows);
  };

  const refreshRules = async () => {
    const rows = await adminCertificateApi.getRules();
    setRules(rows);
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateDraft(EMPTY_TEMPLATE_DRAFT);
    setTemplateBackgroundFile(null);
    setDialogOpen(true);
  };

  const openEditTemplate = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setTemplateDraft(normalizeTemplateDraft(template));
    setTemplateBackgroundFile(null);
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    const name = templateDraft.name.trim();
    const titleText = templateDraft.titleText.trim();

    if (!name || !titleText) {
      toast({
        title: 'Validation',
        description: 'Template name and title are required.',
        variant: 'destructive',
      });
      return;
    }

    setSavingTemplate(true);
    try {
      const basePayload = {
        name,
        title_text: titleText,
        background_image_url: templateDraft.backgroundImageUrl.trim() || null,
        show_wpm: templateDraft.showWpm,
        show_accuracy: templateDraft.showAccuracy,
        show_date: templateDraft.showDate,
        show_certificate_id: templateDraft.showCertificateId,
        is_active: templateDraft.isActive,
      };

      if (editingTemplate) {
        let backgroundUrl = basePayload.background_image_url;
        if (templateBackgroundFile) {
          backgroundUrl = await adminCertificateApi.uploadTemplateBackground(
            editingTemplate.id,
            templateBackgroundFile
          );
        }

        await adminCertificateApi.updateTemplate(editingTemplate.id, {
          ...basePayload,
          background_image_url: backgroundUrl,
        });
      } else {
        const created = await adminCertificateApi.createTemplate(basePayload);
        if (templateBackgroundFile) {
          const backgroundUrl = await adminCertificateApi.uploadTemplateBackground(
            created.id,
            templateBackgroundFile
          );
          await adminCertificateApi.updateTemplate(created.id, {
            background_image_url: backgroundUrl,
          });
        }
      }

      toast({
        title: 'Saved',
        description: 'Certificate template updated successfully.',
      });
      setDialogOpen(false);
      await Promise.all([refreshTemplates(), refreshOverview()]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save certificate template.',
        variant: 'destructive',
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleToggleTemplateActive = async (template: CertificateTemplate, active: boolean) => {
    setBusyTemplateId(template.id);
    try {
      await adminCertificateApi.updateTemplate(template.id, { is_active: active });
      await Promise.all([refreshTemplates(), refreshOverview()]);
      toast({
        title: 'Updated',
        description: `Template "${template.name}" ${active ? 'activated' : 'deactivated'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update template state.',
        variant: 'destructive',
      });
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (template: CertificateTemplate) => {
    const confirmed = window.confirm(
      `Delete template "${template.name}"? This fails if certificates already use it.`
    );
    if (!confirmed) return;

    setBusyTemplateId(template.id);
    try {
      await adminCertificateApi.deleteTemplate(template.id);
      await Promise.all([refreshTemplates(), refreshOverview()]);
      toast({
        title: 'Deleted',
        description: 'Template deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.message ||
          'Template could not be deleted. It may already be linked to issued certificates.',
        variant: 'destructive',
      });
    } finally {
      setBusyTemplateId(null);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Certificates</h1>
            <p className="text-muted-foreground">Manage certificate templates, rules, and verification status.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={openCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </div>

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
                    <TableHead>Enabled</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
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
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
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
                            variant="destructive"
                            disabled={busyRuleId === rule.id}
                            onClick={() => void handleDeleteRule(rule)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Certificate Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Background</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.title_text}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.background_image_url ? (
                          <a
                            href={template.background_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline-offset-2 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditTemplate(template)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={template.is_active ? 'outline' : 'default'}
                            disabled={busyTemplateId === template.id}
                            onClick={() =>
                              void handleToggleTemplateActive(template, !template.is_active)
                            }
                          >
                            {busyTemplateId === template.id
                              ? 'Updating...'
                              : template.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyTemplateId === template.id}
                            onClick={() => void handleDeleteTemplate(template)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
                  {(overview?.topEarners ?? []).map((earner) => (
                    <TableRow key={earner.userId}>
                      <TableCell>{earner.username}</TableCell>
                      <TableCell>{earner.fullName || '-'}</TableCell>
                      <TableCell>{earner.certificateCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
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
                  {(overview?.recentCertificates ?? []).map((item) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Configure certificate visual style and field visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateDraft.name}
                onChange={(event) =>
                  setTemplateDraft((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-title">Certificate Title</Label>
              <Input
                id="template-title"
                value={templateDraft.titleText}
                onChange={(event) =>
                  setTemplateDraft((prev) => ({
                    ...prev,
                    titleText: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-background-url">Background Image URL</Label>
              <Input
                id="template-background-url"
                placeholder="https://..."
                value={templateDraft.backgroundImageUrl}
                onChange={(event) =>
                  setTemplateDraft((prev) => ({
                    ...prev,
                    backgroundImageUrl: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-background-upload">Upload Background</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="template-background-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setTemplateBackgroundFile(file);
                  }}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Uploaded file takes priority over URL on save.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="text-sm">Show WPM</span>
                <Switch
                  checked={templateDraft.showWpm}
                  onCheckedChange={(checked) =>
                    setTemplateDraft((prev) => ({ ...prev, showWpm: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="text-sm">Show Accuracy</span>
                <Switch
                  checked={templateDraft.showAccuracy}
                  onCheckedChange={(checked) =>
                    setTemplateDraft((prev) => ({ ...prev, showAccuracy: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="text-sm">Show Issue Date</span>
                <Switch
                  checked={templateDraft.showDate}
                  onCheckedChange={(checked) =>
                    setTemplateDraft((prev) => ({ ...prev, showDate: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="text-sm">Show Certificate ID</span>
                <Switch
                  checked={templateDraft.showCertificateId}
                  onCheckedChange={(checked) =>
                    setTemplateDraft((prev) => ({ ...prev, showCertificateId: checked }))
                  }
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <span className="text-sm">Set Active Template</span>
              <Switch
                checked={templateDraft.isActive}
                onCheckedChange={(checked) =>
                  setTemplateDraft((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={savingTemplate}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveTemplate()} disabled={savingTemplate}>
              {savingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
