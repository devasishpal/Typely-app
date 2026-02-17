import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/db/supabase';
import PageMeta from '@/components/common/PageMeta';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Phone,
  Send,
  Sparkles,
  User,
} from 'lucide-react';

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

type PageVariant = 'default' | 'faq' | 'contact' | 'blog' | 'legal';

interface PageConfig {
  badge: string;
  description: string;
  seoDescription: string;
  emptyMessage: string;
  variant: PageVariant;
}

interface ContentSection {
  id: string;
  title: string;
  paragraphs: string[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  dateLabel: string | null;
}

interface LegalSubsection {
  id: string;
  title: string;
  paragraphs: string[];
}

interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  subsections: LegalSubsection[];
}

interface ContactDetails {
  emails: string[];
  phones: string[];
  addresses: string[];
  hours: string[];
}

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const PAGE_CONFIG: Record<FooterContentKey, PageConfig> = {
  support_center: {
    badge: 'Help & Guidance',
    description: 'Get support resources, guidance, and answers to keep your typing journey smooth and productive.',
    seoDescription: 'Visit the Typely Support Center for platform guidance, troubleshooting steps, and account help.',
    emptyMessage: 'Support information will appear here soon.',
    variant: 'default',
  },
  faq: {
    badge: 'Quick Answers',
    description: 'Browse frequently asked questions about Typely features, accounts, and learning progress.',
    seoDescription: 'Read frequently asked questions about Typely, including account setup, lessons, and progress tracking.',
    emptyMessage: 'FAQ items are not available yet.',
    variant: 'faq',
  },
  contact_us: {
    badge: 'Get In Touch',
    description: 'Contact the Typely team for support, feedback, partnerships, and business inquiries.',
    seoDescription: 'Contact Typely support and team members for help, feedback, partnerships, and general inquiries.',
    emptyMessage: 'Contact details will be shared here soon.',
    variant: 'contact',
  },
  about: {
    badge: 'About Typely',
    description: 'Learn more about Typely, our mission, and how we help learners improve typing confidence.',
    seoDescription: 'Learn about Typely, our mission, and the product vision behind our modern typing learning platform.',
    emptyMessage: 'About information will be available soon.',
    variant: 'default',
  },
  blog: {
    badge: 'Latest Stories',
    description: 'Discover product updates, typing tips, and insights from the Typely team.',
    seoDescription: 'Explore the Typely blog for typing tips, platform updates, and educational insights.',
    emptyMessage: 'Blog posts have not been published yet.',
    variant: 'blog',
  },
  careers: {
    badge: 'Join The Team',
    description: 'Explore opportunities to build better learning experiences with the Typely team.',
    seoDescription: 'Explore Typely careers and opportunities to join our team building modern typing education tools.',
    emptyMessage: 'Career information will be posted soon.',
    variant: 'default',
  },
  privacy_policy: {
    badge: 'Legal',
    description: 'Review how Typely collects, uses, and protects your data and privacy.',
    seoDescription: 'Read Typely Privacy Policy to understand data handling, storage, and privacy practices.',
    emptyMessage: 'Privacy policy details are not available yet.',
    variant: 'legal',
  },
  terms_of_service: {
    badge: 'Legal',
    description: 'Understand the rules and terms that govern the use of Typely services.',
    seoDescription: 'Read Typely Terms of Service for platform usage rules, responsibilities, and legal terms.',
    emptyMessage: 'Terms of service are not available yet.',
    variant: 'legal',
  },
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const IMAGE_REGEX = /^(https?:\/\/[^\s]+\.(?:png|jpe?g|webp|gif|avif|svg))(?:\?.*)?$/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/i;
const BLOG_FALLBACK_BG = ['from-primary/20 via-secondary/15 to-accent/10', 'from-secondary/20 via-primary/15 to-accent/10'];

const emptyContactForm: ContactFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

function normalizeContent(raw: string) {
  return raw.replace(/\r\n/g, '\n').trim();
}

function flatten(raw: string) {
  return raw.replace(/\s+/g, ' ').trim();
}

function toParagraphs(raw: string) {
  return normalizeContent(raw)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripHeading(line: string) {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\d+(?:\.\d+)?[.)]?\s+/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/\s*:\s*$/, '')
    .trim();
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return slug || fallback;
}

function safeJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function normalizeLink(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(value)) return `https://${value}`;
  return null;
}

function getHeadingInfo(line: string): { level: 2 | 3; title: string } | null {
  const h3 = line.match(/^###\s+(.+)$/);
  if (h3) return { level: 3, title: stripHeading(h3[1]) };

  const h2 = line.match(/^##\s+(.+)$/);
  if (h2) return { level: 2, title: stripHeading(h2[1]) };

  const numberedSub = line.match(/^\d+\.\d+\s+(.+)$/);
  if (numberedSub) return { level: 3, title: stripHeading(numberedSub[1]) };

  const numbered = line.match(/^\d+[.)]\s+(.+)$/);
  if (numbered) return { level: 2, title: stripHeading(numbered[1]) };

  return null;
}

function parseLegalSections(raw: string): LegalSection[] {
  const normalized = normalizeContent(raw);
  if (!normalized) return [];

  const fromJson = safeJson(normalized);
  if (Array.isArray(fromJson)) {
    const sections = fromJson
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const item = entry as Record<string, unknown>;
        const title = pickString(item, ['title', 'heading', 'section']);
        const body = pickString(item, ['content', 'description', 'body', 'text']);
        if (!title && !body) return null;

        return {
          id: slugify(title || `section-${index + 1}`, `section-${index + 1}`),
          title: title || `Section ${index + 1}`,
          paragraphs: body ? toParagraphs(body) : ['Details will be updated soon.'],
          subsections: [] as LegalSubsection[],
        } satisfies LegalSection;
      })
      .filter((entry): entry is LegalSection => Boolean(entry));

    if (sections.length > 0) return sections;
  }

  const sections: LegalSection[] = [];
  let currentSection: LegalSection | null = null;
  let currentSub: LegalSubsection | null = null;
  let paragraphBuffer: string[] = [];

  const flushBuffer = () => {
    const paragraph = paragraphBuffer.join('\n').trim();
    paragraphBuffer = [];
    if (!paragraph) return;

    if (!currentSection) {
      currentSection = {
        id: 'overview',
        title: 'Overview',
        paragraphs: [],
        subsections: [] as LegalSubsection[],
      };
      sections.push(currentSection);
    }

    if (currentSub) {
      currentSub.paragraphs.push(paragraph);
    } else {
      currentSection.paragraphs.push(paragraph);
    }
  };

  for (const line of normalized.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBuffer();
      continue;
    }

    const heading = getHeadingInfo(trimmed);
    if (heading) {
      flushBuffer();

      if (heading.level === 2) {
        currentSection = {
          id: slugify(heading.title, `section-${sections.length + 1}`),
          title: heading.title,
          paragraphs: [],
          subsections: [] as LegalSubsection[],
        };
        sections.push(currentSection);
        currentSub = null;
      } else {
        if (!currentSection) {
          currentSection = {
            id: 'overview',
            title: 'Overview',
            paragraphs: [],
            subsections: [] as LegalSubsection[],
          };
          sections.push(currentSection);
        }

        currentSub = {
          id: slugify(heading.title, `subsection-${currentSection.subsections.length + 1}`),
          title: heading.title,
          paragraphs: [],
        };
        currentSection.subsections.push(currentSub);
      }
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushBuffer();

  if (sections.length > 0) return sections;
  return [{ id: 'overview', title: 'Overview', paragraphs: toParagraphs(normalized), subsections: [] as LegalSubsection[] }];
}

