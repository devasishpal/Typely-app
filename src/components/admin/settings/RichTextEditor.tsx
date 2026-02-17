import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageUp,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Type,
  Underline,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
  toolbarClassName?: string;
  stickyToolbar?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

interface ToolbarButtonProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to read image file.'));
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

function getEditorTextContent(html: string) {
  if (!html) return '';

  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.textContent || '').trim();
}

function ToolbarButton({ icon: Icon, label, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0 rounded-lg border-border/70 bg-background/70 text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeightClassName = 'min-h-[220px]',
  toolbarClassName,
  stickyToolbar = false,
  disabled = false,
  ariaLabel = 'Rich text editor',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const textColorInputRef = useRef<HTMLInputElement | null>(null);
  const highlightColorInputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!getEditorTextContent(value));
  const editorId = useId();

  useEffect(() => {
    if (!editorRef.current) return;
    if (isFocused) return;
    if (editorRef.current.innerHTML === value) return;

    editorRef.current.innerHTML = value || '';
    setIsEmpty(!getEditorTextContent(value));
  }, [value, isFocused]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setIsEmpty(!getEditorTextContent(html));
    onChange(html);
  };

  const runCommand = (command: string, valueArg?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    runCommand('createLink', url.trim());
  };

  const handleInsertTable = () => {
    runCommand(
      'insertHTML',
      '<table style="width:100%;border-collapse:collapse;margin:10px 0;"><thead><tr><th style="border:1px solid #475569;padding:8px;text-align:left;">Header 1</th><th style="border:1px solid #475569;padding:8px;text-align:left;">Header 2</th></tr></thead><tbody><tr><td style="border:1px solid #475569;padding:8px;">Cell 1</td><td style="border:1px solid #475569;padding:8px;">Cell 2</td></tr></tbody></table>'
    );
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      runCommand('insertImage', imageDataUrl);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'rounded-xl border border-border/70 bg-[#0f172a]/80 p-2 shadow-inner',
          stickyToolbar && 'admin-rich-editor-toolbar',
          toolbarClassName
        )}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pr-1 whitespace-nowrap scrollbar-orbit">
          <ToolbarButton icon={Bold} label="Bold" onClick={() => runCommand('bold')} disabled={disabled} />
          <ToolbarButton icon={Italic} label="Italic" onClick={() => runCommand('italic')} disabled={disabled} />
          <ToolbarButton
            icon={Underline}
            label="Underline"
            onClick={() => runCommand('underline')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={Heading1}
            label="Heading 1"
            onClick={() => runCommand('formatBlock', '<h1>')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={Heading2}
            label="Heading 2"
            onClick={() => runCommand('formatBlock', '<h2>')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={Heading3}
            label="Heading 3"
            onClick={() => runCommand('formatBlock', '<h3>')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={List}
            label="Bullet List"
            onClick={() => runCommand('insertUnorderedList')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Numbered List"
            onClick={() => runCommand('insertOrderedList')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={Quote}
            label="Blockquote"
            onClick={() => runCommand('formatBlock', '<blockquote>')}
            disabled={disabled}
          />
          <ToolbarButton icon={Link2} label="Insert Link" onClick={handleInsertLink} disabled={disabled} />
          <ToolbarButton
            icon={ImageUp}
            label="Upload Image"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
          />
          <ToolbarButton icon={Table} label="Insert Table" onClick={handleInsertTable} disabled={disabled} />
          <ToolbarButton
            icon={Minus}
            label="Insert Divider"
            onClick={() => runCommand('insertHorizontalRule')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={AlignLeft}
            label="Align Left"
            onClick={() => runCommand('justifyLeft')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={AlignCenter}
            label="Align Center"
            onClick={() => runCommand('justifyCenter')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={AlignRight}
            label="Align Right"
            onClick={() => runCommand('justifyRight')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={AlignJustify}
            label="Justify"
            onClick={() => runCommand('justifyFull')}
            disabled={disabled}
          />
          <ToolbarButton
            icon={Eraser}
            label="Clear Formatting"
            onClick={() => {
              runCommand('removeFormat');
              runCommand('unlink');
              runCommand('formatBlock', '<p>');
            }}
            disabled={disabled}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => textColorInputRef.current?.click()}
            disabled={disabled}
            className="h-8 shrink-0 rounded-lg border-border/70 bg-background/70 px-2 text-xs"
            aria-label="Text color"
          >
            <Type className="h-3.5 w-3.5" />
            Text
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => highlightColorInputRef.current?.click()}
            disabled={disabled}
            className="h-8 shrink-0 rounded-lg border-border/70 bg-background/70 px-2 text-xs"
            aria-label="Highlight color"
          >
            <Highlighter className="h-3.5 w-3.5" />
            Highlight
          </Button>
        </div>
      </div>

      <div
        id={editorId}
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline
        data-placeholder={placeholder}
        data-empty={isEmpty ? 'true' : 'false'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          emitChange();
        }}
        onInput={emitChange}
        className={cn(
          'admin-rich-editor relative overflow-hidden rounded-xl border border-border/70 bg-[#0f172a] px-4 py-3 text-sm text-slate-100 shadow-inner outline-none transition-all duration-300',
          'focus-within:border-primary/40 focus-within:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]',
          minHeightClassName
        )}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={textColorInputRef}
        type="color"
        className="sr-only"
        onChange={(event) => runCommand('foreColor', event.target.value)}
      />
      <input
        ref={highlightColorInputRef}
        type="color"
        className="sr-only"
        onChange={(event) => runCommand('hiliteColor', event.target.value)}
      />
    </div>
  );
}
