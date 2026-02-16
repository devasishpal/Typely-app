import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';

interface BeginnerCardProps {
  title?: string;
  description?: string;
}

export default function BeginnerCard({
  title = 'Beginner',
  description = 'Steady rhythm drills designed for confident muscle memory.',
}: BeginnerCardProps) {
  return (
    <LessonCardWrapper className="overflow-hidden border-cyan-400/30 bg-gradient-to-br from-cyan-500/18 via-blue-500/14 to-indigo-600/25" interactive>
      <CardContent className="relative p-4">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-8 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/80">Level</p>
        <h3 className="mt-1 text-3xl font-extrabold leading-none text-white">{title}</h3>
        <p className="mt-2 text-sm leading-5 text-cyan-100/85">{description}</p>
      </CardContent>
    </LessonCardWrapper>
  );
}
