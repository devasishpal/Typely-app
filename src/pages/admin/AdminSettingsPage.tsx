
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ComponentType } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import RichTextEditor from '@/components/admin/settings/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  FileText,
  GripVertical,
  History,
  Info,
  LifeBuoy,
  Loader2,
  Mail,
  Newspaper,
  PenSquare,
  Plus,
  Save,
  Settings2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';

type FooterField =
  | 'support_center'
  | 'faq'
  | 'contact_us'
  | 'about'
  | 'blog'
  | 'careers'
  | 'privacy_policy'
  | 'terms_of_service';

type SectionStatus = 'draft' | 'published';
type SectionMode = 'simple' | 'advanced';
type SectionViewMode = 'edit' | 'preview';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type AnimationType = 'none' | 'fade-in' | 'fade-up' | 'slide-up';

interface SiteSettingsRow {
  id: string;
  typing_test_times: number[] | string[] | null;
  support_center: string | null;
  faq: string | null;
  contact_us: string | null;
  about: string | null;
  blog: string | null;
  careers: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
  updated_at: string | null;
}

interface SeoState {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

interface SectionBlock {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
}

interface FaqCategory {
  id: string;
  name: string;
}

interface FaqEntry {
  id: string;
  question: string;
  answerHtml: string;
  categoryId: string;
  enabled: boolean;
}

interface SectionHistorySnapshot {
  id: string;
  savedAt: string;
  html: string;
  mode: SectionMode;
  animation: AnimationType;
  seo: SeoState;
  blocks: SectionBlock[];
  faqCategories: FaqCategory[];
  faqItems: FaqEntry[];
}

interface FooterSectionState {
  html: string;
  viewMode: SectionViewMode;
  mode: SectionMode;
  animation: AnimationType;
  seo: SeoState;
  blocks: SectionBlock[];
  faqCategories: FaqCategory[];
  faqItems: FaqEntry[];
  status: SectionStatus;
  expanded: boolean;
  dirty: boolean;
  saveState: SaveState;
  lastSavedAt: string | null;
  history: SectionHistorySnapshot[];
}

interface SectionMetaStorage {
  seo: SeoState;
  mode: SectionMode;
  animation: AnimationType;
  blocks: SectionBlock[];
  faqCategories: FaqCategory[];
  faqItems: FaqEntry[];
}

interface BlogPreviewPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
}

type SectionMetaMap = Partial<Record<FooterField, SectionMetaStorage>>;
type SectionHistoryMap = Partial<Record<FooterField, SectionHistorySnapshot[]>>;

const SECTION_META_STORAGE_KEY = 'typely_admin_settings_section_meta_v1';
const SECTION_HISTORY_STORAGE_KEY = 'typely_admin_settings_section_history_v1';
const SECTION_GLOBAL_MODE_STORAGE_KEY = 'typely_admin_settings_global_mode_v1';
const MAX_HISTORY_ITEMS = 12;

const FOOTER_SECTIONS: Array<{
  field: FooterField;
  title: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    field: 'support_center',
    title: 'Support Center',
    icon: LifeBuoy,
    description: 'Help guides, support details, and resources.',
  },
  {
    field: 'faq',
    title: 'FAQ',
    icon: CircleHelp,
    description: 'Questions grouped by category with structured answers.',
  },
  {
    field: 'contact_us',
    title: 'Contact Us',
    icon: Mail,
    description: 'Contact channels and inquiry messaging.',
  },
  {
    field: 'about',
    title: 'About',
    icon: Info,
    description: 'Company background and mission details.',
  },
  {
    field: 'blog',
    title: 'Blog',
    icon: Newspaper,
    description: 'Blog cards with title, content, and featured image.',
  },
  {
    field: 'careers',
    title: 'Careers',
    icon: BriefcaseBusiness,
    description: 'Open roles and career information.',
  },
  {
    field: 'privacy_policy',
    title: 'Privacy Policy',
    icon: Shield,
    description: 'Data and privacy legal terms.',
  },
  {
    field: 'terms_of_service',
    title: 'Terms of Service',
    icon: FileText,
    description: 'Service terms and legal obligations.',
  },
];

const ANIMATION_OPTIONS: Array<{ value: AnimationType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'slide-up', label: 'Slide Up' },
];

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function siteSettingsQuery() {
  return supabase.from('site_settings' as any);
}

function safeJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = safeJson<T>(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function escapeHtml(raw: string) {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(raw: string) {
  return /<\/?[a-z][\s\S]*>/i.test(raw);
}

function stripHtml(raw: string) {
  if (!raw) return '';

  const container = document.createElement('div');
  container.innerHTML = raw;
  return (container.textContent || '').trim();
}

function plainTextToHtml(raw: string) {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`)
    .join('');
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

function formatSavedAt(raw: string | null) {
  if (!raw) return 'Not saved yet';
  const parsedDate = new Date(raw);
  if (Number.isNaN(parsedDate.getTime())) return 'Saved recently';
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createDefaultSeo(title: string, field: FooterField): SeoState {
  const defaultSlug = field === 'terms_of_service' ? 'terms' : field.replace(/_/g, '-');
  return {
    metaTitle: title,
    metaDescription: `Read ${title} details on Typely.`,
    slug: defaultSlug,
    ogTitle: title,
    ogDescription: `Learn more about ${title} on Typely.`,
    ogImage: '',
  };
}

function createDefaultBlock(order: number) {
  return {
    id: createId(),
    title: `Section ${order}`,
    content: '',
    imageUrl: '',
    ctaLabel: '',
    ctaUrl: '',
  } satisfies SectionBlock;
}

function parseFaqData(raw: string): { categories: FaqCategory[]; items: FaqEntry[] } {
  const normalized = raw.trim();
  if (!normalized) {
    const generalId = createId();
    return {
      categories: [{ id: generalId, name: 'General' }],
      items: [
        {
          id: createId(),
          question: '',
          answerHtml: '',
          categoryId: generalId,
          enabled: true,
        },
      ],
    };
  }

  const parsedArray = safeJson<Array<Record<string, unknown>>>(normalized);
  if (Array.isArray(parsedArray)) {
    const categories: FaqCategory[] = [];
    const categoryByName = new Map<string, string>();
    const getCategoryId = (name: string) => {
      const key = name.trim().toLowerCase() || 'general';
      const existing = categoryByName.get(key);
      if (existing) return existing;

      const id = createId();
      const label = name.trim() || 'General';
      categoryByName.set(key, id);
      categories.push({ id, name: label });
      return id;
    };

    const items = parsedArray
      .map((entry) => {
        const question =
          typeof entry.question === 'string'
            ? entry.question
            : typeof entry.title === 'string'
              ? entry.title
              : '';
        const answer =
          typeof entry.answer === 'string'
            ? entry.answer
            : typeof entry.content === 'string'
              ? entry.content
              : '';
        const categoryName =
          typeof entry.category === 'string'
            ? entry.category
            : typeof entry.category_name === 'string'
              ? entry.category_name
              : 'General';
        const enabled = typeof entry.enabled === 'boolean' ? entry.enabled : true;

        return {
          id: createId(),
          question,
          answerHtml: looksLikeHtml(answer) ? answer : plainTextToHtml(answer),
          categoryId: getCategoryId(categoryName),
          enabled,
        } satisfies FaqEntry;
      })
      .filter((item) => item.question.trim() || stripHtml(item.answerHtml).trim());

    if (items.length > 0) {
      return {
        categories: categories.length > 0 ? categories : [{ id: createId(), name: 'General' }],
        items,
      };
    }
  }

  const fallbackCategoryId = createId();
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const fallbackItems = blocks.map((block) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const question = lines[0]?.replace(/^q(?:uestion)?\s*[:\-]\s*/i, '').trim() || '';
    const answer = lines.slice(1).join('\n').replace(/^a(?:nswer)?\s*[:\-]\s*/i, '').trim();

    return {
      id: createId(),
      question,
      answerHtml: plainTextToHtml(answer),
      categoryId: fallbackCategoryId,
      enabled: true,
    } satisfies FaqEntry;
  });

  return {
    categories: [{ id: fallbackCategoryId, name: 'General' }],
    items:
      fallbackItems.length > 0
        ? fallbackItems
        : [
            {
              id: createId(),
              question: '',
              answerHtml: '',
              categoryId: fallbackCategoryId,
              enabled: true,
            },
          ],
  };
}

function parseBlogBlocks(raw: string): SectionBlock[] {
  const normalized = raw.trim();
  if (!normalized) return [];

  const parsedArray = safeJson<Array<Record<string, unknown>>>(normalized);
  if (!Array.isArray(parsedArray)) return [];

  return parsedArray.map((entry, index) => {
    const title =
      typeof entry.title === 'string'
        ? entry.title
        : typeof entry.heading === 'string'
          ? entry.heading
          : `Post ${index + 1}`;
    const content =
      typeof entry.content === 'string'
        ? entry.content
        : typeof entry.description === 'string'
          ? entry.description
          : '';
    const imageUrl =
      typeof entry.image === 'string'
        ? entry.image
        : typeof entry.image_url === 'string'
          ? entry.image_url
          : '';
    const ctaUrl =
      typeof entry.link === 'string'
        ? entry.link
        : typeof entry.url === 'string'
          ? entry.url
          : '';

    return {
      id: createId(),
      title,
      content,
      imageUrl,
      ctaLabel: 'Read More',
      ctaUrl,
    } satisfies SectionBlock;
  });
}

function blocksToHtml(blocks: SectionBlock[]) {
  return blocks
    .map((block) => {
      const title = block.title.trim() ? `<h2>${escapeHtml(block.title.trim())}</h2>` : '';
      const rawContent = block.content.trim();
      const content = rawContent
        ? looksLikeHtml(rawContent)
          ? rawContent
          : `<p>${escapeHtml(rawContent).replace(/\n/g, '<br/>')}</p>`
        : '';
      const image = block.imageUrl.trim()
        ? `<img src="${escapeHtml(block.imageUrl.trim())}" alt="${escapeHtml(
            block.title.trim() || 'Section image'
          )}" style="margin:12px 0;border-radius:12px;max-width:100%;" />`
        : '';
      const cta =
        block.ctaLabel.trim() && block.ctaUrl.trim()
          ? `<p><a href="${escapeHtml(
              block.ctaUrl.trim()
            )}" style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(56,189,248,.16);color:#bae6fd;text-decoration:none;">${escapeHtml(
              block.ctaLabel.trim()
            )}</a></p>`
          : '';

      return `<section>${title}${content}${image}${cta}</section>`;
    })
    .join('');
}

function htmlToBlogPost(html: string): BlogPreviewPost {
  const text = stripHtml(html);
  const title = text.slice(0, 70).trim() || 'Post';
  const excerpt = text.length > 180 ? `${text.slice(0, 177).trim()}...` : text || 'Blog content';
  return {
    id: createId(),
    title,
    excerpt,
    content: text || 'Blog content',
    imageUrl: '',
    linkUrl: '',
  };
}

function buildBlogPosts(section: FooterSectionState): BlogPreviewPost[] {
  if (section.mode === 'advanced' && section.blocks.length > 0) {
    return section.blocks
      .map((block, index) => {
        const content = block.content.trim();
        const plainContent = stripHtml(content);
        if (!block.title.trim() && !plainContent && !block.imageUrl.trim()) {
          return null;
        }

        const excerpt =
          plainContent.length > 180
            ? `${plainContent.slice(0, 177).trim()}...`
            : plainContent || 'Blog content';
        return {
          id: block.id,
          title: block.title.trim() || `Post ${index + 1}`,
          excerpt,
          content: plainContent || excerpt,
          imageUrl: block.imageUrl.trim(),
          linkUrl: block.ctaUrl.trim(),
        } satisfies BlogPreviewPost;
      })
      .filter((post): post is BlogPreviewPost => Boolean(post));
  }

  if (!stripHtml(section.html).trim()) {
    return [];
  }

  return [htmlToBlogPost(section.html)];
}

function computeSectionStatus(field: FooterField, section: FooterSectionState): SectionStatus {
  if (field === 'faq') {
    const hasFaq = section.faqItems.some(
      (item) => item.enabled && item.question.trim() && stripHtml(item.answerHtml).trim()
    );
    return hasFaq ? 'published' : 'draft';
  }

  if (field === 'blog') {
    return buildBlogPosts(section).length > 0 ? 'published' : 'draft';
  }

  if (section.mode === 'advanced') {
    const hasBlocks = section.blocks.some(
      (block) =>
        block.title.trim() ||
        stripHtml(block.content).trim() ||
        block.imageUrl.trim() ||
        (block.ctaLabel.trim() && block.ctaUrl.trim())
    );
    return hasBlocks ? 'published' : 'draft';
  }

  return stripHtml(section.html).trim() ? 'published' : 'draft';
}

