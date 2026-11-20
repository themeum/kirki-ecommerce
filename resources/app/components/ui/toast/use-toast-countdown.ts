import { useEffect, useRef } from 'react';

import { createCountdown } from '@/components/ui/toast/toast-countdown';
import { toastPauseStore } from '@/components/ui/toast/toast-pause-store';

type UseToastCountdownOptions = {
  durationMs: number | null;
  revision: number;
  onExpire: () => void;
};

const RING_PATH_LENGTH = 100;

const getRingOffset = (fraction: number): string => {
  return (RING_PATH_LENGTH * (1 - fraction)).toFixed(2);
};

const useToastCountdown = ({ durationMs, revision, onExpire }: UseToastCountdownOptions) => {
  const ringRef = useRef<SVGCircleElement>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (durationMs === null) {
      return;
    }

    const countdown = createCountdown(durationMs, performance.now(), true);
    let frame = 0;
    let expired = false;

    const paint = (now: number) => {
      ringRef.current?.setAttribute('stroke-dashoffset', getRingOffset(countdown.fraction(now)));
    };

    const tick = () => {
      const now = performance.now();

      paint(now);

      if (countdown.remaining(now) > 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      if (!expired) {
        expired = true;
        onExpireRef.current();
      }
    };

    const sync = () => {
      const now = performance.now();

      cancelAnimationFrame(frame);

      if (toastPauseStore.isPaused()) {
        countdown.pause(now);
        paint(now);
        return;
      }

      countdown.resume(now);
      frame = requestAnimationFrame(tick);
    };

    paint(performance.now());
    sync();

    const unsubscribe = toastPauseStore.subscribe(sync);

    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [durationMs, revision]);

  return ringRef;
};

export { getRingOffset, RING_PATH_LENGTH, useToastCountdown };
