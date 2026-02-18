import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ComponentType } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adminFooterApi } from '@/db/api';
import type {
  FooterAboutSection,
  FooterCareer,
  FooterContentTab,
  FooterContentVersion,
  FooterFaqItem,
  FooterGenericStatus,
  FooterManagedBlogPost,
  FooterPrivacyPolicySection,
  FooterTermsOfServiceSection,
  FooterSupportSection,
} from '@/types';
import { buildBlogPath, extractBlogSlugFromLink, normalizeBlogSlug } from '@/lib/blogPosts';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/admin/settings/RichTextEditor';
import AdminModal, { AdminModalSection } from '@/components/admin/settings/AdminModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Clock3,
  GripVertical,
  History,
  Info,
  LifeBuoy,
  Loader2,
  Mail,
  Newspaper,
  FileText,
  PenSquare,
  Plus,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';

type ManagedTab = FooterContentTab;
type SettingsTab = ManagedTab | 'contact_us';
type SaveIntent = 'draft' | 'publish';
type ManagedRow =
  | FooterSupportSection
  | FooterFaqItem
  | FooterAboutSection
  | FooterManagedBlogPost
  | FooterCareer
  | FooterPrivacyPolicySection
  | FooterTermsOfServiceSection;

interface ContactEditorState {
  emails: string;
  phones: string;
  address: string;
  hours: string;
  notes: string;
}

interface SupportDraft {
  title: string;
  shortDescription: string;
  iconUrl: string;
  content: string;
  status: FooterGenericStatus;
}

interface FaqDraft {
  question: string;
  answer: string;
  category: string;
  orderNumber: number;
  status: FooterGenericStatus;
}

interface AboutDraft {
  sectionTitle: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  highlightText: string;
  status: FooterGenericStatus;
}

interface BlogDraft {
  title: string;
  slug: string;
  featuredImage: string;
  shortDescription: string;
  fullContent: string;
  metaTitle: string;
  metaDescription: string;
  dateLabel: string;
  publish: boolean;
  slugTouched: boolean;
}

interface CareerDraft {
  jobTitle: string;
  location: string;
  jobType: string;
  description: string;
  requirements: string;
  status: 'open' | 'closed';
}

interface PrivacyDraft {
  sectionTitle: string;
  content: string;
  lastUpdatedDate: string;
  status: FooterGenericStatus;
}

interface DeleteTarget {
  tab: ManagedTab;
  id: string;
  title: string;
}

interface ManagedListItem {
  id: string;
  title: string;
  preview: string;
  statusValue: string;
  statusLabel: string;
  updatedAt: string | null;
  enabled: boolean;
}

const PAGE_SIZE = 6;
const BLOG_DRAFT_STORAGE_KEY = 'typely_admin_blog_modal_draft_v2';
const SUMMARY_LIMIT = 200;
const META_DESCRIPTION_LIMIT = 160;

const MODAL_LABEL_CLASS = 'admin-modal-label';
const MODAL_INPUT_CLASS = 'admin-modal-input';
const MODAL_TEXTAREA_CLASS = 'admin-modal-textarea';
const MODAL_SELECT_CLASS = 'admin-modal-select';

const MANAGED_TAB_CONFIG: Array<{
  key: ManagedTab;
  title: string;
  description: string;
  addLabel: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    key: 'support_center',
    title: 'Support Center',
    description: 'Manage help sections, icons, and support resources.',
    addLabel: 'Add Support Section',
    icon: LifeBuoy,
  },
  {
    key: 'faq',
    title: 'FAQ',
    description: 'Create and organize frequently asked questions.',
    addLabel: 'Add FAQ',
    icon: CircleHelp,
  },
  {
    key: 'about',
    title: 'About',
    description: 'Manage About page section blocks and highlights.',
    addLabel: 'Add About Section',
    icon: Info,
  },
  {
    key: 'blog',
    title: 'Blog',
    description: 'Manage blog posts, SEO fields, and publish states.',
    addLabel: 'Add Blog Post',
    icon: Newspaper,
  },
  {
    key: 'careers',
    title: 'Careers',
    description: 'Manage open positions and role details.',
    addLabel: 'Add Career',
    icon: BriefcaseBusiness,
  },
  {
    key: 'privacy_policy',
    title: 'Privacy Policy',
    description: 'Manage policy sections and update dates.',
    addLabel: 'Add Policy Section',
    icon: Shield,
  },
  {
    key: 'terms_of_service',
    title: 'Terms of Service',
    description: 'Manage terms sections and update dates.',
    addLabel: 'Add Terms Section',
    icon: FileText,
  },
];

const SETTINGS_TABS: Array<{
  key: SettingsTab;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  ...MANAGED_TAB_CONFIG,
  {
    key: 'contact_us',
    title: 'Contact Us',
    description: 'Manage contact channels and office details.',
    icon: Mail,
  },
];

const STATUS_FILTER_OPTIONS: Record<ManagedTab, Array<{ value: string; label: string }>> = {
  support_center: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  faq: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  about: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  blog: [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
  ],
  careers: [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ],
  privacy_policy: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  terms_of_service: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
};

const initialSearchByTab: Record<ManagedTab, string> = {
  support_center: '',
  faq: '',
  about: '',
  blog: '',
  careers: '',
  privacy_policy: '',
  terms_of_service: '',
};

const initialStatusFilterByTab: Record<ManagedTab, string> = {
  support_center: 'all',
  faq: 'all',
  about: 'all',
  blog: 'all',
  careers: 'all',
  privacy_policy: 'all',
  terms_of_service: 'all',
};

const initialPageByTab: Record<ManagedTab, number> = {
  support_center: 1,
  faq: 1,
  about: 1,
  blog: 1,
  careers: 1,
  privacy_policy: 1,
  terms_of_service: 1,
};

const emptyContactState: ContactEditorState = {
  emails: '',
  phones: '',
  address: '',
  hours: '',
  notes: '',
};

const emptySupportDraft: SupportDraft = {
  title: '',
  shortDescription: '',
  iconUrl: '',
  content: '',
  status: 'active',
};

const emptyFaqDraft: FaqDraft = {
  question: '',
  answer: '',
  category: '',
  orderNumber: 1,
  status: 'active',
};

const emptyAboutDraft: AboutDraft = {
  sectionTitle: '',
  subtitle: '',
  content: '',
  imageUrl: '',
  highlightText: '',
  status: 'active',
};

const emptyBlogDraft: BlogDraft = {
  title: '',
  slug: '',
  featuredImage: '',
  shortDescription: '',
  fullContent: '',
  metaTitle: '',
  metaDescription: '',
  dateLabel: '',
  publish: true,
  slugTouched: false,
};

const emptyCareerDraft: CareerDraft = {
  jobTitle: '',
  location: '',
  jobType: '',
  description: '',
  requirements: '',
  status: 'open',
};

const emptyPrivacyDraft: PrivacyDraft = {
  sectionTitle: '',
  content: '',
  lastUpdatedDate: '',
  status: 'active',
};

