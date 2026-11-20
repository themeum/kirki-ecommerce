type Countdown = {
  pause: (now: number) => void;
  resume: (now: number) => void;
  remaining: (now: number) => number;
  fraction: (now: number) => number;
  isPaused: () => boolean;
};

const createCountdown = (durationMs: number, now: number, startPaused = false): Countdown => {
  let remainingAtMark = durationMs;
  let markedAt = now;
  let paused = startPaused;

  const remaining = (at: number): number => {
    if (paused) {
      return remainingAtMark;
    }

    return Math.max(0, remainingAtMark - (at - markedAt));
  };

  const pause = (at: number): void => {
    if (paused) {
      return;
    }

    remainingAtMark = remaining(at);
    paused = true;
  };

  const resume = (at: number): void => {
    if (!paused) {
      return;
    }

    markedAt = at;
    paused = false;
  };

  const fraction = (at: number): number => {
    if (durationMs <= 0) {
      return 0;
    }

    return remaining(at) / durationMs;
  };

  return {
    pause,
    resume,
    remaining,
    fraction,
    isPaused: () => paused,
  };
};

export { createCountdown };
export type { Countdown };
