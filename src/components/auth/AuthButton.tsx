import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { MouseEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authButtonHoverVariants } from '@/utils/animations';

type Ripple = {
  id: number;
  x: number;
  y: number;
};

interface AuthButtonProps {
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
  onMouseDown?: (event: MouseEvent<HTMLElement>) => void;
  ripples?: Ripple[];
}

const MotionButton = motion(Button);

export default function AuthButton({
  type = 'button',
  className,
  disabled,
  loading,
  loadingLabel,
  children,
  onMouseDown,
  ripples,
}: AuthButtonProps) {
  return (
    <div className="relative">
      <MotionButton
        type={type}
        className={cn(
          'auth-button-enhanced relative overflow-hidden',
          loading && 'auth-button-loading',
          className
        )}
        disabled={disabled}
        variants={authButtonHoverVariants}
        initial="rest"
        whileHover={disabled ? 'rest' : 'hover'}
        whileTap={disabled ? 'rest' : 'tap'}
        onMouseDown={onMouseDown}
      >
        <span className="auth-button-gradient-slide" />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? loadingLabel : children}
        </span>

        {ripples?.map((ripple) => (
          <span
            key={ripple.id}
            className="auth-ripple"
            style={{ left: ripple.x, top: ripple.y }}
            aria-hidden="true"
          />
        ))}
      </MotionButton>
    </div>
  );
}