function buildInitialSectionState(
  field: FooterField,
  title: string,
  rawValue: string,
  meta: SectionMetaStorage | undefined,
  history: SectionHistorySnapshot[],
  expanded: boolean
): FooterSectionState {
  const seo = meta?.seo ?? createDefaultSeo(title, field);
  const defaultMode: SectionMode = field === 'blog' ? 'advanced' : 'simple';
  const mode = meta?.mode ?? defaultMode;
  const animation = meta?.animation ?? 'fade-up';

  const faqParsed = field === 'faq' ? parseFaqData(rawValue) : null;
  const blogBlocksFromRaw = field === 'blog' ? parseBlogBlocks(rawValue) : [];

  const htmlSource =
    rawValue.trim() && !looksLikeHtml(rawValue) && field !== 'faq' && field !== 'blog'
      ? plainTextToHtml(rawValue)
      : rawValue.trim();

  const state: FooterSectionState = {
    html:
      field === 'faq'
        ? ''
        : field === 'blog'
          ? meta?.blocks?.length
            ? blocksToHtml(meta.blocks)
            : plainTextToHtml(rawValue)
          : htmlSource,
    viewMode: 'edit',
    mode,
    animation,
    seo,
    blocks: meta?.blocks ?? (blogBlocksFromRaw.length > 0 ? blogBlocksFromRaw : []),
    faqCategories: meta?.faqCategories ?? faqParsed?.categories ?? [],
    faqItems: meta?.faqItems ?? faqParsed?.items ?? [],
    status: 'draft',
    expanded,
    dirty: false,
    saveState: 'idle',
    lastSavedAt: null,
    history: history.slice(0, MAX_HISTORY_ITEMS),
  };

  state.status = computeSectionStatus(field, state);
  return state;
}

function createHistorySnapshot(section: FooterSectionState): SectionHistorySnapshot {
  return {
    id: createId(),
    savedAt: new Date().toISOString(),
    html: section.html,
    mode: section.mode,
    animation: section.animation,
    seo: { ...section.seo },
    blocks: section.blocks.map((block) => ({ ...block })),
    faqCategories: section.faqCategories.map((category) => ({ ...category })),
    faqItems: section.faqItems.map((item) => ({ ...item })),
  };
}

function serializeSectionValue(field: FooterField, section: FooterSectionState) {
  if (field === 'faq') {
    const categoriesById = new Map(section.faqCategories.map((category) => [category.id, category.name]));

    return JSON.stringify(
      section.faqItems.map((item) => ({
        question: item.question,
        answer: item.answerHtml,
        category: categoriesById.get(item.categoryId) || 'General',
        enabled: item.enabled,
      }))
    );
  }

  if (field === 'blog') {
    return JSON.stringify(buildBlogPosts(section));
  }

  if (section.mode === 'advanced' && section.blocks.length > 0) {
    return blocksToHtml(section.blocks);
  }

  return section.html.trim();
}

function extractMetaFromSections(sections: Record<FooterField, FooterSectionState>): SectionMetaMap {
  const metaMap: SectionMetaMap = {};

  for (const section of FOOTER_SECTIONS) {
    const current = sections[section.field];
    metaMap[section.field] = {
      seo: { ...current.seo },
      mode: current.mode,
      animation: current.animation,
      blocks: current.blocks.map((block) => ({ ...block })),
      faqCategories: current.faqCategories.map((category) => ({ ...category })),
      faqItems: current.faqItems.map((item) => ({ ...item })),
    };
  }

  return metaMap;
}

