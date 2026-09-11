import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stemWord } from '@/features/settings/search/search-engine.mjs';
import {
  SettingsSearchProvider,
  useSettingsSearchTarget,
} from '@/features/settings/search/settings-search-context';
import { useSearchHighlight } from '@/features/settings/search/use-search-highlight';

const ROUTE = '/settings/essentials';
const SEARCH_ID = 'essentials.variation-library';

const Harness = ({ title = 'Variation Library' }: { title?: string }) => {
  const { setTarget, clearTarget } = useSettingsSearchTarget();
  useSearchHighlight();

  useEffect(() => {
    setTarget({
      searchId: SEARCH_ID,
      route: ROUTE,
      terms: [stemWord('variation'), stemWord('library')],
    });
  }, [setTarget]);

  return (
    <div data-search-id={SEARCH_ID} data-testid="card">
      <div data-testid="title-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <button type="button" onClick={clearTarget}>
          Add
        </button>
      </div>
    </div>
  );
};

const renderHarness = () => {
  return render(
    <MemoryRouter initialEntries={[ROUTE]}>
      <SettingsSearchProvider>
        <Harness />
      </SettingsSearchProvider>
    </MemoryRouter>,
  );
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useSearchHighlight', () => {
  it('marks the matched words in the targeted card', () => {
    renderHarness();

    const marks = [...screen.getByTestId('title-row').querySelectorAll('mark')];

    expect(marks.map((mark) => mark.textContent)).toEqual(['Variation', 'Library']);
  });

  it('replaces a marked text node with a single element so flex layout is unchanged', () => {
    renderHarness();

    const row = screen.getByTestId('title-row');

    expect(row.children).toHaveLength(2);
    expect(row.children[0].textContent).toBe('Variation Library');
    expect(row.children[1].tagName).toBe('BUTTON');
  });

  it('marks the matched words whatever case they are written in', () => {
    render(
      <MemoryRouter initialEntries={[ROUTE]}>
        <SettingsSearchProvider>
          <Harness title="VARIATION library" />
        </SettingsSearchProvider>
      </MemoryRouter>,
    );

    const marks = [...screen.getByTestId('title-row').querySelectorAll('mark')];

    expect(marks.map((mark) => mark.textContent)).toEqual(['VARIATION', 'library']);
  });

  it('lifts the card for five seconds and then settles it back', () => {
    vi.useFakeTimers();
    renderHarness();

    const card = screen.getByTestId('card');

    expect(card.style.transform).toBe('translateY(-10px)');
    expect(card.style.boxShadow).not.toBe('');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(card.style.transform).toBe('');
    expect(card.style.boxShadow).toBe('');
    expect(card.style.transition).toContain('transform');

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(card.style.transition).toBe('');
  });

  it('restores the original text when the target is cleared', () => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const row = screen.getByTestId('title-row');

    expect(row.querySelectorAll('mark')).toHaveLength(0);
    expect(row.children).toHaveLength(1);
    expect(row.firstChild?.nodeValue).toBe('Variation Library');
  });
});