function parseContentSections(raw: string): ContentSection[] {
  const normalized = normalizeContent(raw);
  if (!normalized) return [];

  const legalParsed = parseLegalSections(normalized);
  const hasHeadings = legalParsed.length > 1 || legalParsed[0]?.title !== 'Overview';

  if (hasHeadings) {
    return legalParsed.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      title: section.title,
      paragraphs: [
        ...section.paragraphs,
        ...section.subsections.map((sub) => `${sub.title}\n${sub.paragraphs.join('\n\n')}`),
      ].filter(Boolean),
    }));
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block, index) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) return null;

      const titleCandidate = stripHeading(lines[0]);
      const hasTitle = lines.length > 1 && titleCandidate.length > 2 && titleCandidate.length <= 88 && !/[.!?]$/.test(titleCandidate);
      const title = hasTitle ? titleCandidate : blocks.length === 1 ? 'Overview' : `Section ${index + 1}`;
      const body = hasTitle ? lines.slice(1).join('\n') : lines.join('\n');
      const paragraphs = toParagraphs(body);

      return {
        id: slugify(title, `section-${index + 1}`),
        title,
        paragraphs: paragraphs.length > 0 ? paragraphs : [body],
      } satisfies ContentSection;
    })
    .filter((entry): entry is ContentSection => Boolean(entry));
}

function parseFaqItems(raw: string): FaqItem[] {
  const normalized = normalizeContent(raw);
  if (!normalized) return [];

  const fromJson = safeJson(normalized);
  if (Array.isArray(fromJson)) {
    const items = fromJson
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const item = entry as Record<string, unknown>;
        const question = pickString(item, ['question', 'q', 'title']);
        const answer = pickString(item, ['answer', 'a', 'content', 'description', 'body']);
        if (!question && !answer) return null;

        return {
          id: slugify(question || `faq-${index + 1}`, `faq-${index + 1}`),
          question: question || `Question ${index + 1}`,
          answer: answer || 'Details will be shared soon.',
        } satisfies FaqItem;
      })
      .filter((entry): entry is FaqItem => Boolean(entry));

    if (items.length > 0) return items;
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const items = blocks
    .map((block, index) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) return null;

      const cleaned = lines.map((line) => line.replace(/^[-*]\s+/, '').trim());
      const firstLine = stripHeading(cleaned[0]);

      const explicitQ = cleaned.find((line) => /^q(?:uestion)?\s*[:\-]/i.test(line));
      const questionFromQ = explicitQ ? explicitQ.replace(/^q(?:uestion)?\s*[:\-]\s*/i, '').trim() : '';
      const inferredQuestion =
        questionFromQ || ((firstLine.endsWith('?') || firstLine.length <= 95) && cleaned.length > 1 ? firstLine : '');

      const answer = cleaned
        .filter((line) => !/^q(?:uestion)?\s*[:\-]/i.test(line))
        .map((line) => line.replace(/^a(?:nswer)?\s*[:\-]\s*/i, '').trim())
        .filter(Boolean)
        .join(' ');

      return {
        id: slugify(inferredQuestion || `faq-${index + 1}`, `faq-${index + 1}`),
        question: inferredQuestion || `Question ${index + 1}`,
        answer: answer || 'Details will be updated soon.',
      } satisfies FaqItem;
    })
    .filter((entry): entry is FaqItem => Boolean(entry));

  if (items.length > 0) return items;
  return [{ id: 'faq-1', question: 'How can we help you?', answer: normalized }];
}

function parseBlogBlock(block: string, index: number): BlogPost | null {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  let imageUrl: string | null = null;
  let linkUrl: string | null = null;
  let dateLabel: string | null = null;
  const textLines: string[] = [];

  for (const line of lines) {
    const imageField = line.match(/^image\s*:\s*(.+)$/i);
    if (imageField) {
      if (IMAGE_REGEX.test(imageField[1].trim())) imageUrl = imageField[1].trim();
      continue;
    }

    if (!imageUrl && IMAGE_REGEX.test(line)) {
      imageUrl = line;
      continue;
    }

    const linkField = line.match(/^(?:link|url|read\s*more)\s*:\s*(.+)$/i);
    if (linkField) {
      linkUrl = normalizeLink(linkField[1]) || linkUrl;
      continue;
    }

    const inlineUrl = line.match(URL_REGEX);
    if (!linkUrl && inlineUrl) {
      linkUrl = normalizeLink(inlineUrl[1]) || linkUrl;
      continue;
    }

    const dateField = line.match(/^date\s*:\s*(.+)$/i);
    if (dateField) {
      dateLabel = dateField[1].trim();
      continue;
    }

    textLines.push(line);
  }

  if (!textLines.length) return null;

  const firstLine = stripHeading(textLines[0]);
  const titleLooksLikeBody = firstLine.length > 100 || /[.!?]$/.test(firstLine);
  const title = titleLooksLikeBody ? `Post ${index + 1}` : firstLine;
  const contentLines = titleLooksLikeBody ? textLines : textLines.slice(1);
  const content = flatten(contentLines.join(' ')) || flatten(textLines.join(' '));
  const excerpt = content.length > 170 ? `${content.slice(0, 167).trim()}...` : content;

  return {
    id: slugify(`${title}-${index + 1}`, `blog-${index + 1}`),
    title,
    excerpt: excerpt || 'Read the latest update from Typely.',
    content: content || excerpt || 'Read the latest update from Typely.',
    imageUrl,
    linkUrl,
    dateLabel,
  };
}

