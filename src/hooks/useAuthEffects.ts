import { useCallback, useMemo, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

export type AuthFieldStatus = 'idle' | 'error' | 'success';

type FieldMap = Record<string, AuthFieldStatus>;
type FieldTokenMap = Record<string, number>;

type Ripple = {
  id: number;
  x: number;
  y: number;
};

const INITIAL_TILT = { rx: 0, ry: 0 };

export function useAuthEffects() {
  const [fieldStatus, setFieldStatus] = useState<FieldMap>({});
  const [shakeTokens, setShakeTokens] = useState<FieldTokenMap>({});
  const [successTokens, setSuccessTokens] = useState<FieldTokenMap>({});
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [tilt, setTilt] = useState(INITIAL_TILT);

  const setStatus = useCallback((field: string, status: AuthFieldStatus) => {
    setFieldStatus((prev) => ({ ...prev, [field]: status }));
  }, []);

  const markFieldError = useCallback((field: string) => {
    setFieldStatus((prev) => ({ ...prev, [field]: 'error' }));
    setShakeTokens((prev) => ({ ...prev, [field]: Date.now() }));
  }, []);

  const markFieldSuccess = useCallback((field: string) => {
    setFieldStatus((prev) => ({ ...prev, [field]: 'success' }));
    setSuccessTokens((prev) => ({ ...prev, [field]: Date.now() }));
  }, []);

  const clearFieldState = useCallback((field: string) => {
    setFieldStatus((prev) => ({ ...prev, [field]: 'idle' }));
  }, []);

  const triggerRipple = useCallback((event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id));
    }, 700);
  }, []);

  const handleCardPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 4;
    const rotateX = (0.5 - py) * 4;

    setTilt({ rx: rotateX, ry: rotateY });
  }, []);

  const handleCardPointerLeave = useCallback(() => {
    setTilt(INITIAL_TILT);
  }, []);

  const cardTiltStyle = useMemo(
    () => ({
      boxShadow: `${tilt.ry * 2}px ${22 - tilt.rx * 2}px 52px -22px rgba(2, 6, 23, 0.62), 0 0 0 1px hsl(var(--primary) / 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06)`,
    }),
    [tilt]
  );

  return {
    fieldStatus,
    shakeTokens,
    successTokens,
    setStatus,
    markFieldError,
    markFieldSuccess,
    clearFieldState,
    ripples,
    triggerRipple,
    cardTiltStyle,
    handleCardPointerMove,
    handleCardPointerLeave,
  };
}
