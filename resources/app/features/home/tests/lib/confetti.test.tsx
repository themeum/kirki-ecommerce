import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aimAt, findLandingX, playConfetti } from '@/features/home/lib/confetti';

const fakeContext = () => {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
};

describe('findLandingX', () => {
  it('returns where a falling piece crosses the given line', () => {
    const landingX = findLandingX({ x: 0, y: 800, vx: 5, vy: -25, sway: 0, vs: 0 }, 300);

    expect(landingX).not.toBeNull();
    expect(landingX).toBeGreaterThan(0);
  });

  it('returns null when the piece never reaches the line', () => {
    expect(findLandingX({ x: 0, y: 800, vx: 5, vy: -5, sway: 0, vs: 0 }, 100)).toBeNull();
  });
});

describe('aimAt', () => {
  it('finds a launch that lands within 6 px of the target', () => {
    const target = {
      originX: 6,
      originY: 806,
      targetX: 400,
      topY: 200,
      fromLeft: true,
      sway: 0,
      vs: 0.04,
    };
    const aim = aimAt(target);

    expect(aim).not.toBeNull();

    const landingX = findLandingX(
      { x: target.originX, y: target.originY, vx: aim!.vx, vy: aim!.vy, sway: 0, vs: 0.04 },
      target.topY,
    );

    expect(Math.abs((landingX ?? 0) - target.targetX)).toBeLessThan(6);
  });
});

describe('playConfetti', () => {
  let cancelFrame: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(fakeContext);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('adds a hidden canvas that does not take pointer input', () => {
    const card = document.createElement('section');
    document.body.appendChild(card);

    playConfetti({ cardElement: card, otherCardElements: [] });

    const canvas = document.querySelector('canvas');

    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.style.pointerEvents).toBe('none');
    expect(canvas?.style.position).toBe('fixed');
  });

  it('removes the canvas and the resize listener on stop', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const card = document.createElement('section');
    document.body.appendChild(card);

    const stop = playConfetti({ cardElement: card, otherCardElements: [] });
    stop();

    expect(document.querySelector('canvas')).toBeNull();
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(cancelFrame).toHaveBeenCalled();
  });
});
