import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { authErrorShakeVariants, authInputFocusVariants, authSuccessGlowVariants } from '@/utils/animations';
import type { AuthFieldStatus } from '@/hooks/useAuthEffects';

interface AuthInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  wrapperClassName?: string;
  helperText?: string;
  status?: AuthFieldStatus;
  shakeToken?: number;
  successToken?: number;
}

export default function AuthInput({
  id,
  label,
  type,
  value,
  placeholder,
  required,
  disabled,
  autoComplete,
  onChange,
  wrapperClassName,
  helperText,
  status = 'idle',
  shakeToken,
  successToken,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  const animateState = useMemo(() => {
    if (status === 'error') return 'shake';
    return 'idle';
  }, [status]);

  const glowState = useMemo(() => {
    if (status === 'success') return 'success';
    return 'idle';
  }, [status, successToken]);

  return (
    <motion.div
      className={cn('space-y-2', wrapperClassName)}
      variants={authErrorShakeVariants}
      animate={animateState}
      key={`${id}-${shakeToken ?? 0}`}
    >
      <Label htmlFor={id}>{label}</Label>
      <motion.div
        className="relative"
        variants={authInputFocusVariants}
        animate={focused ? 'focused' : 'idle'}
      >
        <motion.div variants={authSuccessGlowVariants} animate={glowState}>
          <Input
            id={id}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              'auth-input-enhanced transition-all duration-300',
              status === 'error' && 'auth-input-error',
              status === 'success' && 'auth-input-success',
              focused && 'auth-input-focused'
            )}
          />
        </motion.div>
      </motion.div>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
    </motion.div>
  );
}