function isManagedTab(tab: SettingsTab): tab is ManagedTab {
  return tab !== 'contact_us';
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to read file.'));
    };
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function toPreviewText(raw: string | null | undefined, limit = 145) {
  const value = (raw ?? '').trim();
  if (!value) return 'No content added yet.';

  const container = document.createElement('div');
  container.innerHTML = value;
  const text = (container.textContent || value).replace(/\s+/g, ' ').trim();
  if (!text && /<[^>]+>/.test(value)) {
    return 'Rich content added.';
  }
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 3).trim()}...`;
}

function formatSavedAt(raw: string | null) {
  if (!raw) return 'Not saved yet';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'Not saved yet';
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function splitValues(raw: string, delimiter: RegExp) {
  return raw
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));
}

function reorderRowsById<T extends { id: string }>(rows: T[], fromId: string, toId: string): T[] {
  const fromIndex = rows.findIndex((entry) => entry.id === fromId);
  const toIndex = rows.findIndex((entry) => entry.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return rows;

  const next = [...rows];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function readBlogDraftStorage(): BlogDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(BLOG_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BlogDraft>;
    return {
      ...emptyBlogDraft,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      slug: typeof parsed.slug === 'string' ? parsed.slug : '',
      featuredImage: typeof parsed.featuredImage === 'string' ? parsed.featuredImage : '',
      shortDescription: typeof parsed.shortDescription === 'string' ? parsed.shortDescription : '',
      fullContent: typeof parsed.fullContent === 'string' ? parsed.fullContent : '',
      metaTitle: typeof parsed.metaTitle === 'string' ? parsed.metaTitle : '',
      metaDescription: typeof parsed.metaDescription === 'string' ? parsed.metaDescription : '',
      dateLabel: typeof parsed.dateLabel === 'string' ? parsed.dateLabel : '',
      publish: parsed.publish !== false,
      slugTouched: parsed.slugTouched === true,
    };
  } catch {
    return null;
  }
}

function writeBlogDraftStorage(draft: BlogDraft) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BLOG_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage failures.
  }
}

function clearBlogDraftStorage() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(BLOG_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function capitalize(value: string) {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function resolveHistoryLabel(entry: FooterContentVersion) {
  const snapshot = entry.snapshot ?? {};

  if (typeof snapshot.title === 'string' && snapshot.title.trim()) return snapshot.title;
  if (typeof snapshot.question === 'string' && snapshot.question.trim()) return snapshot.question;
  if (typeof snapshot.section_title === 'string' && snapshot.section_title.trim()) {
    return snapshot.section_title;
  }
  if (typeof snapshot.job_title === 'string' && snapshot.job_title.trim()) return snapshot.job_title;

  return 'Untitled entry';
}

function getCounterOverLimit(current: number, max: number) {
  return current > max;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [supportSections, setSupportSections] = useState<FooterSupportSection[]>([]);
  const [faqItems, setFaqItems] = useState<FooterFaqItem[]>([]);
  const [aboutSections, setAboutSections] = useState<FooterAboutSection[]>([]);
  const [blogPosts, setBlogPosts] = useState<FooterManagedBlogPost[]>([]);
  const [careers, setCareers] = useState<FooterCareer[]>([]);
  const [privacySections, setPrivacySections] = useState<FooterPrivacyPolicySection[]>([]);
  const [termsSections, setTermsSections] = useState<FooterTermsOfServiceSection[]>([]);

  const [contactState, setContactState] = useState<ContactEditorState>(emptyContactState);
  const [savingContact, setSavingContact] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('support_center');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<ManagedTab>('support_center');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);

  const [supportDraft, setSupportDraft] = useState<SupportDraft>(emptySupportDraft);
  const [faqDraft, setFaqDraft] = useState<FaqDraft>(emptyFaqDraft);
  const [aboutDraft, setAboutDraft] = useState<AboutDraft>(emptyAboutDraft);
  const [blogDraft, setBlogDraft] = useState<BlogDraft>(emptyBlogDraft);
  const [careerDraft, setCareerDraft] = useState<CareerDraft>(emptyCareerDraft);
  const [privacyDraft, setPrivacyDraft] = useState<PrivacyDraft>(emptyPrivacyDraft);
  const [termsDraft, setTermsDraft] = useState<PrivacyDraft>(emptyPrivacyDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savingIntent, setSavingIntent] = useState<SaveIntent | null>(null);
  const [blogSeoOpen, setBlogSeoOpen] = useState(false);
  const [dialogBaseline, setDialogBaseline] = useState<string | null>(null);

  const [searchByTab, setSearchByTab] = useState<Record<ManagedTab, string>>(initialSearchByTab);
  const [statusFilterByTab, setStatusFilterByTab] = useState<Record<ManagedTab, string>>(
    initialStatusFilterByTab
  );
  const [pageByTab, setPageByTab] = useState<Record<ManagedTab, number>>(initialPageByTab);

  const [dragging, setDragging] = useState<{ tab: ManagedTab; id: string } | null>(null);
  const [reordering, setReordering] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [softDelete, setSoftDelete] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState<ManagedTab>('support_center');
  const [historyItems, setHistoryItems] = useState<FooterContentVersion[]>([]);

  const rowsByTab = useMemo<Record<ManagedTab, ManagedRow[]>>(
    () => ({
      support_center: supportSections,
      faq: faqItems,
      about: aboutSections,
      blog: blogPosts,
      careers,
      privacy_policy: privacySections,
      terms_of_service: termsSections,
    }),
    [supportSections, faqItems, aboutSections, blogPosts, careers, privacySections, termsSections]
  );

  const listItemsByTab = useMemo<Record<ManagedTab, ManagedListItem[]>>(
    () => ({
      support_center: supportSections.map((entry) => ({
        id: entry.id,
        title: entry.title || 'Untitled support section',
        preview: entry.short_description?.trim()
          ? entry.short_description
          : toPreviewText(entry.content),
        statusValue: entry.status,
        statusLabel: capitalize(entry.status),
        updatedAt: entry.updated_at ?? null,
        enabled: entry.status === 'active',
      })),
      faq: faqItems.map((entry) => ({
        id: entry.id,
        title: entry.question || 'Untitled question',
        preview: entry.category?.trim()
          ? `${entry.category} | ${toPreviewText(entry.answer)}`
          : toPreviewText(entry.answer),
        statusValue: entry.status,
        statusLabel: capitalize(entry.status),
        updatedAt: entry.updated_at ?? null,
        enabled: entry.status === 'active',
      })),
      about: aboutSections.map((entry) => {
        const subtitle = entry.subtitle?.trim() ?? '';
        const contentPreview = toPreviewText(entry.content);

        return {
          id: entry.id,
          title: entry.section_title || 'Untitled about section',
          preview: subtitle
            ? contentPreview === 'No content added yet.'
              ? subtitle
              : `${subtitle} | ${contentPreview}`
            : contentPreview,
          statusValue: entry.status,
          statusLabel: capitalize(entry.status),
          updatedAt: entry.updated_at ?? null,
          enabled: entry.status === 'active',
        };
      }),
      blog: blogPosts.map((entry) => ({
        id: entry.id,
        title: entry.title?.trim() || 'Untitled blog post',
        preview: entry.excerpt?.trim() ? entry.excerpt : toPreviewText(entry.content),
        statusValue: entry.is_published ? 'published' : 'draft',
        statusLabel: entry.is_published ? 'Published' : 'Draft',
        updatedAt: entry.updated_at ?? null,
        enabled: entry.is_published,
      })),
      careers: careers.map((entry) => ({
        id: entry.id,
        title: entry.job_title || 'Untitled role',
        preview:
          [entry.location, entry.job_type].filter(Boolean).join(' | ') ||
          toPreviewText(entry.description),
        statusValue: entry.status,
        statusLabel: entry.status === 'open' ? 'Open' : 'Closed',
        updatedAt: entry.updated_at ?? null,
        enabled: entry.status === 'open',
      })),
      privacy_policy: privacySections.map((entry) => ({
        id: entry.id,
        title: entry.section_title || 'Untitled policy section',
        preview: toPreviewText(entry.content),
        statusValue: entry.status,
        statusLabel: capitalize(entry.status),
        updatedAt: entry.updated_at ?? null,
        enabled: entry.status === 'active',
      })),
      terms_of_service: termsSections.map((entry) => ({
        id: entry.id,
        title: entry.section_title || 'Untitled terms section',
        preview: toPreviewText(entry.content),
        statusValue: entry.status,
        statusLabel: capitalize(entry.status),
        updatedAt: entry.updated_at ?? null,
        enabled: entry.status === 'active',
      })),
    }),
    [supportSections, faqItems, aboutSections, blogPosts, careers, privacySections, termsSections]
  );

  const activeManagedTab = isManagedTab(activeTab) ? activeTab : null;

  const managedListState = useMemo(() => {
    if (!activeManagedTab) {
      return {
        items: [] as ManagedListItem[],
        filteredItems: [] as ManagedListItem[],
        paginatedItems: [] as ManagedListItem[],
        totalPages: 1,
        safePage: 1,
      };
    }

    const items = listItemsByTab[activeManagedTab];
    const searchValue = searchByTab[activeManagedTab].trim().toLowerCase();
    const statusFilter = statusFilterByTab[activeManagedTab];

    const filteredItems = items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.statusValue === statusFilter;
      if (!matchesStatus) return false;

      if (!searchValue) return true;
      return (
        item.title.toLowerCase().includes(searchValue) ||
        item.preview.toLowerCase().includes(searchValue)
      );
    });

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const safePage = Math.min(pageByTab[activeManagedTab], totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return {
      items,
      filteredItems,
      paginatedItems: filteredItems.slice(start, start + PAGE_SIZE),
      totalPages,
      safePage,
    };
  }, [activeManagedTab, listItemsByTab, pageByTab, searchByTab, statusFilterByTab]);

  const dialogTabConfig = useMemo(
    () => MANAGED_TAB_CONFIG.find((entry) => entry.key === dialogTab),
    [dialogTab]
  );

  const blogUrlPreview = useMemo(
    () => buildBlogPath(blogDraft.slug || normalizeBlogSlug(blogDraft.title || 'post')),
    [blogDraft.slug, blogDraft.title]
  );

  const normalizedBlogSlug = useMemo(
    () => normalizeBlogSlug(blogDraft.slug || blogDraft.title),
    [blogDraft.slug, blogDraft.title]
  );

  const duplicateBlogSlug = useMemo(() => {
    if (dialogTab !== 'blog') return false;
    if (!normalizedBlogSlug) return false;

    return blogPosts.some((entry) => {
      if (editingId && entry.id === editingId) return false;
      const existingSlug = normalizeBlogSlug(
        entry.slug || extractBlogSlugFromLink(entry.link_url) || entry.title || ''
      );
      return existingSlug === normalizedBlogSlug;
    });
  }, [dialogTab, normalizedBlogSlug, blogPosts, editingId]);

  const activeDraftFingerprint = useMemo(() => {
    if (dialogTab === 'support_center') return JSON.stringify(supportDraft);
    if (dialogTab === 'faq') return JSON.stringify(faqDraft);
    if (dialogTab === 'about') return JSON.stringify(aboutDraft);
    if (dialogTab === 'blog') return JSON.stringify(blogDraft);
    if (dialogTab === 'careers') return JSON.stringify(careerDraft);
    if (dialogTab === 'terms_of_service') return JSON.stringify(termsDraft);
    return JSON.stringify(privacyDraft);
  }, [dialogTab, supportDraft, faqDraft, aboutDraft, blogDraft, careerDraft, privacyDraft, termsDraft]);

  const hasUnsavedDialogChanges =
    dialogOpen && dialogBaseline !== null && dialogBaseline !== activeDraftFingerprint;

  const modalStatusLabel = useMemo(() => {
    if (dialogTab === 'blog') {
      return 'Draft/Publish controls in footer';
    }
    if (dialogTab === 'careers') {
      return careerDraft.status === 'open' ? 'Open role' : 'Closed role';
    }
    if (dialogTab === 'faq') {
      return `Status: ${capitalize(faqDraft.status)}`;
    }
    if (dialogTab === 'about') {
      return `Status: ${capitalize(aboutDraft.status)}`;
    }
    if (dialogTab === 'support_center') {
      return `Status: ${capitalize(supportDraft.status)}`;
    }
    if (dialogTab === 'terms_of_service') {
      return `Status: ${capitalize(termsDraft.status)}`;
    }
    return `Status: ${capitalize(privacyDraft.status)}`;
  }, [dialogTab, supportDraft.status, faqDraft.status, aboutDraft.status, careerDraft.status, privacyDraft.status, termsDraft.status]);

  const modalStatusDetail = useMemo(() => {
    if (editingId) {
      return 'Editing existing entry';
    }
    return 'New entry';
  }, [editingId]);

  const modalPrimaryActionLabel = useMemo(() => {
    if (dialogTab === 'blog') {
      return editingId ? 'Update & Publish' : 'Publish';
    }
    return editingId ? 'Update' : 'Save';
  }, [dialogTab, editingId]);

  const blogSummaryOverLimit = getCounterOverLimit(blogDraft.shortDescription.length, SUMMARY_LIMIT);
  const blogMetaOverLimit = getCounterOverLimit(
    blogDraft.metaDescription.length,
    META_DESCRIPTION_LIMIT
  );

  const setRowsForTab = (tab: ManagedTab, rows: ManagedRow[]) => {
    switch (tab) {
      case 'support_center':
        setSupportSections(rows as FooterSupportSection[]);
        return;
      case 'faq':
        setFaqItems(rows as FooterFaqItem[]);
        return;
      case 'about':
        setAboutSections(rows as FooterAboutSection[]);
        return;
      case 'blog':
        setBlogPosts(rows as FooterManagedBlogPost[]);
        return;
      case 'careers':
        setCareers(rows as FooterCareer[]);
        return;
      case 'privacy_policy':
        setPrivacySections(rows as FooterPrivacyPolicySection[]);
        return;
      case 'terms_of_service':
        setTermsSections(rows as FooterTermsOfServiceSection[]);
        return;
    }
  };

  const loadContact = async () => {
    const contact = await adminFooterApi.getContactInfo();
    setContactState({
      emails: (contact?.emails ?? []).join(', '),
      phones: (contact?.phones ?? []).join(', '),
      address: contact?.address ?? '',
      hours: (contact?.hours ?? []).join('\n'),
      notes: contact?.notes ?? '',
    });
  };

  const reloadTab = async (tab: ManagedTab) => {
    switch (tab) {
      case 'support_center': {
        const next = await adminFooterApi.getSupportSections();
        setSupportSections(next);
        return;
      }
      case 'faq': {
        const next = await adminFooterApi.getFaqItems();
        setFaqItems(next);
        return;
      }
      case 'about': {
        const next = await adminFooterApi.getAboutSections();
        setAboutSections(next);
        return;
      }
      case 'blog': {
        const next = await adminFooterApi.getBlogPosts();
        setBlogPosts(next);
        return;
      }
      case 'careers': {
        const next = await adminFooterApi.getCareers();
        setCareers(next);
        return;
      }
      case 'privacy_policy': {
        const next = await adminFooterApi.getPrivacyPolicySections();
        setPrivacySections(next);
        return;
      }
      case 'terms_of_service': {
        const next = await adminFooterApi.getTermsOfServiceSections();
        setTermsSections(next);
        return;
      }
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const [supportData, faqData, aboutData, blogData, careerData, privacyData, termsData] =
        await Promise.all([
          adminFooterApi.getSupportSections(),
          adminFooterApi.getFaqItems(),
          adminFooterApi.getAboutSections(),
          adminFooterApi.getBlogPosts(),
          adminFooterApi.getCareers(),
          adminFooterApi.getPrivacyPolicySections(),
          adminFooterApi.getTermsOfServiceSections(),
        ]);

      setSupportSections(supportData);
      setFaqItems(faqData);
      setAboutSections(aboutData);
      setBlogPosts(blogData);
      setCareers(careerData);
      setPrivacySections(privacyData);
      setTermsSections(termsData);

      await loadContact();
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load admin settings.';
      setError(message);
      toast({
        title: 'Load failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }

    void loadAllData();
  }, [navigate, user]);

  useEffect(() => {
    if (!activeManagedTab) return;

    const totalPages = Math.max(1, Math.ceil(managedListState.filteredItems.length / PAGE_SIZE));
    if (pageByTab[activeManagedTab] > totalPages) {
      setPageByTab((prev) => ({
        ...prev,
        [activeManagedTab]: totalPages,
      }));
    }
  }, [activeManagedTab, managedListState.filteredItems.length, pageByTab]);

  useEffect(() => {
    if (!dialogOpen || dialogTab !== 'blog' || editingId) return;
    writeBlogDraftStorage(blogDraft);
  }, [dialogOpen, dialogTab, editingId, blogDraft]);

  useEffect(() => {
    if (!dialogOpen) {
      setDialogBaseline(null);
      return;
    }

    setDialogBaseline((prev) => prev ?? activeDraftFingerprint);
  }, [dialogOpen, activeDraftFingerprint]);

  useEffect(() => {
    if (dialogTab !== 'blog') return;

    setFieldErrors((prev) => {
      if (duplicateBlogSlug) {
        if (prev.blogSlug === 'This slug is already in use. Choose a unique slug.') {
          return prev;
        }
        return {
          ...prev,
          blogSlug: 'This slug is already in use. Choose a unique slug.',
        };
      }

      if (!prev.blogSlug) return prev;
      if (prev.blogSlug !== 'This slug is already in use. Choose a unique slug.') return prev;

      const next = { ...prev };
      delete next.blogSlug;
      return next;
    });
  }, [dialogTab, duplicateBlogSlug]);

  const clearFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const closeManagedDialog = () => {
    if (savingEntry) return;
    if (hasUnsavedDialogChanges) {
      const confirmed = window.confirm('You have unsaved changes. Discard and close this modal?');
      if (!confirmed) return;
    }

    setDialogOpen(false);
    setEditingId(null);
    setFieldErrors({});
    setSavingIntent(null);
    setBlogSeoOpen(false);
    setDialogBaseline(null);
  };

  const handleManagedDialogOpenChange = (open: boolean) => {
    if (open) {
      setDialogOpen(true);
      return;
    }

    closeManagedDialog();
  };

  const updateImageField = async (
    event: ChangeEvent<HTMLInputElement>,
    onResolved: (value: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      onResolved(dataUrl);
    } catch {
      toast({
        title: 'Image upload failed',
        description: 'Unable to read the selected image.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const openCreateDialog = (tab: ManagedTab) => {
    setDialogTab(tab);
    setEditingId(null);
    setFieldErrors({});
    setSavingIntent(null);
    setDialogBaseline(null);
    setBlogSeoOpen(tab === 'blog');

    if (tab === 'support_center') {
      setSupportDraft(emptySupportDraft);
    } else if (tab === 'faq') {
      setFaqDraft({ ...emptyFaqDraft, orderNumber: faqItems.length + 1 });
    } else if (tab === 'about') {
      setAboutDraft(emptyAboutDraft);
    } else if (tab === 'blog') {
      setBlogDraft(readBlogDraftStorage() ?? emptyBlogDraft);
    } else if (tab === 'careers') {
      setCareerDraft(emptyCareerDraft);
    } else if (tab === 'privacy_policy') {
      const today = new Date().toISOString().slice(0, 10);
      setPrivacyDraft({ ...emptyPrivacyDraft, lastUpdatedDate: today });
    } else if (tab === 'terms_of_service') {
      const today = new Date().toISOString().slice(0, 10);
      setTermsDraft({ ...emptyPrivacyDraft, lastUpdatedDate: today });
    }

    setDialogOpen(true);
  };

  const openEditDialog = (tab: ManagedTab, id: string) => {
    setDialogTab(tab);
    setEditingId(id);
    setFieldErrors({});
    setSavingIntent(null);
    setDialogBaseline(null);
    setBlogSeoOpen(tab === 'blog');

    if (tab === 'support_center') {
      const target = supportSections.find((entry) => entry.id === id);
      if (!target) return;
      setSupportDraft({
        title: target.title,
        shortDescription: target.short_description ?? '',
        iconUrl: target.icon_url ?? '',
        content: target.content ?? '',
        status: target.status,
      });
    }

    if (tab === 'faq') {
      const target = faqItems.find((entry) => entry.id === id);
      if (!target) return;
      setFaqDraft({
        question: target.question,
        answer: target.answer,
        category: target.category ?? '',
        orderNumber: target.order_number,
        status: target.status,
      });
    }

    if (tab === 'about') {
      const target = aboutSections.find((entry) => entry.id === id);
      if (!target) return;
      setAboutDraft({
        sectionTitle: target.section_title,
        subtitle: target.subtitle ?? '',
        content: target.content ?? '',
        imageUrl: target.image_url ?? '',
        highlightText: target.highlight_text ?? '',
        status: target.status,
      });
    }

    if (tab === 'blog') {
      const target = blogPosts.find((entry) => entry.id === id);
      if (!target) return;
      const resolvedSlug = normalizeBlogSlug(
        target.slug || extractBlogSlugFromLink(target.link_url) || target.title || ''
      );
      setBlogDraft({
        title: target.title ?? '',
        slug: resolvedSlug,
        featuredImage: target.image_url ?? '',
        shortDescription: target.excerpt ?? '',
        fullContent: target.content ?? '',
        metaTitle: target.meta_title ?? '',
        metaDescription: target.meta_description ?? '',
        dateLabel: target.date_label ?? '',
        publish: target.is_published,
        slugTouched: true,
      });
    }

    if (tab === 'careers') {
      const target = careers.find((entry) => entry.id === id);
      if (!target) return;
      setCareerDraft({
        jobTitle: target.job_title,
        location: target.location ?? '',
        jobType: target.job_type ?? '',
        description: target.description ?? '',
        requirements: target.requirements ?? '',
        status: target.status,
      });
    }

    if (tab === 'privacy_policy') {
      const target = privacySections.find((entry) => entry.id === id);
      if (!target) return;
      setPrivacyDraft({
        sectionTitle: target.section_title,
        content: target.content ?? '',
        lastUpdatedDate: target.last_updated_date ?? '',
        status: target.status,
      });
    }

    if (tab === 'terms_of_service') {
      const target = termsSections.find((entry) => entry.id === id);
      if (!target) return;
      setTermsDraft({
        sectionTitle: target.section_title,
        content: target.content ?? '',
        lastUpdatedDate: target.last_updated_date ?? '',
        status: target.status,
      });
    }

    setDialogOpen(true);
  };

  const getSortOrderForDraft = (tab: ManagedTab, id: string | null) => {
    const rows = rowsByTab[tab];
    if (!id) return rows.length;

    const target = rows.find((entry) => entry.id === id);
    if (!target || typeof (target as { sort_order?: unknown }).sort_order !== 'number') {
      return rows.length;
    }

    return (target as { sort_order: number }).sort_order;
  };

  const handleSaveEntry = async (intent: SaveIntent = 'publish') => {
    if (!dialogTabConfig) return;

    const nextErrors: Record<string, string> = {};

    if (dialogTab === 'support_center' && !supportDraft.title.trim()) {
      nextErrors.supportTitle = 'Support section title is required.';
    }

    if (dialogTab === 'faq') {
      if (!faqDraft.question.trim()) {
        nextErrors.faqQuestion = 'FAQ question is required.';
      }
      if (!faqDraft.answer.trim()) {
        nextErrors.faqAnswer = 'FAQ answer is required.';
      }
    }

    if (dialogTab === 'about' && !aboutDraft.sectionTitle.trim()) {
      nextErrors.aboutTitle = 'About section title is required.';
    }

    if (dialogTab === 'blog') {
      if (!blogDraft.title.trim()) {
        nextErrors.blogTitle = 'Blog title is required.';
      }
      if (!normalizedBlogSlug) {
        nextErrors.blogSlug = 'A valid slug is required.';
      }
      if (duplicateBlogSlug) {
        nextErrors.blogSlug = 'This slug is already in use. Choose a unique slug.';
      }
      if (getCounterOverLimit(blogDraft.shortDescription.length, SUMMARY_LIMIT)) {
        nextErrors.blogShortDescription = `Summary must be ${SUMMARY_LIMIT} characters or fewer.`;
      }
      if (getCounterOverLimit(blogDraft.metaDescription.length, META_DESCRIPTION_LIMIT)) {
        nextErrors.blogMetaDescription =
          `Meta description must be ${META_DESCRIPTION_LIMIT} characters or fewer.`;
      }
    }

    if (dialogTab === 'careers' && !careerDraft.jobTitle.trim()) {
      nextErrors.careerJobTitle = 'Job title is required.';
    }

    if (dialogTab === 'privacy_policy' && !privacyDraft.sectionTitle.trim()) {
      nextErrors.privacyTitle = 'Policy section title is required.';
    }
    if (dialogTab === 'terms_of_service' && !termsDraft.sectionTitle.trim()) {
      nextErrors.termsTitle = 'Terms section title is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast({
        title: 'Please review required fields',
        description: 'Fix the highlighted fields and try again.',
        variant: 'destructive',
      });
      return;
    }

    setFieldErrors({});
    setSavingEntry(true);
    setSavingIntent(intent);

    try {
      if (dialogTab === 'support_center') {
        const payload = {
          title: supportDraft.title,
          short_description: supportDraft.shortDescription,
          icon_url: supportDraft.iconUrl,
          content: supportDraft.content,
          status: intent === 'draft' ? 'inactive' : supportDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateSupportSection(editingId, payload);
        } else {
          await adminFooterApi.createSupportSection(payload);
        }
      }

      if (dialogTab === 'faq') {
        const payload = {
          question: faqDraft.question,
          answer: faqDraft.answer,
          category: faqDraft.category,
          order_number: Math.max(1, Number(faqDraft.orderNumber) || 1),
          status: intent === 'draft' ? 'inactive' : faqDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateFaqItem(editingId, payload);
        } else {
          await adminFooterApi.createFaqItem(payload);
        }
      }

      if (dialogTab === 'about') {
        const payload = {
          section_title: aboutDraft.sectionTitle,
          subtitle: aboutDraft.subtitle,
          content: aboutDraft.content,
          image_url: aboutDraft.imageUrl,
          highlight_text: aboutDraft.highlightText,
          status: intent === 'draft' ? 'inactive' : aboutDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateAboutSection(editingId, payload);
        } else {
          await adminFooterApi.createAboutSection(payload);
        }
      }

      if (dialogTab === 'blog') {
        const isPublished = intent === 'publish';
        const payload = {
          title: blogDraft.title,
          slug: normalizedBlogSlug,
          excerpt: blogDraft.shortDescription,
          content: blogDraft.fullContent,
          image_url: blogDraft.featuredImage,
          date_label: blogDraft.dateLabel,
          meta_title: blogDraft.metaTitle,
          meta_description: blogDraft.metaDescription,
          is_published: isPublished,
          is_draft: !isPublished,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateBlogPost(editingId, payload);
        } else {
          await adminFooterApi.createBlogPost(payload);
        }

        clearBlogDraftStorage();
      }

      if (dialogTab === 'careers') {
        const payload = {
          job_title: careerDraft.jobTitle,
          location: careerDraft.location,
          job_type: careerDraft.jobType,
          description: careerDraft.description,
          requirements: careerDraft.requirements,
          status: intent === 'draft' ? 'closed' : careerDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateCareer(editingId, payload);
        } else {
          await adminFooterApi.createCareer(payload);
        }
      }

      if (dialogTab === 'privacy_policy') {
        const payload = {
          section_title: privacyDraft.sectionTitle,
          content: privacyDraft.content,
          last_updated_date: privacyDraft.lastUpdatedDate || null,
          status: intent === 'draft' ? 'inactive' : privacyDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updatePrivacyPolicySection(editingId, payload);
        } else {
          await adminFooterApi.createPrivacyPolicySection(payload);
        }
      }

      if (dialogTab === 'terms_of_service') {
        const payload = {
          section_title: termsDraft.sectionTitle,
          content: termsDraft.content,
          last_updated_date: termsDraft.lastUpdatedDate || null,
          status: intent === 'draft' ? 'inactive' : termsDraft.status,
          sort_order: getSortOrderForDraft(dialogTab, editingId),
        };

        if (editingId) {
          await adminFooterApi.updateTermsOfServiceSection(editingId, payload);
        } else {
          await adminFooterApi.createTermsOfServiceSection(payload);
        }
      }

      await reloadTab(dialogTab);

      toast({
        title: intent === 'draft' ? 'Draft saved' : editingId ? 'Updated successfully' : 'Saved successfully',
        description:
          intent === 'draft'
            ? `${dialogTabConfig.title} entry was saved as draft.`
            : dialogTab === 'blog'
              ? `${dialogTabConfig.title} entry is now published.`
              : `${dialogTabConfig.title} entry has been ${editingId ? 'updated' : 'saved'}.`,
      });

      setDialogOpen(false);
      setEditingId(null);
      setFieldErrors({});
      setDialogBaseline(null);
      setBlogSeoOpen(false);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save the entry.';
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingEntry(false);
      setSavingIntent(null);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      if (deleteTarget.tab === 'support_center') {
        await adminFooterApi.deleteSupportSection(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'faq') {
        await adminFooterApi.deleteFaqItem(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'about') {
        await adminFooterApi.deleteAboutSection(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'blog') {
        await adminFooterApi.deleteBlogPost(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'careers') {
        await adminFooterApi.deleteCareer(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'privacy_policy') {
        await adminFooterApi.deletePrivacyPolicySection(deleteTarget.id, softDelete);
      }
      if (deleteTarget.tab === 'terms_of_service') {
        await adminFooterApi.deleteTermsOfServiceSection(deleteTarget.id, softDelete);
      }

      await reloadTab(deleteTarget.tab);

      toast({
        title: softDelete ? 'Moved to trash' : 'Deleted permanently',
        description: `${deleteTarget.title} has been removed.`,
      });

      setDeleteTarget(null);
      setSoftDelete(true);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Unable to delete this entry.';
      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (tab: ManagedTab, item: ManagedListItem) => {
    try {
      if (tab === 'support_center') {
        await adminFooterApi.setSupportSectionStatus(item.id, item.enabled ? 'inactive' : 'active');
      }
      if (tab === 'faq') {
        await adminFooterApi.setFaqStatus(item.id, item.enabled ? 'inactive' : 'active');
      }
      if (tab === 'about') {
        await adminFooterApi.setAboutSectionStatus(item.id, item.enabled ? 'inactive' : 'active');
      }
      if (tab === 'blog') {
        await adminFooterApi.setBlogPublished(item.id, !item.enabled);
      }
      if (tab === 'careers') {
        await adminFooterApi.setCareerStatus(item.id, item.enabled ? 'closed' : 'open');
      }
      if (tab === 'privacy_policy') {
        await adminFooterApi.setPrivacyPolicyStatus(item.id, item.enabled ? 'inactive' : 'active');
      }
      if (tab === 'terms_of_service') {
        await adminFooterApi.setTermsOfServiceStatus(item.id, item.enabled ? 'inactive' : 'active');
      }

      await reloadTab(tab);
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Unable to update status.';
      toast({
        title: 'Status update failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const canReorderTab = (tab: ManagedTab) =>
    searchByTab[tab].trim().length === 0 && statusFilterByTab[tab] === 'all';

  const handleDropOnItem = async (tab: ManagedTab, targetId: string) => {
    if (!dragging || dragging.tab !== tab) return;
    if (!canReorderTab(tab)) {
      setDragging(null);
      return;
    }

    const rows = rowsByTab[tab];
    const reordered = reorderRowsById(rows, dragging.id, targetId).map((entry, index) => ({
      ...entry,
      sort_order: index,
    })) as ManagedRow[];

    setRowsForTab(tab, reordered);
    setDragging(null);
    setReordering(true);

    try {
      const orderedIds = reordered.map((entry) => entry.id);

      if (tab === 'support_center') await adminFooterApi.reorderSupportSections(orderedIds);
      if (tab === 'faq') await adminFooterApi.reorderFaqItems(orderedIds);
      if (tab === 'about') await adminFooterApi.reorderAboutSections(orderedIds);
      if (tab === 'blog') await adminFooterApi.reorderBlogPosts(orderedIds);
      if (tab === 'careers') await adminFooterApi.reorderCareers(orderedIds);
      if (tab === 'privacy_policy') await adminFooterApi.reorderPrivacyPolicySections(orderedIds);
      if (tab === 'terms_of_service') await adminFooterApi.reorderTermsOfServiceSections(orderedIds);

      await reloadTab(tab);
    } catch (reorderError) {
      const message =
        reorderError instanceof Error ? reorderError.message : 'Unable to reorder entries.';
      toast({
        title: 'Reorder failed',
        description: message,
        variant: 'destructive',
      });
      await reloadTab(tab);
    } finally {
      setReordering(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);

    try {
      const emails = uniqueValues(splitValues(contactState.emails, /[,\n;]+/));
      const phones = uniqueValues(splitValues(contactState.phones, /[,\n;]+/));
      const hours = uniqueValues(splitValues(contactState.hours, /[\n;]+/));

      await adminFooterApi.upsertContactInfo({
        emails,
        phones,
        address: contactState.address.trim() || null,
        hours,
        notes: contactState.notes.trim() || null,
      });

      toast({
        title: 'Contact saved',
        description: 'Contact Us information has been updated.',
      });

      await loadContact();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save contact info.';
      toast({
        title: 'Contact save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingContact(false);
    }
  };

  const openHistory = async (tab: ManagedTab) => {
    setHistoryTab(tab);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const rows = await adminFooterApi.getHistory(tab);
      setHistoryItems(rows);
    } catch (historyError) {
      const message =
        historyError instanceof Error ? historyError.message : 'Unable to load history.';
      toast({
        title: 'History load failed',
        description: message,
        variant: 'destructive',
      });
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const activeTabConfig = SETTINGS_TABS.find((entry) => entry.key === activeTab);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Settings</h1>
          <p className="text-muted-foreground">
            Popup-based CMS management for footer pages, aligned with lesson management workflow.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border/70 bg-gradient-card shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Footer Pages Management</CardTitle>
            <CardDescription>
              Use tab-specific popups to add, edit, reorder, publish, and remove entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)}>
              <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-xl bg-background/45 p-1 scrollbar-orbit">
                {SETTINGS_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="min-w-[138px] rounded-lg text-xs sm:text-sm"
                    >
                      <Icon className="mr-1.5 h-4 w-4" />
                      {tab.title}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="border-border/70 bg-gradient-card shadow-card">
            <CardContent className="flex items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading settings data...
            </CardContent>
          </Card>
        ) : activeManagedTab && activeTabConfig ? (
          <div className="space-y-4">
            <Card className="border-border/70 bg-gradient-card shadow-card">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <activeTabConfig.icon className="h-4 w-4 text-primary" />
                      {activeTabConfig.title}
                    </CardTitle>
                    <CardDescription>{activeTabConfig.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => void openHistory(activeManagedTab)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Version History
                    </Button>
                    <Button
                      type="button"
                      className="h-10 rounded-xl"
                      onClick={() => openCreateDialog(activeManagedTab)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {MANAGED_TAB_CONFIG.find((entry) => entry.key === activeManagedTab)?.addLabel}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-border/70 bg-background/30 shadow-card">
              <CardContent className="grid gap-4 pt-6 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <Label htmlFor={`${activeManagedTab}-search`}>Search</Label>
                  <Input
                    id={`${activeManagedTab}-search`}
                    value={searchByTab[activeManagedTab]}
                    onChange={(event) => {
                      const next = event.target.value;
                      setSearchByTab((prev) => ({ ...prev, [activeManagedTab]: next }));
                      setPageByTab((prev) => ({ ...prev, [activeManagedTab]: 1 }));
                    }}
                    placeholder="Search title or preview"
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilterByTab[activeManagedTab]}
                    onValueChange={(value) => {
                      setStatusFilterByTab((prev) => ({ ...prev, [activeManagedTab]: value }));
                      setPageByTab((prev) => ({ ...prev, [activeManagedTab]: 1 }));
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTER_OPTIONS[activeManagedTab].map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{managedListState.filteredItems.length} item(s) found</span>
              <span>
                {canReorderTab(activeManagedTab)
                  ? 'Drag rows by handle to reorder.'
                  : 'Clear search/filter to enable drag reorder.'}
              </span>
            </div>

            {managedListState.paginatedItems.length === 0 ? (
              <Card className="border-border/70 bg-background/25 shadow-card">
                <CardContent className="py-14 text-center text-muted-foreground">
                  No entries found for this tab.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {managedListState.paginatedItems.map((item, index) => {
                  const isDragging = dragging?.id === item.id;
                  const canReorder = canReorderTab(activeManagedTab);
                  const isBlogTab = activeManagedTab === 'blog';
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      draggable={canReorder}
                      onDragStart={() =>
                        canReorder && setDragging({ tab: activeManagedTab, id: item.id })
                      }
                      onDragEnd={() => setDragging(null)}
                      onDragOver={(event) => {
                        if (canReorder) event.preventDefault();
                      }}
                      onDrop={() => void handleDropOnItem(activeManagedTab, item.id)}
                      className={cn(
                        'rounded-2xl border border-border/70 bg-background/45 shadow-card transition-all duration-300 hover:border-primary/35 hover:shadow-hover',
                        isBlogTab ? 'p-0' : 'p-4',
                        isDragging && 'ring-1 ring-primary/50 opacity-75'
                      )}
                    >
                      <div
                        className={cn(
                          isBlogTab
                            ? 'blog-item'
                            : 'flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'
                        )}
                      >
                        <div className={cn('min-w-0 flex items-start gap-3', isBlogTab && 'blog-item-content')}>
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                              {item.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground sm:text-sm">
                              {item.preview}
                            </p>
                            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {formatSavedAt(item.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className={cn(isBlogTab ? 'blog-actions' : 'flex flex-wrap items-center gap-2')}>
                          <Badge
                            variant={item.enabled ? 'default' : 'secondary'}
                            className={cn(isBlogTab ? 'badge' : 'rounded-full')}
                          >
                            {item.statusLabel}
                          </Badge>

                          <div
                            className={cn(
                              'flex items-center rounded-lg border border-border/70 bg-background/45',
                              isBlogTab ? 'toggle' : 'gap-2 px-2 py-1.5'
                            )}
                          >
                            <Label className={cn('text-xs text-muted-foreground', isBlogTab && 'toggle-label')}>
                              {activeManagedTab === 'blog'
                                ? 'Publish'
                                : activeManagedTab === 'careers'
                                  ? 'Open'
                                  : 'Active'}
                            </Label>
                            <Switch
                              checked={item.enabled}
                              onCheckedChange={() => void handleToggleStatus(activeManagedTab, item)}
                              aria-label={`Toggle ${item.title} status`}
                              className={cn(isBlogTab && 'shrink-0')}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn('h-9 w-9 rounded-lg', isBlogTab && 'icon-btn')}
                            onClick={() => openEditDialog(activeManagedTab, item.id)}
                            aria-label={`Edit ${item.title}`}
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive',
                              isBlogTab && 'icon-btn'
                            )}
                            onClick={() => {
                              setDeleteTarget({ tab: activeManagedTab, id: item.id, title: item.title });
                              setSoftDelete(true);
                            }}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {managedListState.filteredItems.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Page {managedListState.safePage} of {managedListState.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={managedListState.safePage <= 1}
                    onClick={() =>
                      setPageByTab((prev) => ({
                        ...prev,
                        [activeManagedTab]: Math.max(1, managedListState.safePage - 1),
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={managedListState.safePage >= managedListState.totalPages}
                    onClick={() =>
                      setPageByTab((prev) => ({
                        ...prev,
                        [activeManagedTab]: Math.min(
                          managedListState.totalPages,
                          managedListState.safePage + 1
                        ),
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}

            {reordering ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving order...
              </div>
            ) : null}
          </div>
        ) : (
          <Card className="border-border/70 bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                This tab remains direct-edit based and stores data in the existing contact table.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-emails">Email</Label>
                  <Input
                    id="contact-emails"
                    value={contactState.emails}
                    onChange={(event) =>
                      setContactState((prev) => ({ ...prev, emails: event.target.value }))
                    }
                    className="h-10 rounded-xl"
                    placeholder="support@typely.com"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple emails with commas.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phones">Phone</Label>
                  <Input
                    id="contact-phones"
                    value={contactState.phones}
                    onChange={(event) =>
                      setContactState((prev) => ({ ...prev, phones: event.target.value }))
                    }
                    className="h-10 rounded-xl"
                    placeholder="+1 555 123 4567"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple phone numbers with commas.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  value={contactState.address}
                  onChange={(event) =>
                    setContactState((prev) => ({ ...prev, address: event.target.value }))
                  }
                  className="min-h-[90px] rounded-xl"
                  placeholder="123 Main Street, New York, NY"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-hours">Working Hours</Label>
                <Textarea
                  id="contact-hours"
                  value={contactState.hours}
                  onChange={(event) =>
                    setContactState((prev) => ({ ...prev, hours: event.target.value }))
                  }
                  className="min-h-[90px] rounded-xl"
                  placeholder="Mon-Fri 9:00 AM - 6:00 PM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-notes">Additional Notes</Label>
                <Textarea
                  id="contact-notes"
                  value={contactState.notes}
                  onChange={(event) =>
                    setContactState((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  className="min-h-[110px] rounded-xl"
                  placeholder="Any extra support details"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="h-10 rounded-xl"
                  onClick={() => void handleSaveContact()}
                  disabled={savingContact}
                >
                  {savingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Contact Info'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AdminModal
        open={dialogOpen}
        onOpenChange={handleManagedDialogOpenChange}
        title={editingId ? `Edit ${dialogTabConfig?.title}` : dialogTabConfig?.addLabel ?? 'Add Entry'}
        subtitle={
          editingId
            ? 'Update details using the standardized CMS modal workflow.'
            : 'Create a new entry using the standardized CMS modal workflow.'
        }
        statusLabel={modalStatusLabel}
        statusDetail={modalStatusDetail}
        onCancel={closeManagedDialog}
        onSaveDraft={() => void handleSaveEntry('draft')}
        onSavePrimary={() => void handleSaveEntry('publish')}
        saving={savingEntry}
        savingIntent={savingIntent}
        saveDraftLabel="Save Draft"
        savePrimaryLabel={modalPrimaryActionLabel}
        disableSaveDraft={dialogTab === 'blog' && (duplicateBlogSlug || blogSummaryOverLimit || blogMetaOverLimit)}
        disableSavePrimary={dialogTab === 'blog' && (duplicateBlogSlug || blogSummaryOverLimit || blogMetaOverLimit)}
      >
              <div className="space-y-6">
                {dialogTab === 'support_center' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Core support metadata.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="support-title">
                            Title
                          </Label>
                          <Input
                            id="support-title"
                            autoFocus
                            value={supportDraft.title}
                            onChange={(event) => {
                              clearFieldError('supportTitle');
                              setSupportDraft((prev) => ({ ...prev, title: event.target.value }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="Support section title"
                          />
                          {fieldErrors.supportTitle ? (
                            <p className="admin-modal-error">{fieldErrors.supportTitle}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={supportDraft.status}
                            onValueChange={(value) =>
                              setSupportDraft((prev) => ({
                                ...prev,
                                status: value as FooterGenericStatus,
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Media" description="Icon image input and preview.">
                      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="support-icon">
                            Icon URL
                          </Label>
                          <Input
                            id="support-icon"
                            value={supportDraft.iconUrl}
                            onChange={(event) =>
                              setSupportDraft((prev) => ({ ...prev, iconUrl: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Paste image URL or upload"
                          />
                        </div>
                        <div className="flex items-end">
                          <Label className="admin-modal-upload-button cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            Upload Icon
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                void updateImageField(event, (value) =>
                                  setSupportDraft((prev) => ({ ...prev, iconUrl: value }))
                                )
                              }
                            />
                          </Label>
                        </div>
                      </div>
                      {supportDraft.iconUrl ? (
                        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/30 p-3 transition-opacity duration-300">
                          <img src={supportDraft.iconUrl} alt="Support icon preview" className="h-14 w-14 rounded-lg object-cover" />
                        </div>
                      ) : null}
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Summary and detailed support copy.">
                      <div className="space-y-5">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="support-short-description">
                            Short Description
                          </Label>
                          <Textarea
                            id="support-short-description"
                            value={supportDraft.shortDescription}
                            onChange={(event) =>
                              setSupportDraft((prev) => ({
                                ...prev,
                                shortDescription: event.target.value,
                              }))
                            }
                            className={cn(MODAL_TEXTAREA_CLASS, 'min-h-[120px]')}
                            placeholder="Short summary displayed in list"
                          />
                          <p className="admin-modal-counter">{supportDraft.shortDescription.length} characters</p>
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Full Content</Label>
                          <RichTextEditor
                            value={supportDraft.content}
                            onChange={(value) =>
                              setSupportDraft((prev) => ({ ...prev, content: value }))
                            }
                            ariaLabel="Support content editor"
                            minHeightClassName="min-h-[280px]"
                            stickyToolbar
                          />
                        </div>
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}

                {dialogTab === 'faq' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Question metadata and ordering controls.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label className={MODAL_LABEL_CLASS} htmlFor="faq-question">
                            Question
                          </Label>
                          <Input
                            id="faq-question"
                            autoFocus
                            value={faqDraft.question}
                            onChange={(event) => {
                              clearFieldError('faqQuestion');
                              setFaqDraft((prev) => ({ ...prev, question: event.target.value }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="FAQ question"
                          />
                          {fieldErrors.faqQuestion ? (
                            <p className="admin-modal-error">{fieldErrors.faqQuestion}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="faq-category">
                            Category (optional)
                          </Label>
                          <Input
                            id="faq-category"
                            value={faqDraft.category}
                            onChange={(event) =>
                              setFaqDraft((prev) => ({ ...prev, category: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="General"
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="faq-order">
                            Order Number
                          </Label>
                          <Input
                            id="faq-order"
                            type="number"
                            min={1}
                            value={faqDraft.orderNumber}
                            onChange={(event) =>
                              setFaqDraft((prev) => ({
                                ...prev,
                                orderNumber: Math.max(1, Number(event.target.value) || 1),
                              }))
                            }
                            className={MODAL_INPUT_CLASS}
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={faqDraft.status}
                            onValueChange={(value) =>
                              setFaqDraft((prev) => ({
                                ...prev,
                                status: value as FooterGenericStatus,
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Detailed answer with rich formatting.">
                      <div>
                        <Label className={MODAL_LABEL_CLASS}>Answer</Label>
                        <RichTextEditor
                          value={faqDraft.answer}
                          onChange={(value) => {
                            clearFieldError('faqAnswer');
                            setFaqDraft((prev) => ({ ...prev, answer: value }));
                          }}
                          ariaLabel="FAQ answer editor"
                          minHeightClassName="min-h-[280px]"
                          stickyToolbar
                        />
                        {fieldErrors.faqAnswer ? <p className="admin-modal-error">{fieldErrors.faqAnswer}</p> : null}
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}

                {dialogTab === 'about' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Section heading and status metadata.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="about-title">
                            Section Title
                          </Label>
                          <Input
                            id="about-title"
                            autoFocus
                            value={aboutDraft.sectionTitle}
                            onChange={(event) => {
                              clearFieldError('aboutTitle');
                              setAboutDraft((prev) => ({
                                ...prev,
                                sectionTitle: event.target.value,
                              }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="About section title"
                          />
                          {fieldErrors.aboutTitle ? <p className="admin-modal-error">{fieldErrors.aboutTitle}</p> : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="about-subtitle">
                            Subtitle
                          </Label>
                          <Input
                            id="about-subtitle"
                            value={aboutDraft.subtitle}
                            onChange={(event) =>
                              setAboutDraft((prev) => ({ ...prev, subtitle: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Short subtitle"
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={aboutDraft.status}
                            onValueChange={(value) =>
                              setAboutDraft((prev) => ({
                                ...prev,
                                status: value as FooterGenericStatus,
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Media" description="Section image and preview panel.">
                      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="about-image">
                            Image URL
                          </Label>
                          <Input
                            id="about-image"
                            value={aboutDraft.imageUrl}
                            onChange={(event) =>
                              setAboutDraft((prev) => ({ ...prev, imageUrl: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Paste image URL or upload"
                          />
                        </div>
                        <div className="flex items-end">
                          <Label className="admin-modal-upload-button cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                void updateImageField(event, (value) =>
                                  setAboutDraft((prev) => ({ ...prev, imageUrl: value }))
                                )
                              }
                            />
                          </Label>
                        </div>
                      </div>
                      {aboutDraft.imageUrl ? (
                        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-opacity duration-300">
                          <img src={aboutDraft.imageUrl} alt="About section preview" className="h-44 w-full object-cover" />
                        </div>
                      ) : null}
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Long-form section body and highlight text.">
                      <div className="space-y-5">
                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Body Content</Label>
                          <RichTextEditor
                            value={aboutDraft.content}
                            onChange={(value) =>
                              setAboutDraft((prev) => ({ ...prev, content: value }))
                            }
                            ariaLabel="About content editor"
                            minHeightClassName="min-h-[300px]"
                            stickyToolbar
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="about-highlight">
                            Highlight Text
                          </Label>
                          <Textarea
                            id="about-highlight"
                            value={aboutDraft.highlightText}
                            onChange={(event) =>
                              setAboutDraft((prev) => ({ ...prev, highlightText: event.target.value }))
                            }
                            className={cn(MODAL_TEXTAREA_CLASS, 'min-h-[120px]')}
                            placeholder="Optional highlighted statement"
                          />
                        </div>
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}

                {dialogTab === 'blog' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Post title, slug, and URL preview.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="blog-title">
                            Blog Title
                          </Label>
                          <Input
                            id="blog-title"
                            autoFocus
                            value={blogDraft.title}
                            onChange={(event) => {
                              clearFieldError('blogTitle');
                              const title = event.target.value;
                              setBlogDraft((prev) => ({
                                ...prev,
                                title,
                                slug: prev.slugTouched ? prev.slug : normalizeBlogSlug(title),
                              }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="Blog title"
                          />
                          {fieldErrors.blogTitle ? <p className="admin-modal-error">{fieldErrors.blogTitle}</p> : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="blog-slug">
                            Slug
                          </Label>
                          <Input
                            id="blog-slug"
                            value={blogDraft.slug}
                            onChange={(event) => {
                              clearFieldError('blogSlug');
                              setBlogDraft((prev) => ({
                                ...prev,
                                slug: normalizeBlogSlug(event.target.value),
                                slugTouched: true,
                              }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="slug-will-be-generated"
                          />
                          <p className="admin-modal-helper">URL Preview: {blogUrlPreview}</p>
                          {fieldErrors.blogSlug ? <p className="admin-modal-error">{fieldErrors.blogSlug}</p> : null}
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Media" description="Featured image upload and preview.">
                      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="blog-image">
                            Featured Image
                          </Label>
                          <Input
                            id="blog-image"
                            value={blogDraft.featuredImage}
                            onChange={(event) =>
                              setBlogDraft((prev) => ({ ...prev, featuredImage: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Paste image URL or upload"
                          />
                        </div>
                        <div className="flex items-end">
                          <Label className="admin-modal-upload-button cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                void updateImageField(event, (value) =>
                                  setBlogDraft((prev) => ({ ...prev, featuredImage: value }))
                                )
                              }
                            />
                          </Label>
                        </div>
                      </div>
                      {blogDraft.featuredImage ? (
                        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-opacity duration-300">
                          <img src={blogDraft.featuredImage} alt="Blog featured preview" className="h-48 w-full object-cover" />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background/20 px-4 py-7 text-sm text-muted-foreground">
                          Image preview appears after selecting or pasting a valid image.
                        </div>
                      )}
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Summary and long-form rich editor.">
                      <div className="space-y-5">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="blog-short-description">
                            Short Description
                          </Label>
                          <Textarea
                            id="blog-short-description"
                            value={blogDraft.shortDescription}
                            onChange={(event) => {
                              clearFieldError('blogShortDescription');
                              setBlogDraft((prev) => ({
                                ...prev,
                                shortDescription: event.target.value,
                              }));
                            }}
                            className={cn(MODAL_TEXTAREA_CLASS, 'min-h-[130px]')}
                            placeholder="Summary shown in blog cards"
                          />
                          <p className="admin-modal-counter" data-over={blogSummaryOverLimit ? 'true' : 'false'}>
                            {blogDraft.shortDescription.length}/{SUMMARY_LIMIT}
                          </p>
                          {fieldErrors.blogShortDescription ? (
                            <p className="admin-modal-error">{fieldErrors.blogShortDescription}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Full Content</Label>
                          <RichTextEditor
                            value={blogDraft.fullContent}
                            onChange={(value) =>
                              setBlogDraft((prev) => ({ ...prev, fullContent: value }))
                            }
                            ariaLabel="Blog full content editor"
                            minHeightClassName="min-h-[320px]"
                            stickyToolbar
                          />
                        </div>
                      </div>
                    </AdminModalSection>

                    <Collapsible open={blogSeoOpen} onOpenChange={setBlogSeoOpen} className="admin-modal-section p-0">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                        <div>
                          <p className="text-sm font-semibold text-foreground">SEO</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Search metadata fields with character guidance.
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            blogSeoOpen && 'rotate-180'
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t border-border/60 px-5 pb-5 pt-4">
                        <div className="space-y-5">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <Label className={MODAL_LABEL_CLASS} htmlFor="blog-meta-title">
                                Meta Title
                              </Label>
                              <Input
                                id="blog-meta-title"
                                value={blogDraft.metaTitle}
                                onChange={(event) =>
                                  setBlogDraft((prev) => ({ ...prev, metaTitle: event.target.value }))
                                }
                                className={MODAL_INPUT_CLASS}
                                placeholder="SEO title"
                              />
                            </div>

                            <div>
                              <Label className={MODAL_LABEL_CLASS} htmlFor="blog-date-label">
                                Date Label
                              </Label>
                              <Input
                                id="blog-date-label"
                                value={blogDraft.dateLabel}
                                onChange={(event) =>
                                  setBlogDraft((prev) => ({ ...prev, dateLabel: event.target.value }))
                                }
                                className={MODAL_INPUT_CLASS}
                                placeholder="Feb 17, 2026"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className={MODAL_LABEL_CLASS} htmlFor="blog-meta-description">
                              Meta Description
                            </Label>
                            <Textarea
                              id="blog-meta-description"
                              value={blogDraft.metaDescription}
                              onChange={(event) => {
                                clearFieldError('blogMetaDescription');
                                setBlogDraft((prev) => ({
                                  ...prev,
                                  metaDescription: event.target.value,
                                }));
                              }}
                              className={cn(MODAL_TEXTAREA_CLASS, 'min-h-[120px]')}
                              placeholder="SEO description"
                            />
                            <p className="admin-modal-counter" data-over={blogMetaOverLimit ? 'true' : 'false'}>
                              {blogDraft.metaDescription.length}/{META_DESCRIPTION_LIMIT}
                            </p>
                            {fieldErrors.blogMetaDescription ? (
                              <p className="admin-modal-error">{fieldErrors.blogMetaDescription}</p>
                            ) : null}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {!editingId ? (
                      <p className="text-xs text-muted-foreground">
                        Blog drafts continue to auto-save locally while this modal remains open.
                      </p>
                    ) : null}
                  </>
                ) : null}

                {dialogTab === 'careers' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Role details and listing status.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="career-title">
                            Job Title
                          </Label>
                          <Input
                            id="career-title"
                            autoFocus
                            value={careerDraft.jobTitle}
                            onChange={(event) => {
                              clearFieldError('careerJobTitle');
                              setCareerDraft((prev) => ({ ...prev, jobTitle: event.target.value }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="Frontend Engineer"
                          />
                          {fieldErrors.careerJobTitle ? (
                            <p className="admin-modal-error">{fieldErrors.careerJobTitle}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="career-location">
                            Location
                          </Label>
                          <Input
                            id="career-location"
                            value={careerDraft.location}
                            onChange={(event) =>
                              setCareerDraft((prev) => ({ ...prev, location: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Remote"
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="career-type">
                            Job Type
                          </Label>
                          <Input
                            id="career-type"
                            value={careerDraft.jobType}
                            onChange={(event) =>
                              setCareerDraft((prev) => ({ ...prev, jobType: event.target.value }))
                            }
                            className={MODAL_INPUT_CLASS}
                            placeholder="Full-time"
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={careerDraft.status}
                            onValueChange={(value) =>
                              setCareerDraft((prev) => ({
                                ...prev,
                                status: value as 'open' | 'closed',
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Detailed role overview for applicants.">
                      <div>
                        <Label className={MODAL_LABEL_CLASS}>Description</Label>
                        <RichTextEditor
                          value={careerDraft.description}
                          onChange={(value) =>
                            setCareerDraft((prev) => ({ ...prev, description: value }))
                          }
                          ariaLabel="Career description editor"
                          minHeightClassName="min-h-[300px]"
                          stickyToolbar
                        />
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Requirements" description="Skills and expectations for this role.">
                      <div>
                        <Label className={MODAL_LABEL_CLASS}>Requirements</Label>
                        <RichTextEditor
                          value={careerDraft.requirements}
                          onChange={(value) =>
                            setCareerDraft((prev) => ({ ...prev, requirements: value }))
                          }
                          ariaLabel="Career requirements editor"
                          minHeightClassName="min-h-[260px]"
                          stickyToolbar
                        />
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}

                {dialogTab === 'privacy_policy' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Policy heading, status, and date.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="privacy-title">
                            Section Title
                          </Label>
                          <Input
                            id="privacy-title"
                            autoFocus
                            value={privacyDraft.sectionTitle}
                            onChange={(event) => {
                              clearFieldError('privacyTitle');
                              setPrivacyDraft((prev) => ({
                                ...prev,
                                sectionTitle: event.target.value,
                              }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="Information We Collect"
                          />
                          {fieldErrors.privacyTitle ? (
                            <p className="admin-modal-error">{fieldErrors.privacyTitle}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="privacy-date">
                            Last Updated Date
                          </Label>
                          <Input
                            id="privacy-date"
                            type="date"
                            value={privacyDraft.lastUpdatedDate}
                            onChange={(event) =>
                              setPrivacyDraft((prev) => ({
                                ...prev,
                                lastUpdatedDate: event.target.value,
                              }))
                            }
                            className={MODAL_INPUT_CLASS}
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={privacyDraft.status}
                            onValueChange={(value) =>
                              setPrivacyDraft((prev) => ({
                                ...prev,
                                status: value as FooterGenericStatus,
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Policy text with rich formatting.">
                      <div>
                        <Label className={MODAL_LABEL_CLASS}>Policy Content</Label>
                        <RichTextEditor
                          value={privacyDraft.content}
                          onChange={(value) =>
                            setPrivacyDraft((prev) => ({ ...prev, content: value }))
                          }
                          ariaLabel="Privacy policy content editor"
                          minHeightClassName="min-h-[320px]"
                          stickyToolbar
                        />
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}

                {dialogTab === 'terms_of_service' ? (
                  <>
                    <AdminModalSection title="Basic Info" description="Terms heading, status, and date.">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="terms-title">
                            Section Title
                          </Label>
                          <Input
                            id="terms-title"
                            autoFocus
                            value={termsDraft.sectionTitle}
                            onChange={(event) => {
                              clearFieldError('termsTitle');
                              setTermsDraft((prev) => ({
                                ...prev,
                                sectionTitle: event.target.value,
                              }));
                            }}
                            className={MODAL_INPUT_CLASS}
                            placeholder="Acceptance of Terms"
                          />
                          {fieldErrors.termsTitle ? (
                            <p className="admin-modal-error">{fieldErrors.termsTitle}</p>
                          ) : null}
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS} htmlFor="terms-date">
                            Last Updated Date
                          </Label>
                          <Input
                            id="terms-date"
                            type="date"
                            value={termsDraft.lastUpdatedDate}
                            onChange={(event) =>
                              setTermsDraft((prev) => ({
                                ...prev,
                                lastUpdatedDate: event.target.value,
                              }))
                            }
                            className={MODAL_INPUT_CLASS}
                          />
                        </div>

                        <div>
                          <Label className={MODAL_LABEL_CLASS}>Status</Label>
                          <Select
                            value={termsDraft.status}
                            onValueChange={(value) =>
                              setTermsDraft((prev) => ({
                                ...prev,
                                status: value as FooterGenericStatus,
                              }))
                            }
                          >
                            <SelectTrigger className={MODAL_SELECT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AdminModalSection>

                    <AdminModalSection title="Content" description="Terms text with rich formatting.">
                      <div>
                        <Label className={MODAL_LABEL_CLASS}>Terms Content</Label>
                        <RichTextEditor
                          value={termsDraft.content}
                          onChange={(value) =>
                            setTermsDraft((prev) => ({ ...prev, content: value }))
                          }
                          ariaLabel="Terms of service content editor"
                          minHeightClassName="min-h-[320px]"
                          stickyToolbar
                        />
                      </div>
                    </AdminModalSection>
                  </>
                ) : null}
              </div>
      </AdminModal>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setSoftDelete(true);
          }
        }}
      >
        <AlertDialogContent className="border-border/70 bg-card/95">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.title}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-border/70 bg-background/35 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Soft delete</p>
                <p className="text-xs text-muted-foreground">
                  Keep data for recovery and hide it from active lists.
                </p>
              </div>
              <Switch
                checked={softDelete}
                onCheckedChange={setSoftDelete}
                aria-label="Toggle soft delete"
                disabled={deleting}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteEntry();
              }}
              disabled={deleting}
              className={cn(
                !softDelete && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : softDelete ? (
                'Soft Delete'
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl border-border/70 bg-card/95 p-0">
          <div className="grid h-full grid-rows-[auto,1fr]">
            <div className="border-b border-border/60 px-5 py-4">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-base">
                  {MANAGED_TAB_CONFIG.find((entry) => entry.key === historyTab)?.title} Version
                  History
                </DialogTitle>
                <DialogDescription>Recent create, update, and delete snapshots.</DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="h-full min-h-0 px-5 py-4">
              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading history...
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border/70 bg-background/35 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {resolveHistoryLabel(entry)}
                        </p>
                        <Badge variant="outline" className="rounded-full text-[11px]">
                          {capitalize(entry.action)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatSavedAt(entry.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
