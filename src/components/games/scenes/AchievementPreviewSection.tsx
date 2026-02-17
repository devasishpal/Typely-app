import { motion } from 'motion/react';
import { Award, Lock } from 'lucide-react';
import type { AchievementPreviewSectionProps } from '@/components/games/scenes/types';
import { clamp } from '@/components/games/utils/gameMath';

export default function AchievementPreviewSection({ achievements }: AchievementPreviewSectionProps) {
  return (
    <section className="space-y-3" aria-label="Achievement Preview">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Achievement Preview</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress Snapshot</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement, index) => {
          const ratio = clamp(achievement.progress / Math.max(1, achievement.goal), 0, 1);
          return (
            <motion.article
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
              className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{achievement.title}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted/35">
                  {achievement.unlocked ? (
                    <Award className="h-4.5 w-4.5 text-success" />
                  ) : (
                    <Lock className="h-4.5 w-4.5 text-muted-foreground" />
                  )}
                </span>
              </div>

              <p className="mb-3 text-xs text-muted-foreground">{achievement.description}</p>

              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted/70">
                <motion.div
                  className={achievement.unlocked ? 'h-full bg-success' : 'h-full bg-gradient-progress'}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {achievement.progress.toFixed(achievement.goal > 100 ? 0 : 1)} / {achievement.goal}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
