import { describe, expect, it } from 'vitest';

import { createCountdown } from '@/components/ui/toast/toast-countdown';

describe('createCountdown', () => {
  it('counts down from the full duration', () => {
    const countdown = createCountdown(4000, 1000);

    expect(countdown.remaining(1000)).toBe(4000);
    expect(countdown.remaining(3000)).toBe(2000);
    expect(countdown.fraction(3000)).toBe(0.5);
  });

  it('stops time while paused', () => {
    const countdown = createCountdown(4000, 0);

    countdown.pause(1000);

    expect(countdown.isPaused()).toBe(true);
    expect(countdown.remaining(9000)).toBe(3000);
  });

  it('continues with the time left after resume', () => {
    const countdown = createCountdown(4000, 0);

    countdown.pause(1000);
    countdown.resume(11000);

    expect(countdown.isPaused()).toBe(false);
    expect(countdown.remaining(12000)).toBe(2000);
  });

  it('is safe to pause or resume twice', () => {
    const countdown = createCountdown(4000, 0);

    countdown.pause(1000);
    countdown.pause(2000);
    countdown.resume(5000);
    countdown.resume(6000);

    expect(countdown.remaining(5000)).toBe(3000);
  });

  it('can start paused', () => {
    const countdown = createCountdown(4000, 0, true);

    expect(countdown.remaining(5000)).toBe(4000);

    countdown.resume(5000);

    expect(countdown.remaining(6000)).toBe(3000);
  });

  it('reaches zero and does not go below it', () => {
    const countdown = createCountdown(4000, 0);

    expect(countdown.remaining(4000)).toBe(0);
    expect(countdown.remaining(9000)).toBe(0);
    expect(countdown.fraction(9000)).toBe(0);
  });
});
