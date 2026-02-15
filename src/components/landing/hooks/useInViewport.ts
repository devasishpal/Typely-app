import { useEffect, useRef, useState } from 'react';

interface UseInViewportOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useInViewport<T extends HTMLElement>({
  threshold = 0.2,
  rootMargin = '0px',
  once = true,
}: UseInViewportOptions = {}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
