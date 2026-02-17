import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSynthSfxResult {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  playHit: () => void;
  playFail: () => void;
  playBoss: () => void;
}

const createTone = (
  context: AudioContext,
  frequency: number,
  duration: number,
  gainValue: number,
  type: OscillatorType
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
};

export const useSynthSfx = (): UseSynthSfxResult => {
  const contextRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    if (!contextRef.current) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        contextRef.current = new AudioContextCtor();
      }
    }
  }, [enabled]);

  const withContext = useCallback((fn: (context: AudioContext) => void) => {
    if (!enabled) return;
    const context = contextRef.current;
    if (!context) return;
    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }
    fn(context);
  }, [enabled]);

  const playHit = useCallback(() => {
    withContext((context) => {
      createTone(context, 560, 0.08, 0.05, 'triangle');
    });
  }, [withContext]);

  const playFail = useCallback(() => {
    withContext((context) => {
      createTone(context, 180, 0.14, 0.055, 'sawtooth');
    });
  }, [withContext]);

  const playBoss = useCallback(() => {
    withContext((context) => {
      createTone(context, 220, 0.22, 0.06, 'square');
      createTone(context, 330, 0.24, 0.04, 'triangle');
    });
  }, [withContext]);

  return {
    enabled,
    setEnabled,
    playHit,
    playFail,
    playBoss,
  };
};

export default useSynthSfx;

