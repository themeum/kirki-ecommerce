import { cleanup, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';

// Emotion's `scoped()` styles only take effect under this ancestor selector
// (see theme/mixins.ts's APP_ROOT_SELECTOR), which the real app always mounts
// inside; reproduce it here so the computed style assertions are meaningful.
const renderScoped = (ui: ReactElement) =>
  render(ui, {
    container: (() => {
      const wpbody = document.createElement('div');
      wpbody.id = 'wpbody-content';
      const root = document.createElement('div');
      root.className = 'kirki-ecommerce-root';
      wpbody.appendChild(root);
      document.body.appendChild(wpbody);
      return root;
    })(),
  });

const getSkeleton = () =>
  document.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('Skeleton sizing', () => {
  it('treats numeric dimensions as pixels', () => {
    renderScoped(<Skeleton width={120} height={12} />);

    const skeleton = getSkeleton();

    expect(skeleton.style.getPropertyValue('--skeleton-width')).toBe('120px');
    expect(skeleton.style.getPropertyValue('--skeleton-height')).toBe('12px');
  });

  it('passes string dimensions through untouched', () => {
    renderScoped(<Skeleton width="60%" height="1.5rem" />);

    const skeleton = getSkeleton();

    expect(skeleton.style.getPropertyValue('--skeleton-width')).toBe('60%');
    expect(skeleton.style.getPropertyValue('--skeleton-height')).toBe('1.5rem');
  });

  it('falls back to full width and a single line when dimensions are omitted', () => {
    renderScoped(<Skeleton />);

    const skeleton = getSkeleton();

    expect(skeleton.style.getPropertyValue('--skeleton-width')).toBe('');
    expect(skeleton.style.getPropertyValue('--skeleton-height')).toBe('');

    // jsdom does not resolve custom-property fallbacks, so assert the
    // declaration carries them rather than the resolved length.
    expect(getComputedStyle(skeleton).width).toBe('var(--skeleton-width, 100%)');
    expect(getComputedStyle(skeleton).height).toBe('var(--skeleton-height, 1rem)');
  });

  it('lets a caller-supplied style prop through', () => {
    renderScoped(<Skeleton width={40} style={{ marginTop: '8px' }} />);

    const skeleton = getSkeleton();

    expect(skeleton.style.marginTop).toBe('8px');
    expect(skeleton.style.getPropertyValue('--skeleton-width')).toBe('40px');
  });
});

describe('Skeleton radius', () => {
  it('uses the medium radius token by default', () => {
    renderScoped(<Skeleton />);

    expect(getComputedStyle(getSkeleton()).borderRadius).toBe(theme.radius.md);
  });

  it('maps the full token to a fully rounded shape', () => {
    renderScoped(<Skeleton radius="full" width={16} height={16} />);

    expect(getComputedStyle(getSkeleton()).borderRadius).toBe(theme.radius.full);
  });
});

describe('Skeleton accessibility and animation', () => {
  it('is decorative and identifiable by its slot', () => {
    renderScoped(<Skeleton />);

    const skeleton = getSkeleton();

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('pulses on a repeating two second cycle', () => {
    renderScoped(<Skeleton />);

    const animation = getComputedStyle(getSkeleton()).animation;

    expect(animation).toContain('2s');
    expect(animation).toContain('infinite');
  });

  it('merges a caller style override on top of its own styling', () => {
    renderScoped(<Skeleton cssOverride={{ opacity: 0.25 }} />);

    expect(getComputedStyle(getSkeleton()).opacity).toBe('0.25');
  });
});
