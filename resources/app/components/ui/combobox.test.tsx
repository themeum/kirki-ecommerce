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

  it('matches an option by its value even when no keywords are supplied', () => {
    const withoutKeywords = OPTIONS.map(({ value, label }) => ({ value, label }));

    render(<Combobox options={withoutKeywords} onChange={vi.fn()} />);

    search('DE');

    expect(screen.getByText('Allemagne')).toBeInTheDocument();
  });
});

describe('Combobox type-to-open', () => {
  it('opens with the typed character in the search box', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} />);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'J' });

    expect(screen.getByPlaceholderText('Search...')).toHaveValue('J');
  });

  it('focuses the search box with the caret after the typed character', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} />);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' });

    const input: HTMLInputElement = screen.getByPlaceholderText('Search...');

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(1);
  });

  it('stays closed for non-character keys', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} />);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Tab' });

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('stays closed when disabled', () => {
    render(<Combobox options={OPTIONS} onChange={vi.fn()} disabled />);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'J' });

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });
});
