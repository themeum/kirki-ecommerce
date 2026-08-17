import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSelect,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { noop } from '@/utils/function';

const renderBar = (currentPage: number, lastPage: number, disabled = false) => {
  const onChange = vi.fn();

  render(
    <Pagination disabled={disabled}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={currentPage === 1} onClick={() => { onChange(currentPage - 1); }} />
        </PaginationItem>
        {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink isActive={page === currentPage} onClick={() => { onChange(page); }}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext disabled={currentPage === lastPage} onClick={() => { onChange(currentPage + 1); }} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );

  return { onChange };
};

afterEach(() => {
  cleanup();
});

describe('Pagination', () => {
  it('marks exactly one page target as the current page', () => {
    renderBar(2, 4);

    const current = screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'page');

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('2');
  });

  it('disables previous on the first page and next on the last page', () => {
    renderBar(1, 4);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
  });

  it('disables every target while staying in the DOM when the bar is disabled', () => {
    renderBar(2, 4, true);

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toBeDisabled());
  });

  it('reports the requested page when a page target is activated', () => {
    const { onChange } = renderBar(2, 4);

    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('renders the ellipsis as inert and hidden from assistive technology', () => {
    renderBar(2, 4);

    const ellipsis = document.querySelector('[aria-hidden="true"]');

    expect(ellipsis).not.toBeNull();
    expect(ellipsis?.tagName).not.toBe('BUTTON');
  });
});

describe('PaginationPageSelect', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    global.ResizeObserver = class {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    };
  });

  it('reports a chosen page and shows the total page count', () => {
    const onChange = vi.fn();

    render(<PaginationPageSelect currentPage={2} totalPages={10} onChange={onChange} />);

    expect(screen.getByText('of 10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '5' }));

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
