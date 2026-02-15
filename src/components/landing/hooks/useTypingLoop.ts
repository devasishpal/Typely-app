import { useEffect, useState } from 'react';

interface UseTypingLoopOptions {
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function useTypingLoop(
  phrases: string[],
  { typingSpeed = 95, deletingSpeed = 55, pauseDuration = 1500 }: UseTypingLoopOptions = {}
) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;

    const currentPhrase = phrases[phraseIndex % phrases.length] ?? '';
    if (!isDeleting && text === currentPhrase) {
      const timeout = window.setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => window.clearTimeout(timeout);
    }

    if (isDeleting && text.length === 0) {
      const timeout = window.setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, deletingSpeed);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      const nextLength = isDeleting ? text.length - 1 : text.length + 1;
      const nextText = currentPhrase.slice(0, Math.max(0, nextLength));
      setText(nextText);
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [deletingSpeed, isDeleting, pauseDuration, phraseIndex, phrases, text, typingSpeed]);

  return {
    text,
    phraseIndex,
    isDeleting,
  };
}
