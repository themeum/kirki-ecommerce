import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Combobox from '@/components/ui/combobox';

/**
 * Mirrors what country-selector supplies once names are translated: the label
 * is the displayed name, the keyword is the ISO code, which stays stable
 * across locales.
 *
 * Every code here is absent from its own label - cmdk scores subsequences, so
 * a code like DE against "Deutschland" would match on the label alone and
 * prove nothing about keywords.
 */
const OPTIONS = [
  { value: 'DE', label: 'Allemagne', keywords: ['DE'] },
  { value: 'GB', label: 'Royaume-Uni', keywords: ['GB'] },
  { value: 'JP', label: 'Japon', keywords: ['JP'] },
];

const search = (term: string) => {
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: term } });
};

afterEach(cleanup);

describe('Combobox search', () => {
  it('matches an option by its keyword when the label does not contain it', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} />);

    search('DE');

    expect(screen.getByText('Allemagne')).toBeInTheDocument();
    expect(screen.queryByText('Japon')).not.toBeInTheDocument();
  });

  it('matches an option by its displayed label', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} />);

    search('Royau');

    expect(screen.getByText('Royaume-Uni')).toBeInTheDocument();
    expect(screen.queryByText('Allemagne')).not.toBeInTheDocument();
  });

  it('does not match a code when no keyword is supplied', () => {
    const withoutKeywords = OPTIONS.map(({ value, label }) => ({ value, label }));

    render(<Combobox options={withoutKeywords} onChange={vi.fn()} />);

    search('DE');

    expect(screen.queryByText('Allemagne')).not.toBeInTheDocument();
  });
});