function extractHistoryFromSections(sections: Record<FooterField, FooterSectionState>): SectionHistoryMap {
  const historyMap: SectionHistoryMap = {};

  for (const section of FOOTER_SECTIONS) {
    historyMap[section.field] = sections[section.field].history.slice(0, MAX_HISTORY_ITEMS);
  }

  return historyMap;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);
  const [typingTestTimes, setTypingTestTimes] = useState<number[]>([]);
  const [typingTimesDirty, setTypingTimesDirty] = useState(false);
  const [testOptionsOpen, setTestOptionsOpen] = useState(false);
  const [testTimesInput, setTestTimesInput] = useState('');
  const [activeSeoField, setActiveSeoField] = useState<FooterField | null>(null);
  const [activeHistoryField, setActiveHistoryField] = useState<FooterField | null>(null);
  const [globalMode, setGlobalMode] = useState<SectionMode>('simple');
  const [draggingBlock, setDraggingBlock] = useState<{ field: FooterField; blockId: string } | null>(null);
  const [draggingFaqItemId, setDraggingFaqItemId] = useState<string | null>(null);
  const [newFaqCategoryName, setNewFaqCategoryName] = useState('');
  const [autoSaveState, setAutoSaveState] = useState<SaveState>('idle');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<FooterField, FooterSectionState>>(() => {
    const initial = {} as Record<FooterField, FooterSectionState>;
    FOOTER_SECTIONS.forEach((section, index) => {
      initial[section.field] = buildInitialSectionState(section.field, section.title, '', undefined, [], index < 2);
    });
    return initial;
  });

  const currentHistorySection = activeHistoryField ? sections[activeHistoryField] : null;
  const currentSeoSection = activeSeoField ? sections[activeSeoField] : null;

  const dirtyFields = useMemo(
    () =>
      FOOTER_SECTIONS.filter((section) => sections[section.field].dirty).map(
        (section) => section.field
      ),
    [sections]
  );
  const hasUnsavedChanges = dirtyFields.length > 0 || typingTimesDirty;

  const sectionTitleMap = useMemo(
    () =>
      new Map<FooterField, string>(
        FOOTER_SECTIONS.map((section) => [section.field, section.title])
      ),
    []
  );

  const updateSection = (
    field: FooterField,
    updater: (current: FooterSectionState) => FooterSectionState,
    options?: { markDirty?: boolean }
  ) => {
    const markDirty = options?.markDirty ?? true;
    setSections((prev) => {
      const current = prev[field];
      const updated = updater(current);
      const status = computeSectionStatus(field, updated);
      return {
        ...prev,
        [field]: {
          ...updated,
          status,
          dirty: markDirty ? true : updated.dirty,
          saveState: markDirty ? 'idle' : updated.saveState,
        },
      };
    });
  };

  const setSectionSaveState = (fields: FooterField[], state: SaveState) => {
    if (fields.length === 0) return;
    setSections((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = {
          ...next[field],
          saveState: state,
        };
      });
      return next;
    });
  };

  const markSectionsSaved = (fields: FooterField[], savedAt: string) => {
    if (fields.length === 0) return;
    setSections((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        const current = next[field];
        const snapshot = createHistorySnapshot(current);
        next[field] = {
          ...current,
          dirty: false,
          saveState: 'saved',
          lastSavedAt: savedAt,
          history: [snapshot, ...current.history].slice(0, MAX_HISTORY_ITEMS),
          status: computeSectionStatus(field, current),
        };
      });
      return next;
    });

    window.setTimeout(() => {
      setSections((prev) => {
        const next = { ...prev };
        fields.forEach((field) => {
          if (next[field].saveState === 'saved') {
            next[field] = {
              ...next[field],
              saveState: 'idle',
            };
          }
        });
        return next;
      });
    }, 1800);
  };

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: loadError } = await siteSettingsQuery()
        .select('*')
        .limit(1)
        .maybeSingle();

      if (loadError) throw loadError;

      let row = data as SiteSettingsRow | null;
      if (!row) {
        const { data: created, error: createError } = await (siteSettingsQuery() as any)
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
          .select('*')
          .maybeSingle();

        if (createError) throw createError;
        row = created as SiteSettingsRow | null;
      }

      if (!row) throw new Error('Failed to initialize site settings.');

      const parsedTimes = Array.isArray(row.typing_test_times)
        ? Array.from(
            new Set(
              row.typing_test_times
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
            )
          ).sort((left, right) => left - right)
        : [30, 60, 120];

      const safeTimes = parsedTimes.length > 0 ? parsedTimes : [30, 60, 120];
      const storedMeta = readStorage<SectionMetaMap>(SECTION_META_STORAGE_KEY, {});
      const storedHistory = readStorage<SectionHistoryMap>(SECTION_HISTORY_STORAGE_KEY, {});
      const storedGlobalModeRaw = readStorage<string>(
        SECTION_GLOBAL_MODE_STORAGE_KEY,
        'simple'
      );
      const storedGlobalMode: SectionMode =
        storedGlobalModeRaw === 'advanced' ? 'advanced' : 'simple';

      setGlobalMode(storedGlobalMode);
      setSettings(row);
      setTypingTestTimes(safeTimes);
      setTypingTimesDirty(false);
      setTestTimesInput(safeTimes.join(', '));
      setLastAutoSavedAt(row.updated_at);
      setAutoSaveState('idle');

      const hydratedSections = {} as Record<FooterField, FooterSectionState>;
      FOOTER_SECTIONS.forEach((section, index) => {
        const rawValue = (row?.[section.field] ?? '').toString();
        const meta = storedMeta[section.field];
        const history = Array.isArray(storedHistory[section.field])
          ? (storedHistory[section.field] as SectionHistorySnapshot[])
          : [];
        const initial = buildInitialSectionState(
          section.field,
          section.title,
          rawValue,
          meta,
          history,
          index < 2
        );

        if (
          storedGlobalMode === 'advanced' &&
          section.field !== 'faq' &&
          initial.mode !== 'advanced'
        ) {
          initial.mode = 'advanced';
        }

        hydratedSections[section.field] = initial;
      });
      setSections(hydratedSections);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings.';
      setError(message);
      toast({
        title: 'Settings load failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettingsToDatabase = async ({
    fields,
    includeTypingTimes,
    auto,
    successDescription,
  }: {
    fields: FooterField[];
    includeTypingTimes: boolean;
    auto: boolean;
    successDescription: string;
  }) => {
    const uniqueFields = Array.from(new Set(fields));
    if (uniqueFields.length === 0 && !includeTypingTimes) return;

    setSectionSaveState(uniqueFields, 'saving');
    if (auto) {
      setAutoSaveState('saving');
    } else {
      setSaving(true);
    }

    try {
      const savedAt = new Date().toISOString();
      const partialPayload: Record<string, unknown> = {
        updated_at: savedAt,
      };
      uniqueFields.forEach((field) => {
        partialPayload[field] = serializeSectionValue(field, sections[field]);
      });
      if (includeTypingTimes) {
        partialPayload.typing_test_times = typingTestTimes;
      }

      if (!settings?.id) {
        const fullPayload: Record<string, unknown> = {
          updated_at: savedAt,
          typing_test_times: typingTestTimes,
        };
        FOOTER_SECTIONS.forEach((section) => {
          fullPayload[section.field] = serializeSectionValue(
            section.field,
            sections[section.field]
          );
        });

        const { data: created, error: createError } = await (siteSettingsQuery() as any)
          .insert(fullPayload)
          .select('*')
          .maybeSingle();

        if (createError) throw createError;
        if (created) {
          setSettings(created as SiteSettingsRow);
        }
      } else {
        const { error: saveError } = await (siteSettingsQuery() as any)
          .update(partialPayload)
          .eq('id', settings.id);

        if (saveError) throw saveError;

        setSettings((prev) =>
          prev
            ? {
                ...prev,
                updated_at: savedAt,
              }
            : prev
        );
      }

      if (includeTypingTimes) {
        setTypingTimesDirty(false);
      }

      markSectionsSaved(uniqueFields, savedAt);
      setLastAutoSavedAt(savedAt);

      if (auto) {
        setAutoSaveState('saved');
      } else {
        setAutoSaveState('idle');
        toast({
          title: 'Saved',
          description: successDescription,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings.';
      setSectionSaveState(uniqueFields, 'error');
      if (auto) {
        setAutoSaveState('error');
      } else {
        setError(message);
        toast({
          title: 'Save failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      if (!auto) {
        setSaving(false);
      }
    }
  };

  const handleSaveSettings = async () => {
    await saveSettingsToDatabase({
      fields: FOOTER_SECTIONS.map((section) => section.field),
      includeTypingTimes: true,
      auto: false,
      successDescription: 'All settings have been saved.',
    });
  };

  const handleSaveSection = async (field: FooterField) => {
    await saveSettingsToDatabase({
      fields: [field],
      includeTypingTimes: false,
      auto: false,
      successDescription: `${sectionTitleMap.get(field) || 'Section'} saved successfully.`,
    });
  };

  const parseTypingTimesInput = () => {
    const parsed = Array.from(
      new Set(
        testTimesInput
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value) && value > 0)
      )
    ).sort((left, right) => left - right);

    if (parsed.length === 0) {
      toast({
        title: 'Invalid durations',
        description: 'Enter at least one valid positive number.',
        variant: 'destructive',
      });
      return;
    }

    setTypingTestTimes(parsed);
    setTypingTimesDirty(true);
    setTestOptionsOpen(false);
  };

  const handleSectionExpandToggle = (field: FooterField, expanded: boolean) => {
    updateSection(
      field,
      (current) => ({
        ...current,
        expanded,
      }),
      { markDirty: false }
    );
  };

  const handleSectionViewModeChange = (
    field: FooterField,
    viewMode: SectionViewMode
  ) => {
    updateSection(
      field,
      (current) => ({
        ...current,
        viewMode,
      }),
      { markDirty: false }
    );
  };

  const handleSectionModeChange = (field: FooterField, mode: SectionMode) => {
    updateSection(field, (current) => ({
      ...current,
      mode,
    }));
  };

  const handleSectionAnimationChange = (
    field: FooterField,
    animation: AnimationType
  ) => {
    updateSection(field, (current) => ({
      ...current,
      animation,
    }));
  };

  const handleSectionHtmlChange = (field: FooterField, html: string) => {
    updateSection(field, (current) => ({
      ...current,
      html,
    }));
  };

  const handleSeoChange = (
    field: FooterField,
    seoKey: keyof SeoState,
    value: string
  ) => {
    updateSection(field, (current) => ({
      ...current,
      seo: {
        ...current.seo,
        [seoKey]: value,
      },
    }));
  };

  const handleSeoOgUpload = async (
    field: FooterField,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleSeoChange(field, 'ogImage', dataUrl);
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

  const handleAddBlock = (field: FooterField) => {
    updateSection(field, (current) => ({
      ...current,
      blocks: [...current.blocks, createDefaultBlock(current.blocks.length + 1)],
    }));
  };

  const handleBlockChange = (
    field: FooterField,
    blockId: string,
    patch: Partial<SectionBlock>
  ) => {
    updateSection(field, (current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block
      ),
    }));
  };

  const handleBlockDelete = (field: FooterField, blockId: string) => {
    updateSection(field, (current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  };

  const handleBlockImageUpload = async (
    field: FooterField,
    blockId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleBlockChange(field, blockId, { imageUrl: dataUrl });
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

  const handleBlockDrop = (field: FooterField, targetBlockId: string) => {
    if (!draggingBlock || draggingBlock.field !== field) return;
    if (draggingBlock.blockId === targetBlockId) {
      setDraggingBlock(null);
      return;
    }

    updateSection(field, (current) => {
      const blocks = [...current.blocks];
      const draggedIndex = blocks.findIndex((block) => block.id === draggingBlock.blockId);
      const targetIndex = blocks.findIndex((block) => block.id === targetBlockId);
      if (draggedIndex === -1 || targetIndex === -1) return current;

      const [dragged] = blocks.splice(draggedIndex, 1);
      blocks.splice(targetIndex, 0, dragged);
      return {
        ...current,
        blocks,
      };
    });
    setDraggingBlock(null);
  };

  const handleAddFaqCategory = () => {
    const categoryName = newFaqCategoryName.trim();
    if (!categoryName) {
      toast({
        title: 'Category name required',
        description: 'Provide a name before adding a category.',
        variant: 'destructive',
      });
      return;
    }

    const exists = sections.faq.faqCategories.some(
      (category) => category.name.trim().toLowerCase() === categoryName.toLowerCase()
    );
    if (exists) {
      toast({
        title: 'Category exists',
        description: 'Use a different category name.',
        variant: 'destructive',
      });
      return;
    }

    updateSection('faq', (current) => ({
      ...current,
      faqCategories: [...current.faqCategories, { id: createId(), name: categoryName }],
    }));
    setNewFaqCategoryName('');
  };

  const handleAddFaqItem = () => {
    updateSection('faq', (current) => {
      const categories =
        current.faqCategories.length > 0
          ? current.faqCategories
          : [{ id: createId(), name: 'General' }];
      return {
        ...current,
        faqCategories: categories,
        faqItems: [
          ...current.faqItems,
          {
            id: createId(),
            question: '',
            answerHtml: '',
            categoryId: categories[0].id,
            enabled: true,
          },
        ],
      };
    });
  };

  const handleFaqItemChange = (faqId: string, patch: Partial<FaqEntry>) => {
    updateSection('faq', (current) => ({
      ...current,
      faqItems: current.faqItems.map((item) =>
        item.id === faqId ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleFaqItemDelete = (faqId: string) => {
    updateSection('faq', (current) => ({
      ...current,
      faqItems: current.faqItems.filter((item) => item.id !== faqId),
    }));
  };

  const handleFaqDrop = (targetFaqId: string) => {
    if (!draggingFaqItemId || draggingFaqItemId === targetFaqId) {
      setDraggingFaqItemId(null);
      return;
    }

    updateSection('faq', (current) => {
      const nextItems = [...current.faqItems];
      const sourceIndex = nextItems.findIndex((item) => item.id === draggingFaqItemId);
      const targetIndex = nextItems.findIndex((item) => item.id === targetFaqId);
      if (sourceIndex === -1 || targetIndex === -1) return current;

      const [dragged] = nextItems.splice(sourceIndex, 1);
      nextItems.splice(targetIndex, 0, dragged);
      return {
        ...current,
        faqItems: nextItems,
      };
    });

    setDraggingFaqItemId(null);
  };

  const handleRestoreSnapshot = (
    field: FooterField,
    snapshot: SectionHistorySnapshot
  ) => {
    updateSection(field, (current) => ({
      ...current,
      html: snapshot.html,
      mode: snapshot.mode,
      animation: snapshot.animation,
      seo: { ...snapshot.seo },
      blocks: snapshot.blocks.map((block) => ({ ...block })),
      faqCategories: snapshot.faqCategories.map((category) => ({ ...category })),
      faqItems: snapshot.faqItems.map((item) => ({ ...item })),
      viewMode: 'edit',
    }));
    setActiveHistoryField(null);
    toast({
      title: 'Version restored',
      description: `${sectionTitleMap.get(field) || 'Section'} was restored from history.`,
    });
  };

  const renderSectionPreview = (field: FooterField, section: FooterSectionState) => {
    const animationProps =
      section.animation === 'none'
        ? {}
        : {
            initial: { opacity: 0, y: section.animation === 'slide-up' ? 22 : 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.32, ease: 'easeOut' as const },
          };

    if (field === 'faq') {
      const groupedCategories = section.faqCategories
        .map((category) => ({
          category,
          items: section.faqItems.filter((item) => item.categoryId === category.id && item.enabled),
        }))
        .filter((entry) => entry.items.length > 0);

      return (
        <motion.div className="space-y-6" {...animationProps}>
          {groupedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Enable FAQ items to preview published content.
            </p>
          ) : (
            groupedCategories.map((entry) => (
              <div key={entry.category.id} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/90">
                  {entry.category.name}
                </h3>
                <div className="space-y-2">
                  {entry.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/70 bg-background/40 p-4"
                    >
                      <p className="text-sm font-semibold text-foreground">{item.question}</p>
                      <div
                        className="admin-settings-preview mt-2 text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html:
                            item.answerHtml ||
                            '<p class="text-muted-foreground">No answer added yet.</p>',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.div>
      );
    }

    if (field === 'blog') {
      const posts = buildBlogPosts(section);
      return (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          {...animationProps}
        >
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blog posts available for preview.</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-xl border border-border/70 bg-background/40 p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-hover"
              >
                <div className="h-32 w-full overflow-hidden rounded-lg bg-muted">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Featured image
                    </div>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-6 text-muted-foreground">
                  {post.excerpt}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 rounded-lg"
                >
                  Read More
                </Button>
              </article>
            ))
          )}
        </motion.div>
      );
    }

    if (field === 'privacy_policy' || field === 'terms_of_service') {
      return (
        <motion.article
          className="admin-settings-preview space-y-4 rounded-xl border border-border/70 bg-background/40 p-5 text-sm leading-7 text-slate-200"
          {...animationProps}
        >
          <div
            dangerouslySetInnerHTML={{
              __html:
                section.html || '<p class="text-muted-foreground">No content available.</p>',
            }}
          />
        </motion.article>
      );
    }

    return (
      <motion.article
        className="admin-settings-preview rounded-xl border border-border/70 bg-background/40 p-5 text-sm leading-7 text-slate-200"
        {...animationProps}
      >
        <div
          dangerouslySetInnerHTML={{
            __html:
              section.mode === 'advanced' && section.blocks.length > 0
                ? blocksToHtml(section.blocks)
                : section.html || '<p class="text-muted-foreground">No content available.</p>',
          }}
        />
      </motion.article>
    );
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    void loadSettings();
  }, [navigate, user]);

  useEffect(() => {
    if (loading) return;
    writeStorage(SECTION_META_STORAGE_KEY, extractMetaFromSections(sections));
    writeStorage(SECTION_HISTORY_STORAGE_KEY, extractHistoryFromSections(sections));
  }, [loading, sections]);

  useEffect(() => {
    writeStorage(SECTION_GLOBAL_MODE_STORAGE_KEY, globalMode);
  }, [globalMode]);

  useEffect(() => {
    if (loading || saving || !hasUnsavedChanges) return;

    const timeoutId = window.setTimeout(() => {
      const changedFields = FOOTER_SECTIONS.filter(
        (section) => sections[section.field].dirty
      ).map((section) => section.field);

      if (changedFields.length === 0 && !typingTimesDirty) return;

      void saveSettingsToDatabase({
        fields: changedFields,
        includeTypingTimes: typingTimesDirty,
        auto: true,
        successDescription: 'Changes were auto-saved.',
      });
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [hasUnsavedChanges, loading, saving, sections, typingTimesDirty]);

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [hasUnsavedChanges]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const renderSectionEditor = (field: FooterField, section: FooterSectionState) => {
    if (field === 'faq') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Categories
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {section.faqCategories.map((category) => (
                <Badge key={category.id} variant="secondary" className="rounded-full px-3 py-1">
                  {category.name}
                </Badge>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={newFaqCategoryName}
                onChange={(event) => setNewFaqCategoryName(event.target.value)}
                placeholder="Add FAQ category"
                className="h-10 rounded-xl"
                aria-label="Add category"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFaqCategory}
                className="h-10 rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {section.faqItems.map((item, index) => (
              <Card
                key={item.id}
                draggable
                onDragStart={() => setDraggingFaqItemId(item.id)}
                onDragEnd={() => setDraggingFaqItemId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleFaqDrop(item.id)}
                className={cn(
                  'border-border/70 bg-background/40 transition-all duration-300',
                  draggingFaqItemId === item.id && 'ring-1 ring-primary/50'
                )}
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      FAQ {index + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`faq-enabled-${item.id}`} className="text-xs">
                          Enabled
                        </Label>
                        <Switch
                          id={`faq-enabled-${item.id}`}
                          checked={item.enabled}
                          onCheckedChange={(checked) =>
                            handleFaqItemChange(item.id, { enabled: checked })
                          }
                          aria-label={`Toggle FAQ ${index + 1}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleFaqItemDelete(item.id)}
                        aria-label={`Delete FAQ ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`faq-question-${item.id}`}>Question</Label>
                      <Input
                        id={`faq-question-${item.id}`}
                        value={item.question}
                        onChange={(event) =>
                          handleFaqItemChange(item.id, { question: event.target.value })
                        }
                        placeholder="Enter question"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.categoryId}
                        onValueChange={(value) =>
                          handleFaqItemChange(item.id, { categoryId: value })
                        }
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {section.faqCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <RichTextEditor
                      value={item.answerHtml}
                      onChange={(nextValue) =>
                        handleFaqItemChange(item.id, { answerHtml: nextValue })
                      }
                      placeholder="Write answer..."
                      minHeightClassName="min-h-[160px]"
                      ariaLabel={`Answer editor for FAQ ${index + 1}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={handleAddFaqItem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </div>
      );
    }

    if (section.mode === 'advanced') {
      return (
        <div className="space-y-4">
          {section.blocks.map((block, index) => (
            <Card
              key={block.id}
              draggable
              onDragStart={() => setDraggingBlock({ field, blockId: block.id })}
              onDragEnd={() => setDraggingBlock(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleBlockDrop(field, block.id)}
              className={cn(
                'border-border/70 bg-background/40 transition-all duration-300',
                draggingBlock?.blockId === block.id && 'ring-1 ring-primary/50'
              )}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GripVertical className="h-4 w-4 cursor-grab" />
                    Block {index + 1}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleBlockDelete(field, block.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete block ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${field}-block-title-${block.id}`}>Section title</Label>
                    <Input
                      id={`${field}-block-title-${block.id}`}
                      value={block.title}
                      onChange={(event) =>
                        handleBlockChange(field, block.id, { title: event.target.value })
                      }
                      className="h-10 rounded-xl"
                      placeholder="Section title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${field}-block-image-${block.id}`}>Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${field}-block-image-${block.id}`}
                        value={block.imageUrl}
                        onChange={(event) =>
                          handleBlockChange(field, block.id, { imageUrl: event.target.value })
                        }
                        className="h-10 rounded-xl"
                        placeholder="https://example.com/image.jpg"
                      />
                      <Label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                        <Upload className="mr-1 h-3.5 w-3.5" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            void handleBlockImageUpload(field, block.id, event)
                          }
                          aria-label={`Upload image for block ${index + 1}`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content block</Label>
                  <RichTextEditor
                    value={block.content}
                    onChange={(nextValue) =>
                      handleBlockChange(field, block.id, { content: nextValue })
                    }
                    placeholder="Add section content..."
                    minHeightClassName="min-h-[140px]"
                    ariaLabel={`Section content editor for block ${index + 1}`}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${field}-block-cta-label-${block.id}`}>CTA label</Label>
                    <Input
                      id={`${field}-block-cta-label-${block.id}`}
                      value={block.ctaLabel}
                      onChange={(event) =>
                        handleBlockChange(field, block.id, { ctaLabel: event.target.value })
                      }
                      className="h-10 rounded-xl"
                      placeholder="Learn more"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${field}-block-cta-url-${block.id}`}>CTA URL</Label>
                    <Input
                      id={`${field}-block-cta-url-${block.id}`}
                      value={block.ctaUrl}
                      onChange={(event) =>
                        handleBlockChange(field, block.id, { ctaUrl: event.target.value })
                      }
                      className="h-10 rounded-xl"
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => handleAddBlock(field)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section Block
          </Button>
        </div>
      );
    }

    return (
      <RichTextEditor
        value={section.html}
        onChange={(nextValue) => handleSectionHtmlChange(field, nextValue)}
        placeholder={`Write ${sectionTitleMap.get(field)} content...`}
        ariaLabel={`${sectionTitleMap.get(field)} editor`}
      />
    );
  };

  const activeSeoTitle = activeSeoField ? sectionTitleMap.get(activeSeoField) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Settings</h1>
          <p className="text-muted-foreground">
            Upgrade footer pages with richer content tools while keeping the Typely dark theme.
          </p>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading settings...
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {FOOTER_SECTIONS.map((section, index) => {
                const current = sections[section.field];
                const Icon = section.icon;
                const savedAtLabel = formatSavedAt(current.lastSavedAt);
                const isPublished = current.status === 'published';

                return (
                  <motion.div
                    key={section.field}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.04 }}
                  >
                    <Collapsible
                      open={current.expanded}
                      onOpenChange={(expanded) =>
                        handleSectionExpandToggle(section.field, expanded)
                      }
                    >
                      <Card className="border-border/70 bg-gradient-card shadow-card transition-all duration-300 hover:border-primary/35 hover:shadow-hover">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            aria-label={`Toggle ${section.title} section`}
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/40">
                                  <Icon className="h-4 w-4 text-primary" />
                                </span>
                                <h2 className="truncate text-base font-semibold text-foreground">
                                  {section.title}
                                </h2>
                                <Badge
                                  variant={isPublished ? 'default' : 'secondary'}
                                  className="rounded-full"
                                >
                                  {isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {section.description}
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300',
                                current.expanded && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="space-y-5 border-t border-border/60 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <Tabs
                                value={current.viewMode}
                                onValueChange={(value) =>
                                  handleSectionViewModeChange(
                                    section.field,
                                    value as SectionViewMode
                                  )
                                }
                              >
                                <TabsList className="grid h-10 w-[220px] grid-cols-2 rounded-xl">
                                  <TabsTrigger value="edit" className="rounded-lg">
                                    <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                                    Edit Mode
                                  </TabsTrigger>
                                  <TabsTrigger value="preview" className="rounded-lg">
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    Preview Mode
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>

                              {section.field !== 'faq' && (
                                <Tabs
                                  value={current.mode}
                                  onValueChange={(value) =>
                                    handleSectionModeChange(
                                      section.field,
                                      value as SectionMode
                                    )
                                  }
                                >
                                  <TabsList className="grid h-10 w-[260px] grid-cols-2 rounded-xl">
                                    <TabsTrigger value="simple" className="rounded-lg">
                                      Simple Mode
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced" className="rounded-lg">
                                      Advanced Section Mode
                                    </TabsTrigger>
                                  </TabsList>
                                </Tabs>
                              )}
                            </div>

                            <Separator />

                            {current.viewMode === 'preview'
                              ? renderSectionPreview(section.field, current)
                              : renderSectionEditor(section.field, current)}

                            <Separator />

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock3 className="h-3.5 w-3.5" />
                                {savedAtLabel}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl"
                                  onClick={() => setActiveSeoField(section.field)}
                                >
                                  <Settings2 className="mr-2 h-4 w-4" />
                                  SEO Settings
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl"
                                  onClick={() => setActiveHistoryField(section.field)}
                                >
                                  <History className="mr-2 h-4 w-4" />
                                  Version History
                                </Button>
                                <Select
                                  value={current.animation}
                                  onValueChange={(value) =>
                                    handleSectionAnimationChange(
                                      section.field,
                                      value as AnimationType
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-9 w-[160px] rounded-xl">
                                    <SelectValue placeholder="Animation" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ANIMATION_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  onClick={() => void handleSaveSection(section.field)}
                                  disabled={saving || current.saveState === 'saving'}
                                  className="settings-ripple-button h-9 rounded-xl px-4"
                                >
                                  {current.saveState === 'saving' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : current.saveState === 'saved' ? (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Save Section
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
              <Card className="border-border/70 bg-gradient-card shadow-card">
                <CardHeader className="space-y-2 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Global Editor Mode
                  </CardTitle>
                  <CardDescription>
                    Switch all sections between simple and advanced editing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={globalMode}
                    onValueChange={(value) => {
                      const next = value as SectionMode;
                      setGlobalMode(next);
                      setSections((prev) => {
                        const updated = { ...prev };
                        FOOTER_SECTIONS.forEach((section) => {
                          if (section.field === 'faq') return;
                          updated[section.field] = {
                            ...updated[section.field],
                            mode: next,
                          };
                        });
                        return updated;
                      });
                    }}
                  >
                    <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl">
                      <TabsTrigger value="simple" className="rounded-lg">
                        Simple Mode
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="rounded-lg">
                        Advanced Mode
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-gradient-card shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Typing Test Settings</CardTitle>
                  <CardDescription>
                    Configure available test durations in minutes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {typingTestTimes.map((time) => (
                      <Badge key={time} variant="secondary" className="rounded-full px-3 py-1">
                        {time} min
                      </Badge>
                    ))}
                  </div>
                  <Dialog open={testOptionsOpen} onOpenChange={setTestOptionsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-xl"
                        onClick={() => setTestTimesInput(typingTestTimes.join(', '))}
                      >
                        Configure Test Options
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Typing Test Options</DialogTitle>
                        <DialogDescription>
                          Add comma-separated values like 10, 30, 60.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="typing_test_times">Durations (minutes)</Label>
                        <Input
                          id="typing_test_times"
                          value={testTimesInput}
                          onChange={(event) => setTestTimesInput(event.target.value)}
                          placeholder="10, 30, 60"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTestOptionsOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="button" onClick={parseTypingTimesInput}>
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-gradient-card shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Save Status
                  </CardTitle>
                  <CardDescription>
                    Auto-save runs every 30 seconds when changes are pending.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-xl border border-border/70 bg-background/35 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unsaved sections</span>
                      <span className="font-medium text-foreground">{dirtyFields.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Auto-save</span>
                      <span
                        className={cn(
                          'font-medium',
                          autoSaveState === 'saving' && 'text-primary',
                          autoSaveState === 'saved' && 'text-emerald-400',
                          autoSaveState === 'error' && 'text-destructive'
                        )}
                      >
                        {autoSaveState === 'saving'
                          ? 'Saving...'
                          : autoSaveState === 'saved'
                            ? 'Saved'
                            : autoSaveState === 'error'
                              ? 'Error'
                              : 'Idle'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last sync</span>
                      <span className="font-medium text-foreground">
                        {formatSavedAt(lastAutoSavedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleSaveSettings()}
                    disabled={saving}
                    className="settings-ripple-button h-11 w-full rounded-xl text-sm font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving settings...
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
            </div>
          </div>
        )}

        <Sheet open={Boolean(activeSeoField)} onOpenChange={(open) => !open && setActiveSeoField(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{activeSeoTitle ? `${activeSeoTitle} SEO` : 'SEO Settings'}</SheetTitle>
              <SheetDescription>
                Configure metadata used on search engines and social previews.
              </SheetDescription>
            </SheetHeader>

            {activeSeoField && currentSeoSection && (
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-meta-title">Meta Title</Label>
                  <Input
                    id="seo-meta-title"
                    value={currentSeoSection.seo.metaTitle}
                    maxLength={120}
                    onChange={(event) =>
                      handleSeoChange(activeSeoField, 'metaTitle', event.target.value)
                    }
                  />
                  <p
                    className={cn(
                      'text-xs',
                      currentSeoSection.seo.metaTitle.length > 60
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {currentSeoSection.seo.metaTitle.length}/60 recommended
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-meta-description">Meta Description</Label>
                  <Textarea
                    id="seo-meta-description"
                    value={currentSeoSection.seo.metaDescription}
                    maxLength={220}
                    rows={4}
                    onChange={(event) =>
                      handleSeoChange(activeSeoField, 'metaDescription', event.target.value)
                    }
                  />
                  <p
                    className={cn(
                      'text-xs',
                      currentSeoSection.seo.metaDescription.length > 160
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {currentSeoSection.seo.metaDescription.length}/160 recommended
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-slug">Slug</Label>
                  <Input
                    id="seo-slug"
                    value={currentSeoSection.seo.slug}
                    onChange={(event) =>
                      handleSeoChange(
                        activeSeoField,
                        'slug',
                        slugify(event.target.value) || event.target.value
                      )
                    }
                    placeholder="page-slug"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="seo-og-title">Open Graph Title</Label>
                  <Input
                    id="seo-og-title"
                    value={currentSeoSection.seo.ogTitle}
                    onChange={(event) =>
                      handleSeoChange(activeSeoField, 'ogTitle', event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-og-description">OG Description</Label>
                  <Textarea
                    id="seo-og-description"
                    value={currentSeoSection.seo.ogDescription}
                    rows={3}
                    onChange={(event) =>
                      handleSeoChange(activeSeoField, 'ogDescription', event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-og-image">OG Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="seo-og-image"
                      value={currentSeoSection.seo.ogImage}
                      onChange={(event) =>
                        handleSeoChange(activeSeoField, 'ogImage', event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <Label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void handleSeoOgUpload(activeSeoField, event)}
                        aria-label="Upload OG image"
                      />
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <SheetFooter className="mt-6">
              {activeSeoField && (
                <Button onClick={() => void handleSaveSection(activeSeoField)}>
                  Save SEO Section
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet
          open={Boolean(activeHistoryField)}
          onOpenChange={(open) => !open && setActiveHistoryField(null)}
        >
          <SheetContent side="right" className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Version History</SheetTitle>
              <SheetDescription>
                Restore a previous version for the selected section.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5">
              {activeHistoryField && currentHistorySection ? (
                <ScrollArea className="h-[70vh] pr-3 scrollbar-orbit">
                  <div className="space-y-3">
                    {currentHistorySection.history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No saved versions available yet.
                      </p>
                    ) : (
                      currentHistorySection.history.map((snapshot, index) => (
                        <Card key={snapshot.id} className="border-border/70 bg-background/50">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  Version {currentHistorySection.history.length - index}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(snapshot.savedAt).toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="rounded-full text-[10px]">
                                {snapshot.mode === 'advanced' ? 'Advanced' : 'Simple'}
                              </Badge>
                            </div>
                            <p className="line-clamp-3 text-xs text-muted-foreground">
                              {stripHtml(snapshot.html) || 'Structured content snapshot'}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg"
                              onClick={() =>
                                handleRestoreSnapshot(activeHistoryField, snapshot)
                              }
                            >
                              Restore Version
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
