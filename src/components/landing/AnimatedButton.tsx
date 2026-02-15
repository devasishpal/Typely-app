import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';
import { clamp } from '@/components/landing/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface RippleState {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface AnimatedButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'border border-primary/70 bg-gradient-primary text-primary-foreground shadow-card hover:shadow-glow',
  secondary:
    'border border-secondary/50 bg-secondary/90 text-secondary-foreground shadow-card hover:shadow-glow',
  outline:
    'border border-border bg-background/80 text-foreground shadow-sm hover:border-primary/35 hover:bg-background/95',
  ghost: 'border border-transparent bg-transparent text-foreground hover:bg-primary/10',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-lg px-4 text-sm',
  md: 'h-11 rounded-xl px-6 text-sm md:text-base',
  lg: 'h-12 rounded-xl px-8 text-base md:text-lg',
};

const MotionLink = motion(Link);
const MotionAnchor = motion('a');
const MotionButton = motion('button');

export function AnimatedButton({
  children,
  to,
  href,
  target,
  rel,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  iconLeft,
  iconRight,
  disabled = false,
}: AnimatedButtonProps) {
  const reduceMotion = useReducedMotion();
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const springX = useSpring(motionX, { stiffness: 240, damping: 18, mass: 0.45 });
  const springY = useSpring(motionY, { stiffness: 240, damping: 18, mass: 0.45 });

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const triggerRipple = (event: React.MouseEvent<HTMLElement>) => {
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev, { id, x, y, size }]);

    const timeout = window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 620);
    timeoutsRef.current.push(timeout);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion || disabled) return;
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const mouseY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
    targetElement.style.setProperty('--mouse-x', `${mouseX}%`);
    targetElement.style.setProperty('--mouse-y', `${mouseY}%`);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clamp((event.clientX - centerX) / 8, -10, 10);
    const deltaY = clamp((event.clientY - centerY) / 8, -10, 10);
    motionX.set(deltaX);
    motionY.set(deltaY);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    const targetElement = event.currentTarget as HTMLElement;
    targetElement.style.removeProperty('--mouse-x');
    targetElement.style.removeProperty('--mouse-y');
    motionX.set(0);
    motionY.set(0);
  };

  const handlePress = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    triggerRipple(event);
    onClick?.(event);
  };

  const commonProps = {
    'aria-label': ariaLabel,
    onClick: handlePress,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    whileHover: reduceMotion || disabled ? undefined : { scale: 1.03 },
    whileTap: reduceMotion || disabled ? undefined : { scale: 0.98 },
    style: reduceMotion ? undefined : { x: springX, y: springY },
    className: cn(
      'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold tracking-tight transition-all duration-300',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-55',
      variantClassMap[variant],
      sizeClassMap[size],
      className
    ),
  } as const;

  const content = (
    <>
      <span className="pointer-events-none relative z-[2] inline-flex items-center gap-2">
        {iconLeft}
        {children}
        {iconRight}
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary)/0.15), transparent 65%)',
        }}
      />

      <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] rounded-full bg-white/25"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animation: 'typelyRipple 620ms ease-out forwards',
          }}
        />
      ))}
    </>
  );

  if (to) {
    return (
      <MotionLink to={to} {...commonProps}>
        {content}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <MotionAnchor href={href} target={target} rel={rel} {...commonProps}>
        {content}
      </MotionAnchor>
    );
  }

  return (
    <MotionButton type={type} disabled={disabled} {...commonProps}>
      {content}
    </MotionButton>
  );
}
