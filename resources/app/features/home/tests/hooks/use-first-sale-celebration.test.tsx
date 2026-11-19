import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFirstSaleCelebration } from '@/features/home/hooks/use-first-sale-celebration';

const { playConfetti, stop, recordCelebrated } = vi.hoisted(() => ({
  playConfetti: vi.fn(),
  stop: vi.fn(),
  recordCelebrated: vi.fn(),
}));

vi.mock('@/features/home/lib/confetti', () => ({ playConfetti }));

vi.mock('@/features/home/services/first-sale', () => ({
  useFirstSaleCelebratedMutation: () => ({ mutate: recordCelebrated }),
}));

const cardRef = { current: document.createElement('section') };

describe('useFirstSaleCelebration', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  const runFrames = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 0;
    playConfetti.mockReset().mockReturnValue(stop);
    stop.mockReset();
    recordCelebrated.mockReset();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      nextFrameId += 1;
      frames.set(nextFrameId, callback);
      return nextFrameId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('plays the confetti once and records the celebration when it starts', () => {
    const other = document.createElement('div');
    other.setAttribute('data-home-card', '');
    document.body.appendChild(other);

    const { rerender } = renderHook(({ due }) => useFirstSaleCelebration(due, cardRef), {
      initialProps: { due: true },
    });
    runFrames();

    expect(playConfetti).toHaveBeenCalledTimes(1);
    expect(playConfetti).toHaveBeenCalledWith({
      cardElement: cardRef.current,
      otherCardElements: [other],
    });
    expect(recordCelebrated).toHaveBeenCalledTimes(1);

    rerender({ due: false });
    rerender({ due: true });
    runFrames();

    expect(playConfetti).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
  });

  it('does not play when the celebration is not due', () => {
    renderHook(() => useFirstSaleCelebration(false, cardRef));
    runFrames();

    expect(playConfetti).not.toHaveBeenCalled();
    expect(recordCelebrated).not.toHaveBeenCalled();
  });

  it('stops the confetti when Home unmounts', () => {
    const { unmount } = renderHook(() => useFirstSaleCelebration(true, cardRef));
    runFrames();

    unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does not start when Home unmounts before the first frame', () => {
    const { unmount } = renderHook(() => useFirstSaleCelebration(true, cardRef));

    unmount();
    runFrames();

    expect(playConfetti).not.toHaveBeenCalled();
  });
});
