import { type RefObject, useEffect, useRef } from 'react';

import { playConfetti } from '@/features/home/lib/confetti';
import { useFirstSaleCelebratedMutation } from '@/features/home/services/first-sale';

const LANDING_CARD_SELECTOR = '[data-home-card]';

const useFirstSaleCelebration = (
  shouldCelebrate: boolean,
  cardRef: RefObject<HTMLElement | null>,
) => {
  const { mutate: recordCelebrated } = useFirstSaleCelebratedMutation();
  const hasStartedRef = useRef(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!shouldCelebrate || hasStartedRef.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const cardElement = cardRef.current;

      if (!cardElement || hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;
      stopRef.current = playConfetti({
        cardElement,
        otherCardElements: Array.from(
          document.querySelectorAll<HTMLElement>(LANDING_CARD_SELECTOR),
        ),
      });
      recordCelebrated();
    });

    return () => cancelAnimationFrame(frame);
  }, [shouldCelebrate, cardRef, recordCelebrated]);

  useEffect(() => {
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, []);
};

export { LANDING_CARD_SELECTOR, useFirstSaleCelebration };
