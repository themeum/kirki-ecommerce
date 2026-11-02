import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import CountrySelector from '@/components/country-selector';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

const countries = [
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  // No flag in the payload — its name must still line up with the rest.
  { name: 'Flagless Republic', code: 'XX' },
];

beforeAll(() => {
  // See combobox.test.tsx: jsdom reports a zero-sized list, which collapses
  // the virtualizer to zero rows.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 240,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 320,
  });
});

beforeEach(() => {
  server.use(http.get(`${API}/countries`, () => HttpResponse.json({ data: countries })));
});

afterEach(cleanup);

const renderSelector = (props: Partial<Parameters<typeof CountrySelector>[0]> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CountrySelector onChange={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
};

const openList = async () => {
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('combobox'));

  return screen.findAllByRole('option');
};

describe('CountrySelector', () => {
  it('shows each country flag before its name', async () => {
    renderSelector();

    const options = await openList();
    const bangladesh = options.find((option) => option.textContent?.includes('Bangladesh'));
    const text = bangladesh?.textContent ?? '';

    expect(text).toContain('🇧🇩');
    expect(text.indexOf('🇧🇩')).toBeLessThan(text.indexOf('Bangladesh'));
  });

  it('still renders a country that has no flag', async () => {
    renderSelector();

    const options = await openList();

    expect(options.some((option) => option.textContent?.includes('Flagless Republic'))).toBe(true);
  });

  it('reserves the flag slot on the flagless row so names stay aligned', async () => {
    renderSelector();

    const options = await openList();
    const flagless = options.find((option) => option.textContent?.includes('Flagless Republic'));
    const withFlag = options.find((option) => option.textContent?.includes('Belgium'));

    expect(flagless?.children.length).toBe(withFlag?.children.length);
  });

  it('shows the selected country flag on the closed trigger', async () => {
    renderSelector({ value: 'DE' });

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Germany');
    });

    expect(screen.getByRole('combobox')).toHaveTextContent('🇩🇪');
  });

  it('virtualizes the list rather than mounting every country', async () => {
    const many = Array.from({ length: 250 }, (_, index) => ({
      name: `Country ${index}`,
      code: `C${index}`,
      flag: '🏳️',
    }));

    server.use(http.get(`${API}/countries`, () => HttpResponse.json({ data: many })));

    renderSelector();

    const options = await openList();

    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(many.length);
  });
});
