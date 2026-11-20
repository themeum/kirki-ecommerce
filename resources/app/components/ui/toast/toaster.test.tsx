import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toastPauseStore } from '@/components/ui/toast/toast-pause-store';
import Toaster from '@/components/ui/toast/toaster';

vi.mock('sonner', () => ({
  Toaster: () => (
    <ol data-testid="sonner-toaster">
      <li>
        <button type="button">Close notification</button>
      </li>
    </ol>
  ),
}));

const renderToaster = () => {
  render(
    <>
      <button type="button">Outside</button>
      <Toaster />
    </>,
  );

  return {
    stack: screen.getByTestId('sonner-toaster'),
    close: screen.getByRole('button', { name: 'Close notification' }),
    outside: screen.getByRole('button', { name: 'Outside' }),
  };
};

describe('Toaster', () => {
  afterEach(() => {
    cleanup();
  });

  it('pauses while the mouse is on the stack and resumes when it moves off', () => {
    const { close, outside } = renderToaster();

    fireEvent.pointerOver(close, { pointerType: 'mouse' });

    expect(toastPauseStore.isPaused()).toBe(true);

    fireEvent.pointerOver(outside, { pointerType: 'mouse' });

    expect(toastPauseStore.isPaused()).toBe(false);
  });

  it('resumes when the toast under the mouse is removed and the mouse moves on', () => {
    const { close, outside } = renderToaster();

    fireEvent.pointerOver(close, { pointerType: 'mouse' });
    close.remove();
    fireEvent.pointerOver(outside, { pointerType: 'mouse' });

    expect(toastPauseStore.isPaused()).toBe(false);
  });

  it('resumes when the mouse leaves the window', () => {
    const { stack } = renderToaster();

    fireEvent.pointerOver(stack, { pointerType: 'mouse' });
    fireEvent.pointerOut(stack, { pointerType: 'mouse', relatedTarget: null });

    expect(toastPauseStore.isPaused()).toBe(false);
  });

  it('does not pause on touch', () => {
    const { stack } = renderToaster();

    fireEvent.pointerOver(stack, { pointerType: 'touch' });

    expect(toastPauseStore.isPaused()).toBe(false);
  });

  it('does not pause on focus', () => {
    const { close } = renderToaster();

    fireEvent.focus(close);

    expect(toastPauseStore.isPaused()).toBe(false);
  });

  it('resumes when it unmounts', () => {
    const { stack } = renderToaster();

    fireEvent.pointerOver(stack, { pointerType: 'mouse' });
    cleanup();

    expect(toastPauseStore.isPaused()).toBe(false);
  });
});