function parseBlogPosts(raw: string): BlogPost[] {
  const normalized = normalizeContent(raw);
  if (!normalized) return [];

  const fromJson = safeJson(normalized);
  if (Array.isArray(fromJson)) {
    const posts = fromJson
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const item = entry as Record<string, unknown>;

        const title = pickString(item, ['title', 'heading', 'name']) || `Post ${index + 1}`;
        const content = pickString(item, ['content', 'description', 'body', 'text']) || 'Read the latest update from Typely.';
        const summary = pickString(item, ['excerpt', 'summary', 'short_description']);
        const excerpt = summary || (content.length > 170 ? `${content.slice(0, 167).trim()}...` : content);
        const image = pickString(item, ['image', 'image_url', 'featured_image']);
        const link = pickString(item, ['link', 'url', 'read_more']);

        return {
          id: slugify(`${title}-${index + 1}`, `blog-${index + 1}`),
          title,
          excerpt,
          content,
          imageUrl: IMAGE_REGEX.test(image) ? image : null,
          linkUrl: normalizeLink(link),
          dateLabel: pickString(item, ['date', 'published_at', 'published']) || null,
        } satisfies BlogPost;
      })
      .filter((entry): entry is BlogPost => Boolean(entry));

    if (posts.length > 0) return posts;
  }

  let blocks: string[] = [];
  const headingBlocks = normalized
    .split(/\n(?=##\s+)/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (headingBlocks.length > 1) {
    blocks = headingBlocks;
  } else {
    const dividerBlocks = normalized
      .split(/\n-{3,}\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (dividerBlocks.length > 1) {
      blocks = dividerBlocks;
    } else {
      const paragraphBlocks = normalized
        .split(/\n{2,}/)
        .map((entry) => entry.trim())
        .filter(Boolean);

      const looksLikeMultiple =
        paragraphBlocks.length >= 3 &&
        paragraphBlocks.every((entry) => {
          const firstLine = entry.split('\n')[0]?.trim() ?? '';
          return firstLine.length > 2 && firstLine.length <= 90;
        });

      blocks = looksLikeMultiple ? paragraphBlocks : [normalized];
    }
  }

  return blocks
    .map((block, index) => parseBlogBlock(block, index))
    .filter((entry): entry is BlogPost => Boolean(entry));
}

function parseContactDetails(raw: string): ContactDetails {
  const normalized = normalizeContent(raw);
  if (!normalized) return { emails: [], phones: [], addresses: [], hours: [] };

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const emails = unique((normalized.match(EMAIL_REGEX) ?? []).map((email) => email.toLowerCase()));
  const phones = unique(normalized.match(PHONE_REGEX) ?? []);
  const addresses: string[] = [];
  const hours: string[] = [];

  for (const line of lines) {
    if (/^(?:address|location|office)\s*:/i.test(line)) {
      addresses.push(line.replace(/^(?:address|location|office)\s*:\s*/i, '').trim());
      continue;
    }

    if (/^(?:hours|availability|open|working\s*hours)\s*:/i.test(line)) {
      hours.push(line.replace(/^(?:hours|availability|open|working\s*hours)\s*:\s*/i, '').trim());
      continue;
    }

    if (/(?:street|avenue|road|suite|floor|city|state|zip|postal|building|block)/i.test(line) && /\d/.test(line)) {
      addresses.push(line);
    }

    if (/(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line)) {
      if (/\d/.test(line) || /am|pm/i.test(line)) {
        hours.push(line);
      }
    }
  }

  return {
    emails,
    phones,
    addresses: unique(addresses),
    hours: unique(hours),
  };
}

function estimateReadTime(content: string) {
  const words = flatten(content).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function formatDate(raw: string | null) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function buildPagination(totalPages: number, currentPage: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('start-ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('end-ellipsis');

  pages.push(totalPages);
  return pages;
}

function FooterDivider() {
  return <div aria-hidden="true" className="footer-gradient-divider" />;
}

function RevealCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('footer-surface-card p-5 sm:p-7', className)}
    >
      {children}
    </motion.section>
  );
}

