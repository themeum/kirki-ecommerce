import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ToastCard from '@/components/ui/toast/toast-card';
import { toastPauseStore } from '@/components/ui/toast/toast-pause-store';
import type { ToastState } from '@/components/ui/toast/toast-types';

const createToast = (overrides: Partial<ToastState> = {}): ToastState => {
  return {
    id: 'toast-1',
    variant: 'success',
    title: 'Brand saved',
    loading: false,
    revision: 0,
    ...overrides,
  };
};

const renderCard = (overrides: Partial<ToastState> = {}) => {
  const handlers = {
    onClose: vi.fn(),
    onExpire: vi.fn(),
    onUndo: vi.fn(),
    onRetry: vi.fn(),
  };

  const view = render(<ToastCard toast={createToast(overrides)} {...handlers} />);

  return { ...handlers, ...view };
};

const getRing = (container: HTMLElement) => {
  return container.querySelector('[data-toast-ring]');
};

describe('ToastCard', () => {
  afterEach(() => {
    cleanup();
    toastPauseStore.setPaused(false);
  });

  it('shows the title and the description', () => {
    renderCard({ description: 'Adventure is now live.' });

    expect(screen.getByText('Brand saved')).toBeInTheDocument();
    expect(screen.getByText('Adventure is now live.')).toBeInTheDocument();
  });

  it('shows a close button with a ring for a timed toast', () => {
    const { container } = renderCard();

    expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    expect(getRing(container)).not.toBeNull();
  });

  it('shows a close button with a ring for an error', () => {
    const { container } = renderCard({ variant: 'error', title: 'Save failed' });

    expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    expect(getRing(container)).not.toBeNull();
  });

  it('shows a spinner and no close button while loading', () => {
    const { container } = renderCard({ variant: 'info', title: 'Importing', loading: true });

    expect(screen.queryByRole('button', { name: 'Close notification' })).toBeNull();
    expect(container.querySelector('[data-toast-icon="loading"]')).not.toBeNull();
  });

  it('shows the variant icon when not loading', () => {
    const { container } = renderCard({ variant: 'warning', title: 'Coupon expiring' });

    expect(container.querySelector('[data-toast-icon="warning"]')).not.toBeNull();
  });

  it('shows Undo and Retry only when given', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();

    cleanup();

    const { onUndo, onRetry } = renderCard({
      undo: { onUndo: vi.fn() },
      retry: { onRetry: vi.fn() },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('closes when the close button is clicked', () => {
    const { onClose } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the alert role for an error and the status role for others', () => {
    renderCard({ variant: 'error', title: 'Save failed' });

    expect(screen.getByRole('alert')).toHaveTextContent('Save failed');

    cleanup();
    renderCard();

    expect(screen.getByRole('status')).toHaveTextContent('Brand saved');
  });

  describe('countdown', () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('expires once after its duration and empties the ring', () => {
      const { onExpire, container } = renderCard({ duration: 1000 });
      const progress = getRing(container)!.querySelectorAll('circle')[1];

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(Number(progress.getAttribute('stroke-dashoffset'))).toBeCloseTo(50, 0);
      expect(onExpire).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(progress.getAttribute('stroke-dashoffset')).toBe('100.00');
    });

    it('does not expire while paused and continues with the time left', () => {
      const { onExpire } = renderCard({ duration: 1000 });

      act(() => {
        vi.advanceTimersByTime(400);
        toastPauseStore.setPaused(true);
        vi.advanceTimersByTime(5000);
      });

      expect(onExpire).not.toHaveBeenCalled();

      act(() => {
        toastPauseStore.setPaused(false);
        vi.advanceTimersByTime(500);
      });

      expect(onExpire).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('starts again from the full duration when the revision changes', () => {
      const handlers = { onClose: vi.fn(), onExpire: vi.fn(), onUndo: vi.fn(), onRetry: vi.fn() };
      const { rerender } = render(
        <ToastCard toast={createToast({ duration: 1000 })} {...handlers} />,
      );

      act(() => {
        vi.advanceTimersByTime(800);
      });

      rerender(<ToastCard toast={createToast({ duration: 1000, revision: 1 })} {...handlers} />);

      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(handlers.onExpire).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(handlers.onExpire).toHaveBeenCalledTimes(1);
    });
  });
});
