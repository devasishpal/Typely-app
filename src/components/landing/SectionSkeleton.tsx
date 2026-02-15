import { Skeleton } from '@/components/ui/skeleton';

export function SectionSkeleton() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <Skeleton className="mx-auto h-6 w-40 rounded-full bg-primary/20" />
        <Skeleton className="mx-auto h-10 w-3/4 bg-primary/15" />
        <Skeleton className="mx-auto h-4 w-2/3 bg-primary/10" />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44 bg-card/80" />
        <Skeleton className="h-44 bg-card/80" />
        <Skeleton className="h-44 bg-card/80" />
      </div>
    </section>
  );
}
