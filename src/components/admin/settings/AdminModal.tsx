import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AdminModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusDetail?: string;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSavePrimary: () => void;
  children: ReactNode;
  saving?: boolean;
  savingIntent?: 'draft' | 'publish' | null;
  saveDraftLabel?: string;
  savePrimaryLabel?: string;
  disableSaveDraft?: boolean;
  disableSavePrimary?: boolean;
}

interface AdminModalSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actionSlot?: ReactNode;
}

export function AdminModalSection({
  title,
  description,
  children,
  className,
  actionSlot,
}: AdminModalSectionProps) {
  return (
    <section className={cn('admin-modal-section', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actionSlot}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export default function AdminModal({
  open,
  title,
  subtitle,
  statusLabel,
  statusDetail,
  onOpenChange,
  onCancel,
  onSaveDraft,
  onSavePrimary,
  children,
  saving = false,
  savingIntent = null,
  saveDraftLabel = 'Save Draft',
  savePrimaryLabel = 'Save',
  disableSaveDraft = false,
  disableSavePrimary = false,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'top-0 left-0 h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-border/70 bg-[hsl(var(--card)/0.96)] p-0 shadow-[0_30px_72px_-30px_rgba(2,6,23,0.88)]',
          'data-[state=open]:duration-300 data-[state=closed]:duration-200',
          'sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-[min(100vw-2rem,56.25rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl'
        )}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto,1fr,auto]">
          <div className="border-b border-border/60 px-5 py-5 pr-14 sm:px-8 sm:py-7 sm:pr-16">
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle className="text-xl font-semibold text-foreground">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{subtitle}</DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="min-h-0 px-5 py-5 sm:px-8 sm:py-8">
            <div className="space-y-6">{children}</div>
          </ScrollArea>

          <div className="border-t border-border/60 bg-[hsl(var(--card)/0.95)] px-5 py-3 sm:px-8 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[12rem]">
                <p className="text-sm font-medium text-foreground">{statusLabel}</p>
                {statusDetail ? <p className="text-xs text-muted-foreground">{statusDetail}</p> : null}
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl px-4"
                  onClick={onCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 rounded-xl px-4"
                  onClick={onSaveDraft}
                  disabled={saving || disableSaveDraft}
                >
                  {saving && savingIntent === 'draft' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    saveDraftLabel
                  )}
                </Button>
                <Button
                  type="button"
                  className={cn(
                    'h-10 rounded-xl px-5 text-primary-foreground',
                    'bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--secondary))_100%)]',
                    'hover:brightness-110'
                  )}
                  onClick={onSavePrimary}
                  disabled={saving || disableSavePrimary}
                >
                  {saving && savingIntent === 'publish' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    savePrimaryLabel
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
