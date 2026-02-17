
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
type SectionPickerValue = FooterField;

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

interface ContactEditorState {
  emails: string;
  phones: string;
  address: string;
  hours: string;
  notes: string;
}

interface FooterBlogPostRow {
  id: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  date_label: string | null;
  sort_order: number | null;
  updated_at: string | null;
  is_published: boolean | null;
}

interface SiteContactInfoRow {
  key: string;
  emails: string[] | null;
  phones: string[] | null;
  address: string | null;
  hours: string[] | null;
  notes: string | null;
  updated_at: string | null;
}

type SectionMetaMap = Partial<Record<FooterField, SectionMetaStorage>>;
type SectionHistoryMap = Partial<Record<FooterField, SectionHistorySnapshot[]>>;

const SECTION_META_STORAGE_KEY = 'typely_admin_settings_section_meta_v1';
const SECTION_HISTORY_STORAGE_KEY = 'typely_admin_settings_section_history_v1';
const SECTION_GLOBAL_MODE_STORAGE_KEY = 'typely_admin_settings_global_mode_v1';
const MAX_HISTORY_ITEMS = 12;
const CONTACT_EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CONTACT_PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const CONTACT_HAS_EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const CONTACT_HAS_PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/;

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

function footerBlogPostsQuery() {
  return supabase.from('footer_blog_posts' as any);
}

function siteContactInfoQuery() {
  return supabase.from('site_contact_info' as any);
}

function isMissingRelationError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '42P01'
  );
}

