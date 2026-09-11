import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import FloatingBar from '@/components/floating-bar/floating-bar';

// The bar portals into `#kirki-ecommerce-root` (libs/portal-container.ts), and
// its `scoped()` styles only apply under `#wpbody-content .kirki-ecommerce-root`
// (theme/mixins.ts). Nest both so the portal target sits inside the scope and
// the computed style assertions are meaningful.
const mountAppRoot = () => {
  const wpbody = document.createElement('div');
  wpbody.id = 'wpbody-content';
  const scope = document.createElement('div');
  scope.className = 'kirki-ecommerce-root';
  const portalTarget = document.createElement('div');
  portalTarget.id = 'kirki-ecommerce-root';
  scope.appendChild(portalTarget);
  wpbody.appendChild(scope);
  document.body.appendChild(wpbody);
};

const renderBar = (ui: ReactElement) => {
  mountAppRoot();
  return render(ui);
};

const getWrapper = () =>
  document.querySelector<HTMLElement>('[data-slot="floating-bar"]')!;

const getContent = () => getWrapper().firstElementChild as HTMLElement;

// jsdom's cssstyle does not expand the `animation` shorthand, so
// `getComputedStyle(...).animationName` stays "none" even when the rule is
// applied. Emotion only injects a `@keyframes` block once some serialized
// style actually references it, so the injected CSS is the reliable signal.
const injectedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('');

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('FloatingBar visibility', () => {
  it('is opaque and interactive while visible', () => {
    renderBar(<FloatingBar visible />);

    const wrapper = getWrapper();

    expect(getComputedStyle(wrapper).opacity).toBe('1');
    expect(getComputedStyle(wrapper).pointerEvents).toBe('auto');
    expect(wrapper).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('is transparent, inert and hidden from assistive tech while not visible', () => {
    renderBar(<FloatingBar visible={false} />);

    const wrapper = getWrapper();

    expect(getComputedStyle(wrapper).opacity).toBe('0');
    expect(getComputedStyle(wrapper).pointerEvents).toBe('none');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('rises from below the bottom edge rather than appearing in place', () => {
    renderBar(<FloatingBar visible={false} />);

    const hiddenTransform = getComputedStyle(getWrapper()).transform;

    cleanup();
    document.body.innerHTML = '';
    renderBar(<FloatingBar visible />);

    const visibleTransform = getComputedStyle(getWrapper()).transform;

    expect(hiddenTransform).toContain('translateY(100%)');
    expect(visibleTransform).toContain('translateY(0)');
  });
});

describe('FloatingBar label', () => {
  it('defaults to "Unsaved changes"', () => {
    renderBar(<FloatingBar visible />);

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('renders a string label as text', () => {
    renderBar(<FloatingBar visible label="Unsaved product" />);

    expect(screen.getByText('Unsaved product')).toBeInTheDocument();
  });

  it('renders a node label as given', () => {
    renderBar(
      <FloatingBar
        visible
        label={<strong data-testid="rich-label">Unsaved variant</strong>}
      />,
    );

    expect(screen.getByTestId('rich-label')).toBeInTheDocument();
  });
});

describe('FloatingBar actions', () => {
  it('renders the actions it is given as children', () => {
    renderBar(
      <FloatingBar visible>
        <button type="button">Discard</button>
        <button type="button">Create</button>
      </FloatingBar>,
    );

    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});

describe('FloatingBar shake', () => {
  it('does not shake when it merely becomes visible', () => {
    renderBar(<FloatingBar visible />);

    expect(injectedCss()).not.toContain('@keyframes');
  });

  it('shakes once a blocked navigation has bumped the signal', () => {
    renderBar(<FloatingBar visible shakeSignal={1} />);

    expect(injectedCss()).toContain('@keyframes');
  });

  it('remounts its content on each bump so the shake replays', () => {
    const { rerender } = renderBar(<FloatingBar visible shakeSignal={1} />);
    const first = getContent();

    rerender(<FloatingBar visible shakeSignal={2} />);

    expect(getContent()).not.toBe(first);
  });
});

describe('FloatingBar positioning', () => {
  // jsdom performs no layout, so every rect is zero-sized. Stubbing the content
  // column's rect is what lets these assertions describe a real wp-admin
  // layout: a 1200px viewport with the admin menu occupying the first 160px.
  const stubContentColumn = (left: number, width: number) => {
    const content = document.querySelector('#wpbody-content')!;
    content.getBoundingClientRect = () => ({ left, width }) as DOMRect;
  };

  it('centres over the content column rather than the viewport', () => {
    mountAppRoot();
    stubContentColumn(160, 1040);

    render(<FloatingBar visible />);

    expect(getWrapper().style.left).toBe('680px');
  });

  it('follows the content column when the admin menu is folded', () => {
    mountAppRoot();
    stubContentColumn(36, 1164);

    render(<FloatingBar visible />);

    expect(getWrapper().style.left).toBe('618px');
  });

  it('falls back to the viewport centre outside wp-admin', () => {
    const portalTarget = document.createElement('div');
    portalTarget.id = 'kirki-ecommerce-root';
    document.body.appendChild(portalTarget);

    render(<FloatingBar visible />);

    expect(getWrapper().style.left).toBe('');
  });
});
