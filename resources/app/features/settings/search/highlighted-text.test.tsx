import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HighlightedText from '@/features/settings/search/highlighted-text';

const marksIn = (container: HTMLElement) => {
  return [...container.querySelectorAll('mark')].map((mark) => mark.textContent);
};

afterEach(cleanup);

describe('HighlightedText', () => {
  it('marks a word whose stem matches a term', () => {
    const { container } = render(
      <HighlightedText text="Shipping Zones" terms={['ship', 'zone']} />,
    );

    expect(marksIn(container)).toEqual(['Shipping', 'Zones']);
  });

  it('marks a related term the merchant never typed', () => {
    const { container } = render(
      <HighlightedText
        text="Let customers buy without creating an account"
        terms={['account', 'without']}
      />,
    );

    expect(marksIn(container)).toEqual(['without', 'account']);
  });

  it('preserves the full text around the marks', () => {
    const { container } = render(
      <HighlightedText text="Store Contact Details" terms={['contact']} />,
    );

    expect(container.textContent).toBe('Store Contact Details');
  });

  it('marks a word whatever case it is written in', () => {
    const { container } = render(
      <HighlightedText text="SHIPPING zones" terms={['ship', 'zone']} />,
    );

    expect(marksIn(container)).toEqual(['SHIPPING', 'zones']);
  });

  it('renders plain text when nothing matched', () => {
    const { container } = render(
      <HighlightedText text="Store Contact Details" terms={[]} />,
    );

    expect(marksIn(container)).toEqual([]);
    expect(container.textContent).toBe('Store Contact Details');
  });

  it('does not mark a word that merely contains a term as a substring', () => {
    const { container } = render(
      <HighlightedText text="Taxonomy settings" terms={['tax']} />,
    );

    expect(marksIn(container)).toEqual([]);
  });
});