function FloatingTextField({
  id,
  label,
  icon,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  id: keyof ContactFormState;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (field: keyof ContactFormState, value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder=" "
        className="peer h-12 w-full rounded-xl border border-border/70 bg-background/80 pb-2 pl-10 pr-4 pt-4 text-sm text-foreground shadow-sm outline-none transition-all duration-300 focus:border-primary/55 focus:shadow-glow focus:ring-4 focus:ring-primary/15"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-10 top-2 text-xs text-muted-foreground transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
    </div>
  );
}

function FloatingTextArea({
  id,
  label,
  icon,
  value,
  onChange,
  required = false,
}: {
  id: keyof ContactFormState;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (field: keyof ContactFormState, value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-4 text-muted-foreground">{icon}</span>
      <textarea
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder=" "
        className="peer min-h-[140px] w-full resize-y rounded-xl border border-border/70 bg-background/80 pb-3 pl-10 pr-4 pt-6 text-sm text-foreground shadow-sm outline-none transition-all duration-300 focus:border-primary/55 focus:shadow-glow focus:ring-4 focus:ring-primary/15"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-10 top-2 text-xs text-muted-foreground transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
    </div>
  );
}

export default function FooterContentPage({ title, field, subtitle }: FooterContentPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [blogPage, setBlogPage] = useState(1);
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [submittingContact, setSubmittingContact] = useState(false);
  const { toast } = useToast();

  const config = PAGE_CONFIG[field];

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoading(true);
      setError('');

      try {
        const { data, error: requestError } = await supabase
          .from('site_settings')
          .select(`${field}, updated_at`)
          .limit(1)
          .maybeSingle();

        if (requestError) throw requestError;
        if (!active) return;

        const row = (data ?? null) as Record<string, unknown> | null;
        const value = row?.[field];
        setContent(typeof value === 'string' ? value : '');
        setUpdatedAt(typeof row?.updated_at === 'string' ? row.updated_at : null);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Failed to load content');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadContent();

    return () => {
      active = false;
    };
  }, [field]);

  const sections = useMemo(() => parseContentSections(content), [content]);
  const faqItems = useMemo(() => parseFaqItems(content), [content]);
  const blogPosts = useMemo(() => parseBlogPosts(content), [content]);
  const legalSections = useMemo(() => parseLegalSections(content), [content]);
  const contactDetails = useMemo(() => parseContactDetails(content), [content]);

  const postsPerPage = 6;
  const totalBlogPages = Math.max(1, Math.ceil(blogPosts.length / postsPerPage));
  const safeBlogPage = Math.min(blogPage, totalBlogPages);

  useEffect(() => {
    setBlogPage(1);
    setExpandedBlogId(null);
  }, [field, content]);

  useEffect(() => {
    if (blogPage > totalBlogPages) {
      setBlogPage(totalBlogPages);
    }
  }, [blogPage, totalBlogPages]);

  const visiblePosts = useMemo(() => {
    const start = (safeBlogPage - 1) * postsPerPage;
    return blogPosts.slice(start, start + postsPerPage);
  }, [blogPosts, safeBlogPage]);

  const pagination = useMemo(() => buildPagination(totalBlogPages, safeBlogPage), [safeBlogPage, totalBlogPages]);

  const updatedLabel = formatDate(updatedAt);
  const heroDescription = subtitle || config.description;

  const onContactChange = (fieldName: keyof ContactFormState, value: string) => {
    setContactForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const submitContactForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const subject = contactForm.subject.trim();
    const message = contactForm.message.trim();

    if (!name || !email || !message) {
      toast({
        title: 'Missing details',
        description: 'Please complete your name, email, and message.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    const recipient = contactDetails.emails[0] || 'support@typely.com';
    const finalSubject = subject || 'Typely Contact Request';
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    setSubmittingContact(true);
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(body)}`;

    toast({
      title: 'Opening your mail app',
      description: `A message draft was prepared for ${recipient}.`,
    });

    setContactForm(emptyContactForm);
    setSubmittingContact(false);
  };

  const openBlogPost = (post: BlogPost) => {
    const target = post.linkUrl?.trim();
    if (!target) return;

    const normalizedTarget =
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('/')
        ? target
        : `/${target.replace(/^\/+/, '')}`;

    window.location.href = normalizedTarget;
  };

  const emptyState = (
    <RevealCard className="text-center">
      <p className="text-sm text-muted-foreground sm:text-base">{config.emptyMessage}</p>
    </RevealCard>
  );

  const defaultContent = !content.trim()
    ? emptyState
    : (
      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <RevealCard key={section.id} delay={sectionIndex * 0.05}>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${section.id}-${paragraphIndex}`} className="whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </RevealCard>
        ))}
      </div>
    );

  const faqContent = !faqItems.length
    ? emptyState
    : (
      <RevealCard className="overflow-hidden p-0">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, itemIndex) => (
            <AccordionItem key={item.id} value={item.id} className="border-border/55 px-5 sm:px-7">
              <AccordionTrigger
                className="py-5 text-base font-semibold text-foreground transition-colors duration-300 hover:text-primary hover:no-underline"
                aria-label={`Toggle FAQ: ${item.question}`}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: itemIndex * 0.02 }}
                  className="whitespace-pre-line"
                >
                  {item.answer}
                </motion.p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </RevealCard>
    );

  const contactContent = (
    <div className="grid gap-5 lg:grid-cols-[0.95fr,1.05fr]">
      <RevealCard className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Contact Information</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">Reach us using the channels below, or send a message through the form.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/65 bg-background/75 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </p>
            {contactDetails.emails.length > 0 ? (
              <div className="space-y-1.5">
                {contactDetails.emails.map((email) => (
                  <a key={email} href={`mailto:${email}`} className="footer-link-underline block break-all text-sm text-foreground">{email}</a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Email information will be updated soon.</p>
            )}
          </div>

          <div className="rounded-xl border border-border/65 bg-background/75 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Phone
            </p>
            {contactDetails.phones.length > 0 ? (
              <div className="space-y-1.5">
                {contactDetails.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="footer-link-underline block text-sm text-foreground">{phone}</a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Phone details will be updated soon.</p>
            )}
          </div>

          <div className="rounded-xl border border-border/65 bg-background/75 p-4 sm:col-span-2">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Address
            </p>
            {contactDetails.addresses.length > 0 ? (
              <div className="space-y-1.5 text-sm text-foreground">
                {contactDetails.addresses.map((address) => (
                  <p key={address} className="whitespace-pre-line">{address}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Address details will be updated soon.</p>
            )}
          </div>

          {contactDetails.hours.length > 0 ? (
            <div className="rounded-xl border border-border/65 bg-background/75 p-4 sm:col-span-2">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                Working Hours
              </p>
              <div className="space-y-1.5 text-sm text-foreground">
                {contactDetails.hours.map((hour) => (
                  <p key={hour}>{hour}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {sections.length > 0 ? (
          <div className="space-y-3">
            <FooterDivider />
            {sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-border/55 bg-background/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">{section.title}</h3>
                <div className="mt-2 space-y-2 text-sm leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${section.id}-contact-${paragraphIndex}`} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </RevealCard>

      <RevealCard>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Send Us A Message</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">We usually respond within one business day.</p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={submitContactForm}>
          <FloatingTextField id="name" label="Full Name" icon={<User className="h-4 w-4" />} value={contactForm.name} onChange={onContactChange} required />
          <FloatingTextField id="email" label="Email Address" type="email" icon={<Mail className="h-4 w-4" />} value={contactForm.email} onChange={onContactChange} required />
          <FloatingTextField id="subject" label="Subject" icon={<MessageSquare className="h-4 w-4" />} value={contactForm.subject} onChange={onContactChange} />
          <FloatingTextArea id="message" label="Your Message" icon={<MessageSquare className="h-4 w-4" />} value={contactForm.message} onChange={onContactChange} required />

          <Button
            type="submit"
            className="footer-button-hover h-11 w-full rounded-xl bg-gradient-primary bg-[length:200%_200%] text-primary-foreground transition-all duration-300 hover:bg-[position:100%_0]"
            aria-label="Submit contact form"
            disabled={submittingContact}
          >
            {submittingContact ? 'Preparing Message...' : 'Send Message'}
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </RevealCard>
    </div>
  );

  const blogContent = !blogPosts.length
    ? emptyState
    : (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePosts.map((post, postIndex) => {
            const expanded = expandedBlogId === post.id;
            const canOpenPost = Boolean(post.linkUrl);
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: postIndex * 0.05 }}
                role={canOpenPost ? 'link' : undefined}
                tabIndex={canOpenPost ? 0 : undefined}
                onClick={canOpenPost ? () => openBlogPost(post) : undefined}
                onKeyDown={
                  canOpenPost
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openBlogPost(post);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'footer-surface-card overflow-hidden p-0',
                  canOpenPost && 'cursor-pointer'
                )}
              >
                <div className="relative aspect-[16/9] overflow-hidden border-b border-border/60 bg-muted/40">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={`${post.title} featured image`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', BLOG_FALLBACK_BG[postIndex % BLOG_FALLBACK_BG.length])}>
                      <span className="footer-icon-glow inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-background/75 text-primary shadow-card">
                        <Newspaper className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold leading-snug text-foreground">{post.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{estimateReadTime(post.content)} min read</span>
                      {post.dateLabel ? <span aria-hidden="true">|</span> : null}
                      {post.dateLabel ? <span>{post.dateLabel}</span> : null}
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground">{expanded ? post.content : post.excerpt}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="footer-button-hover h-9 rounded-lg"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canOpenPost) {
                          openBlogPost(post);
                          return;
                        }
                        setExpandedBlogId((current) => current === post.id ? null : post.id);
                      }}
                      aria-label={
                        canOpenPost
                          ? `Open ${post.title}`
                          : expanded
                            ? `Show less for ${post.title}`
                            : `Read more about ${post.title}`
                      }
                    >
                      {canOpenPost ? 'Open Post' : expanded ? 'Show Less' : 'Read More'}
                      {canOpenPost ? (
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {totalBlogPages > 1 ? (
          <nav aria-label="Blog pagination" className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="footer-button-hover h-10 min-w-[96px] rounded-lg"
              disabled={safeBlogPage === 1}
              onClick={() => {
                setBlogPage((current) => Math.max(1, current - 1));
                setExpandedBlogId(null);
              }}
            >
              Previous
            </Button>

            {pagination.map((entry) => {
              if (typeof entry !== 'number') {
                return (
                  <span key={entry} className="px-2 text-muted-foreground" aria-hidden="true">...</span>
                );
              }

              return (
                <Button
                  key={entry}
                  type="button"
                  size="sm"
                  variant={entry === safeBlogPage ? 'default' : 'outline'}
                  className="footer-button-hover h-10 min-w-10 rounded-lg"
                  aria-label={`Go to page ${entry}`}
                  aria-current={entry === safeBlogPage ? 'page' : undefined}
                  onClick={() => {
                    setBlogPage(entry);
                    setExpandedBlogId(null);
                  }}
                >
                  {entry}
                </Button>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="footer-button-hover h-10 min-w-[96px] rounded-lg"
              disabled={safeBlogPage === totalBlogPages}
              onClick={() => {
                setBlogPage((current) => Math.min(totalBlogPages, current + 1));
                setExpandedBlogId(null);
              }}
            >
              Next
            </Button>
          </nav>
        ) : null}
      </div>
    );

  const legalContent = (!legalSections.length || !content.trim())
    ? emptyState
    : (
      <div className="space-y-5 lg:grid lg:grid-cols-[250px,1fr] lg:items-start lg:gap-6 lg:space-y-0">
        <RevealCard className="lg:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">On This Page</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {legalSections.map((section) => (
              <a
                key={`mobile-${section.id}`}
                href={`#${section.id}`}
                className="footer-link-underline rounded-full border border-border/65 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {section.title}
              </a>
            ))}
          </div>
        </RevealCard>

        <aside className="hidden lg:block">
          <div className="footer-surface-card sticky top-28 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">On This Page</h2>
            <nav className="mt-4" aria-label={`${title} table of contents`}>
              <ul className="space-y-2">
                {legalSections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="footer-link-underline block rounded-md px-1 py-1 text-sm text-foreground">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <article className="space-y-5" aria-label={title}>
          {legalSections.map((section, sectionIndex) => (
            <RevealCard key={section.id} delay={sectionIndex * 0.04}>
              <h2 id={section.id} className="scroll-mt-28 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{section.title}</h2>

              <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground sm:text-base">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.id}-${paragraphIndex}`} className="whitespace-pre-line">{paragraph}</p>
                ))}
              </div>

              {section.subsections.length > 0 ? (
                <div className="mt-6 space-y-5 border-t border-border/60 pt-5">
                  {section.subsections.map((sub) => (
                    <section key={sub.id} aria-labelledby={sub.id}>
                      <h3 id={sub.id} className="scroll-mt-28 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{sub.title}</h3>
                      <div className="mt-3 space-y-3 text-sm leading-8 text-muted-foreground sm:text-base">
                        {sub.paragraphs.map((paragraph, paragraphIndex) => (
                          <p key={`${sub.id}-${paragraphIndex}`} className="whitespace-pre-line">{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </RevealCard>
          ))}
        </article>
      </div>
    );

  const contentBody = loading
    ? (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`loading-${index}`} className="footer-surface-card min-h-[140px] animate-pulse bg-gradient-card p-5 sm:p-7">
            <div className="h-4 w-32 rounded bg-muted/70" />
            <div className="mt-3 h-3 w-full rounded bg-muted/55" />
            <div className="mt-2 h-3 w-4/5 rounded bg-muted/55" />
            <div className="mt-2 h-3 w-3/5 rounded bg-muted/55" />
          </div>
        ))}
      </div>
    )
    : config.variant === 'faq'
      ? faqContent
      : config.variant === 'contact'
        ? contactContent
        : config.variant === 'blog'
          ? blogContent
          : config.variant === 'legal'
            ? legalContent
            : defaultContent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[1180px] space-y-7 pb-10 sm:space-y-9 sm:pb-12"
    >
      <PageMeta title={`${title} | Typely`} description={config.seoDescription} />

      <a
        href="#footer-content-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-card"
      >
        Skip to content
      </a>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.span className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" animate={{ y: [0, -14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.span className="absolute right-0 top-44 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" animate={{ y: [0, 12, 0] }} transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }} />
        <motion.span className="absolute left-1/2 top-1/3 h-52 w-52 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      </div>

      <section className="relative isolate overflow-hidden rounded-3xl border border-border/65 bg-card/85 px-5 py-8 shadow-card backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.16)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,hsl(var(--secondary)/0.15)_0%,transparent_46%),radial-gradient(circle_at_50%_90%,hsl(var(--accent)/0.12)_0%,transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.09)_1px,transparent_0)] [background-size:20px_20px]" />

        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {config.badge}
          </span>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">{heroDescription}</p>
          {updatedLabel ? (
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Updated {updatedLabel}
            </p>
          ) : null}
        </div>
      </section>

      <FooterDivider />

      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <main id="footer-content-main" className="space-y-6" aria-label={`${title} page content`}>
        {contentBody}
      </main>

      {config.variant !== 'legal' && !loading ? (
        <div className="footer-surface-card px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Building2 className="footer-icon-glow h-4 w-4 text-primary" aria-hidden="true" />
              Need more help? Reach out through our support channels.
            </span>
            <a href="/contact" className="footer-link-underline inline-flex items-center gap-1 font-medium text-primary">
              Contact Typely
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