function normalizeBlogTarget(value: string) {
  const target = value.trim();
  if (!target) return '';
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('/')
  ) {
    return target;
  }
  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(target)) {
    return `https://${target}`;
  }
  return `/${target.replace(/^\/+/, '')}`;
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function htmlToTextWithLineBreaks(raw: string) {
  if (!raw) return '';

  const htmlWithBreaks = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(
      /<\/(?:p|div|li|section|article|header|footer|h[1-6]|tr|ul|ol|table|blockquote)>/gi,
      '\n'
    );

  const container = document.createElement('div');
  container.innerHTML = htmlWithBreaks;
  return (container.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanContactValue(raw: string) {
  return raw
    .replace(/^[\-*\u2022]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseContactEditorState(rawHtml: string): ContactEditorState {
  const readable = htmlToTextWithLineBreaks(rawHtml);
  if (!readable) {
    return { emails: '', phones: '', address: '', hours: '', notes: '' };
  }

  const lines = readable
    .split('\n')
    .map((line) => cleanContactValue(line))
    .filter(Boolean);

  const emails = uniqueValues((readable.match(CONTACT_EMAIL_REGEX) ?? []).map((email) => email.toLowerCase()));
  const phones = uniqueValues(readable.match(CONTACT_PHONE_REGEX) ?? []);
  const explicitEmails: string[] = [];
  const explicitPhones: string[] = [];

  let address = '';
  let hours = '';
  const noteLines: string[] = [];

  for (const line of lines) {
    const emailMatch = line.match(/(?:^|\b)(?:email|emails)\s*:\s*(.+)$/i);
    if (emailMatch?.[1]) {
      explicitEmails.push(cleanContactValue(emailMatch[1]));
      continue;
    }

    const phoneMatch = line.match(/(?:^|\b)(?:phone|phones|tel)\s*:\s*(.+)$/i);
    if (phoneMatch?.[1]) {
      explicitPhones.push(cleanContactValue(phoneMatch[1]));
      continue;
    }

    const addressMatch = line.match(/(?:^|\b)(?:address|location|office)\s*:\s*(.+)$/i);
    if (addressMatch?.[1]) {
      if (!address) address = cleanContactValue(addressMatch[1]);
      continue;
    }

    const hoursMatch = line.match(/(?:^|\b)(?:hours|availability|open|working\s*hours)\s*:\s*(.+)$/i);
    if (hoursMatch?.[1]) {
      if (!hours) hours = cleanContactValue(hoursMatch[1]);
      continue;
    }

    if (CONTACT_HAS_EMAIL_REGEX.test(line) || CONTACT_HAS_PHONE_REGEX.test(line)) {
      continue;
    }

    if (
      !address &&
      /(?:street|st\.|avenue|ave\.|road|rd\.|suite|ste\.|floor|fl\.|city|state|zip|postal|building|block|lane|ln\.|district|sector)/i.test(line) &&
      /\d/.test(line)
    ) {
      address = line;
      continue;
    }

    if (
      !hours &&
      /(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line) &&
      (/\d/.test(line) || /\bam\b|\bpm\b|open|closed/i.test(line))
    ) {
      hours = line;
      continue;
    }

    noteLines.push(line);
  }

  return {
    emails: explicitEmails.length > 0 ? explicitEmails.join(', ') : emails.join(', '),
    phones: explicitPhones.length > 0 ? explicitPhones.join(', ') : phones.join(', '),
    address,
    hours,
    notes: noteLines.join('\n'),
  };
}

function stripKnownLabel(raw: string, pattern: RegExp) {
  return raw.replace(pattern, '').trim();
}

function buildContactHtmlFromState(state: ContactEditorState) {
  const emails = stripKnownLabel(state.emails, /^(?:emails?)\s*:\s*/i);
  const phones = stripKnownLabel(state.phones, /^(?:phone|phones|tel)\s*:\s*/i);
  const address = stripKnownLabel(state.address, /^(?:address|location|office)\s*:\s*/i);
  const hours = stripKnownLabel(state.hours, /^(?:hours|availability|open|working\s*hours)\s*:\s*/i);
  const notes = state.notes.trim();

  const lines: string[] = [];
  if (emails) lines.push(`Email: ${emails}`);
  if (phones) lines.push(`Phone: ${phones}`);
  if (address) lines.push(`Address: ${address}`);
  if (hours) lines.push(`Hours: ${hours}`);
  if (notes) {
    if (lines.length > 0) lines.push('');
    lines.push(notes);
  }

  return plainTextToHtml(lines.join('\n'));
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
    const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id : createId();
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
          : typeof entry.imageUrl === 'string'
            ? entry.imageUrl
          : '';
    const ctaUrl =
      typeof entry.link === 'string'
        ? entry.link
        : typeof entry.url === 'string'
          ? entry.url
          : typeof entry.linkUrl === 'string'
            ? entry.linkUrl
          : '';

    return {
      id,
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
  const [activeSeoField, setActiveSeoField] = useState<FooterField | null>(null);
  const [activeHistoryField, setActiveHistoryField] = useState<FooterField | null>(null);
  const [activeSectionField, setActiveSectionField] =
    useState<SectionPickerValue>(FOOTER_SECTIONS[0]?.field ?? 'support_center');
  const [globalMode, setGlobalMode] = useState<SectionMode>('simple');
  const [draggingBlock, setDraggingBlock] = useState<{ field: FooterField; blockId: string } | null>(null);
  const [newFaqCategoryName, setNewFaqCategoryName] = useState('');
  const [faqDraft, setFaqDraft] = useState<{
    id: string | null;
    question: string;
    answerHtml: string;
    categoryId: string;
    enabled: boolean;
  }>({
    id: null,
    question: '',
    answerHtml: '',
    categoryId: '',
    enabled: true,
  });
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

  const visibleSections = useMemo(() => {
    const selected = FOOTER_SECTIONS.find((section) => section.field === activeSectionField);
    return selected ? [selected] : [FOOTER_SECTIONS[0]];
  }, [activeSectionField]);

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

  const syncBlogPostsTable = async (section: FooterSectionState, savedAt: string) => {
    const posts = buildBlogPosts(section).map((post, index) => ({
      id: post.id || createId(),
      title: post.title.trim() || `Post ${index + 1}`,
      excerpt: post.excerpt.trim() || null,
      content: post.content.trim() || null,
      image_url: post.imageUrl.trim() || null,
      link_url: normalizeBlogTarget(post.linkUrl),
      date_label: null,
      sort_order: index,
      is_published: true,
      updated_at: savedAt,
    }));

    const { error: deleteError } = await (footerBlogPostsQuery() as any)
      .delete()
      .gte('sort_order', 0);
    if (deleteError) {
      if (isMissingRelationError(deleteError)) return;
      throw deleteError;
    }

    if (posts.length === 0) return;

    const { error: insertError } = await (footerBlogPostsQuery() as any).insert(posts);
    if (insertError) {
      if (isMissingRelationError(insertError)) return;
      throw insertError;
    }
  };

  const syncContactInfoTable = async (section: FooterSectionState, savedAt: string) => {
    const parsed = parseContactEditorState(section.html);
    const emails = uniqueValues(parsed.emails.split(/[,\n;]+/).map((value) => value.trim()));
    const phones = uniqueValues(parsed.phones.split(/[,\n;]+/).map((value) => value.trim()));
    const hours = uniqueValues(parsed.hours.split(/[\n;]+/).map((value) => value.trim()));

    const { error: contactError } = await (siteContactInfoQuery() as any).upsert(
      {
        key: 'default',
        emails,
        phones,
        address: parsed.address.trim() || null,
        hours,
        notes: parsed.notes.trim() || null,
        updated_at: savedAt,
      },
      { onConflict: 'key' }
    );

    if (contactError) {
      if (isMissingRelationError(contactError)) return;
      throw contactError;
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: loadError } = await siteSettingsQuery()
        .select('*')
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false })
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
      setLastAutoSavedAt(row.updated_at);
      setAutoSaveState('idle');

      let blogRows: FooterBlogPostRow[] = [];
      try {
        const { data: blogData, error: blogError } = await footerBlogPostsQuery()
          .select('id, title, excerpt, content, image_url, link_url, date_label, sort_order, updated_at, is_published')
          .eq('is_published', true)
          .order('sort_order', { ascending: true })
          .order('updated_at', { ascending: false });

        if (blogError) throw blogError;
        blogRows = Array.isArray(blogData) ? (blogData as FooterBlogPostRow[]) : [];
      } catch (blogError) {
        if (!isMissingRelationError(blogError)) throw blogError;
      }

      let contactRow: SiteContactInfoRow | null = null;
      try {
        const { data: contactData, error: contactError } = await siteContactInfoQuery()
          .select('key, emails, phones, address, hours, notes, updated_at')
          .eq('key', 'default')
          .maybeSingle();

        if (contactError) throw contactError;
        contactRow = (contactData ?? null) as SiteContactInfoRow | null;
      } catch (contactError) {
        if (!isMissingRelationError(contactError)) throw contactError;
      }

      const blogRawOverride =
        blogRows.length > 0
          ? JSON.stringify(
              blogRows.map((post) => ({
                id: post.id,
                title: post.title ?? '',
                excerpt: post.excerpt ?? '',
                content: post.content ?? '',
                imageUrl: post.image_url ?? '',
                linkUrl: post.link_url ?? '',
                dateLabel: post.date_label ?? null,
              }))
            )
          : null;

      const contactStateFromTable: ContactEditorState | null = contactRow
        ? {
            emails: (contactRow.emails ?? []).join(', '),
            phones: (contactRow.phones ?? []).join(', '),
            address: contactRow.address ?? '',
            hours: (contactRow.hours ?? []).join('\n'),
            notes: contactRow.notes ?? '',
          }
        : null;
      const hasContactOverride = Boolean(
        contactStateFromTable &&
          (contactStateFromTable.emails ||
            contactStateFromTable.phones ||
            contactStateFromTable.address ||
            contactStateFromTable.hours ||
            contactStateFromTable.notes)
      );
      const contactRawOverride =
        hasContactOverride && contactStateFromTable
          ? buildContactHtmlFromState(contactStateFromTable)
          : null;

      const hydratedSections = {} as Record<FooterField, FooterSectionState>;
      FOOTER_SECTIONS.forEach((section, index) => {
        let rawValue = (row?.[section.field] ?? '').toString();
        if (section.field === 'blog' && blogRawOverride) {
          rawValue = blogRawOverride;
        } else if (section.field === 'contact_us' && contactRawOverride) {
          rawValue = contactRawOverride;
        }
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

      if (uniqueFields.includes('blog')) {
        await syncBlogPostsTable(sections.blog, savedAt);
      }

      if (uniqueFields.includes('contact_us')) {
        await syncContactInfoTable(sections.contact_us, savedAt);
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

    const nextCategoryId = createId();
    updateSection('faq', (current) => ({
      ...current,
      faqCategories: [...current.faqCategories, { id: nextCategoryId, name: categoryName }],
    }));
    setFaqDraft((prev) => ({
      ...prev,
      categoryId: nextCategoryId,
    }));
    setNewFaqCategoryName('');
  };

  const handleAddFaqItem = () => {
    const trimmedQuestion = faqDraft.question.trim();
    const hasAnswer = Boolean(stripHtml(faqDraft.answerHtml).trim());
    if (!trimmedQuestion || !hasAnswer) {
      toast({
        title: 'Question and answer required',
        description: 'Add both question and answer before saving.',
        variant: 'destructive',
      });
      return;
    }

    const isEditing = Boolean(faqDraft.id);
    updateSection('faq', (current) => {
      const categories =
        current.faqCategories.length > 0
          ? current.faqCategories
          : [{ id: createId(), name: 'General' }];
      const categoryId = faqDraft.categoryId || categories[0].id;
      const nextFaqItem = {
        question: trimmedQuestion,
        answerHtml: faqDraft.answerHtml,
        categoryId,
        enabled: faqDraft.enabled,
      };

      if (faqDraft.id) {
        return {
          ...current,
          faqCategories: categories,
          faqItems: current.faqItems.map((item) =>
            item.id === faqDraft.id ? { ...item, ...nextFaqItem } : item
          ),
        };
      }

      return {
        ...current,
        faqCategories: categories,
        faqItems: [
          ...current.faqItems,
          {
            id: createId(),
            ...nextFaqItem,
          },
        ],
      };
    });

    const fallbackCategoryId = faqDraft.categoryId || sections.faq.faqCategories[0]?.id || '';
    setFaqDraft({
      id: null,
      question: '',
      answerHtml: '',
      categoryId: fallbackCategoryId,
      enabled: true,
    });

    toast({
      title: isEditing ? 'FAQ updated' : 'FAQ added',
      description: isEditing
        ? 'The selected question has been updated.'
        : 'New FAQ question has been added.',
    });
  };

  const handleFaqItemDelete = (faqId: string) => {
    updateSection('faq', (current) => ({
      ...current,
      faqItems: current.faqItems.filter((item) => item.id !== faqId),
    }));

    setFaqDraft((prev) => (prev.id === faqId ? { ...prev, id: null, question: '', answerHtml: '' } : prev));
  };

  const handleFaqEditFromList = (faqId: string) => {
    const targetFaq = sections.faq.faqItems.find((item) => item.id === faqId);
    if (!targetFaq) return;

    setFaqDraft({
      id: targetFaq.id,
      question: targetFaq.question,
      answerHtml: targetFaq.answerHtml,
      categoryId: targetFaq.categoryId,
      enabled: targetFaq.enabled,
    });

    const target = document.getElementById('faq-single-editor');
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const openBlogTarget = (target: string) => {
    const normalized = normalizeBlogTarget(target);
    if (!normalized) {
      toast({
        title: 'Missing post URL',
        description: 'Add a CTA URL for this post before opening it.',
        variant: 'destructive',
      });
      return;
    }

    window.open(normalized, '_self');
  };

  const focusBlogBlock = (blockId: string) => {
    const target = document.getElementById(`blog-block-${blockId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const renderBlogPostList = (section: FooterSectionState) => {
    const posts = buildBlogPosts(section);

    return (
      <Card className="border-border/70 bg-background/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Blog Posts List</CardTitle>
          <CardDescription>
            Added posts appear here for quick review and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blog posts added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[56px]">#</TableHead>
                    <TableHead className="min-w-[220px]">Title</TableHead>
                    <TableHead className="min-w-[260px]">Excerpt</TableHead>
                    <TableHead className="min-w-[180px]">URL</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, index) => {
                    const hasBlockReference =
                      section.mode === 'advanced' &&
                      section.blocks.some((block) => block.id === post.id);
                    const normalizedUrl = post.linkUrl.trim()
                      ? normalizeBlogTarget(post.linkUrl)
                      : '';

                    return (
                      <TableRow key={`blog-row-${post.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {post.title || `Post ${index + 1}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="line-clamp-2">{post.excerpt}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {normalizedUrl ? (
                            <span className="block max-w-[280px] break-all">{normalizedUrl}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Open blog post ${index + 1}`}
                              disabled={!normalizedUrl}
                              onClick={() => openBlogTarget(post.linkUrl)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit blog post ${index + 1}`}
                              disabled={!hasBlockReference}
                              onClick={() => focusBlogBlock(post.id)}
                            >
                              <PenSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete blog post ${index + 1}`}
                              disabled={!hasBlockReference}
                              onClick={() => handleBlockDelete('blog', post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
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

  useEffect(() => {
    setSections((prev) => {
      const next = { ...prev };
      next[activeSectionField] = {
        ...next[activeSectionField],
        expanded: true,
      };
      return next;
    });
  }, [activeSectionField]);

  useEffect(() => {
    const defaultCategoryId = sections.faq.faqCategories[0]?.id ?? '';
    if (!defaultCategoryId) return;

    setFaqDraft((prev) => {
      if (prev.categoryId) return prev;
      return {
        ...prev,
        categoryId: defaultCategoryId,
      };
    });
  }, [sections.faq.faqCategories]);

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
            <Card id="faq-single-editor" className="border-border/70 bg-background/40">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {faqDraft.id ? 'Edit Question' : 'Add New Question'}
                    </p>
                    <p className="text-sm text-foreground">
                      {faqDraft.id
                        ? 'Update the selected FAQ question details.'
                        : 'Use this single form to add one FAQ question at a time.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="faq-draft-enabled" className="text-xs">
                      Enabled
                    </Label>
                    <Switch
                      id="faq-draft-enabled"
                      checked={faqDraft.enabled}
                      onCheckedChange={(checked) =>
                        setFaqDraft((prev) => ({ ...prev, enabled: checked }))
                      }
                      aria-label="Toggle FAQ status"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="faq-draft-question">Question</Label>
                    <Input
                      id="faq-draft-question"
                      value={faqDraft.question}
                      onChange={(event) =>
                        setFaqDraft((prev) => ({ ...prev, question: event.target.value }))
                      }
                      placeholder="Enter FAQ question"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={faqDraft.categoryId || section.faqCategories[0]?.id || ''}
                      onValueChange={(value) =>
                        setFaqDraft((prev) => ({ ...prev, categoryId: value }))
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
                    value={faqDraft.answerHtml}
                    onChange={(nextValue) =>
                      setFaqDraft((prev) => ({ ...prev, answerHtml: nextValue }))
                    }
                    placeholder="Write answer..."
                    minHeightClassName="min-h-[160px]"
                    ariaLabel="FAQ answer editor"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="h-10 rounded-xl"
                    onClick={handleAddFaqItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {faqDraft.id ? 'Update FAQ' : 'Add FAQ'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() =>
                      setFaqDraft((prev) => ({
                        id: null,
                        question: '',
                        answerHtml: '',
                        categoryId: prev.categoryId || section.faqCategories[0]?.id || '',
                        enabled: true,
                      }))
                    }
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All FAQ Questions</CardTitle>
                <CardDescription>
                  Questions you add above appear here for quick management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {section.faqItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No FAQ questions added yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[56px]">#</TableHead>
                          <TableHead className="min-w-[260px]">Question</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.faqItems.map((item, index) => {
                          const category =
                            section.faqCategories.find((cat) => cat.id === item.categoryId)?.name ||
                            'General';
                          const questionLabel = item.question.trim() || 'Untitled question';

                          return (
                            <TableRow key={`faq-row-${item.id}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{questionLabel}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{category}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.enabled ? 'default' : 'secondary'}>
                                  {item.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit FAQ ${index + 1}`}
                                    onClick={() => handleFaqEditFromList(item.id)}
                                  >
                                    <PenSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete FAQ ${index + 1}`}
                                    onClick={() => handleFaqItemDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (field === 'contact_us' && section.mode === 'simple') {
      const contactState = parseContactEditorState(section.html);
      const updateContactState = (
        key: keyof ContactEditorState,
        value: string
      ) => {
        const next = {
          ...contactState,
          [key]: value,
        };
        handleSectionHtmlChange(field, buildContactHtmlFromState(next));
      };

      return (
        <div className="space-y-4">
          <Card className="border-border/70 bg-background/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Details</CardTitle>
              <CardDescription>
                Save email, phone, address, and working hours used on the contact page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-us-email">Email</Label>
                  <Input
                    id="contact-us-email"
                    value={contactState.emails}
                    onChange={(event) => updateContactState('emails', event.target.value)}
                    className="h-10 rounded-xl"
                    placeholder="support@typely.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use commas for multiple emails.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-us-phone">Phone</Label>
                  <Input
                    id="contact-us-phone"
                    value={contactState.phones}
                    onChange={(event) => updateContactState('phones', event.target.value)}
                    className="h-10 rounded-xl"
                    placeholder="+1 555 123 4567"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use commas for multiple numbers.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-us-address">Address</Label>
                <Textarea
                  id="contact-us-address"
                  value={contactState.address}
                  onChange={(event) => updateContactState('address', event.target.value)}
                  className="min-h-[86px] rounded-xl"
                  placeholder="123 Main Street, New York, NY 10001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-us-hours">Working Hours</Label>
                <Textarea
                  id="contact-us-hours"
                  value={contactState.hours}
                  onChange={(event) => updateContactState('hours', event.target.value)}
                  className="min-h-[86px] rounded-xl"
                  placeholder="Mon-Fri 9:00 AM - 6:00 PM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-us-notes">Additional Notes (optional)</Label>
                <Textarea
                  id="contact-us-notes"
                  value={contactState.notes}
                  onChange={(event) => updateContactState('notes', event.target.value)}
                  className="min-h-[96px] rounded-xl"
                  placeholder="Any extra support details shown below the contact cards."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (section.mode === 'advanced') {
      return (
        <div className="space-y-4">
          {section.blocks.map((block, index) => (
            <Card
              key={block.id}
              id={field === 'blog' ? `blog-block-${block.id}` : undefined}
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
                      placeholder={field === 'blog' ? '/blog/my-post' : '/contact'}
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

          {field === 'blog' ? renderBlogPostList(section) : null}
        </div>
      );
    }

    if (field === 'blog') {
      return (
        <div className="space-y-4">
          <RichTextEditor
            value={section.html}
            onChange={(nextValue) => handleSectionHtmlChange(field, nextValue)}
            placeholder={`Write ${sectionTitleMap.get(field)} content...`}
            ariaLabel={`${sectionTitleMap.get(field)} editor`}
          />
          {renderBlogPostList(section)}
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
              <Card className="border-border/70 bg-gradient-card shadow-card">
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Settings Pages
                  </p>
                  <Tabs
                    value={activeSectionField}
                    onValueChange={(value) => setActiveSectionField(value as SectionPickerValue)}
                  >
                    <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-xl bg-background/45 p-1 scrollbar-orbit">
                      {FOOTER_SECTIONS.map((section) => (
                        <TabsTrigger
                          key={`section-tab-${section.field}`}
                          value={section.field}
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs sm:text-sm"
                        >
                          {section.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {visibleSections.map((section, index) => {
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
                            {section.field === 'faq' ? (
                              <div className="w-full max-w-[240px]">
                                <Tabs value="add-faq">
                                  <TabsList className="grid h-10 w-full grid-cols-1 rounded-xl">
                                    <TabsTrigger value="add-faq" className="rounded-lg text-xs sm:text-sm">
                                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                                      Add FAQ
                                    </TabsTrigger>
                                  </TabsList>
                                </Tabs>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="w-full xl:w-[240px]">
                                  <Tabs
                                    value={current.viewMode}
                                    onValueChange={(value) =>
                                      handleSectionViewModeChange(
                                        section.field,
                                        value as SectionViewMode
                                      )
                                    }
                                  >
                                    <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl">
                                      <TabsTrigger value="edit" className="rounded-lg text-xs sm:text-sm">
                                        <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                                        Edit Mode
                                      </TabsTrigger>
                                      <TabsTrigger value="preview" className="rounded-lg text-xs sm:text-sm">
                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                        Preview Mode
                                      </TabsTrigger>
                                    </TabsList>
                                  </Tabs>
                                </div>

                                <div className="w-full xl:w-[360px]">
                                  <Tabs
                                    value={current.mode}
                                    onValueChange={(value) =>
                                      handleSectionModeChange(
                                        section.field,
                                        value as SectionMode
                                      )
                                    }
                                  >
                                    <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl">
                                      <TabsTrigger value="simple" className="rounded-lg px-2 text-xs sm:text-sm">
                                        Simple Mode
                                      </TabsTrigger>
                                      <TabsTrigger
                                        value="advanced"
                                        className="rounded-lg px-2 text-[11px] leading-tight sm:text-xs md:text-sm"
                                      >
                                        Advanced Section Mode
                                      </TabsTrigger>
                                    </TabsList>
                                  </Tabs>
                                </div>
                              </div>
                            )}

                            <Separator />

                            {section.field === 'faq'
                              ? renderSectionEditor(section.field, current)
                              : current.viewMode === 'preview'
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
