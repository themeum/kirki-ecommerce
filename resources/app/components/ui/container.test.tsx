import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Container from '@/components/ui/container';

afterEach(cleanup);

const getAppliedCss = (element: HTMLElement) => {
  const classNames = Array.from(element.classList);

  return Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .filter((rule) => classNames.some((name) => rule.cssText.includes(`.${name}`)))
    .map((rule) => rule.cssText)
    .join(' ');
};

describe('Container', () => {
  it('keeps a 16px gutter on each side for sized containers', () => {
    render(
      <Container size="xxl" data-testid="container">
        content
      </Container>,
    );

    expect(getAppliedCss(screen.getByTestId('container'))).toContain('width: calc(100% - 2rem)');
  });

  it('spans the parent for fullWidth', () => {
    render(
      <Container size="fullWidth" data-testid="container">
        content
      </Container>,
    );

    const css = getAppliedCss(screen.getByTestId('container'));

    expect(css).toContain('width: 100%');
    expect(css).not.toContain('calc(100% - 2rem)');
  });
});
