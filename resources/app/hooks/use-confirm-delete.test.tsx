import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useConfirmDelete from '@/hooks/use-confirm-delete';

describe('useConfirmDelete', () => {
  it('renders nothing until a delete is requested', () => {
    const { result } = renderHook(() => useConfirmDelete());

    expect(result.current.deleteConfirmation).toBeNull();
  });

  it('runs the callback only after the user confirms', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDelete());

    act(() => {
      result.current.confirmDelete({ title: 'Delete brand?' }, onConfirm);
    });

    expect(onConfirm).not.toHaveBeenCalled();

    render(result.current.deleteConfirmation);
    expect(screen.getByText('Delete brand?')).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: 'Delete' }).click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.deleteConfirmation).toBeNull();
  });

  it('does not run the callback when the user cancels', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDelete());

    act(() => {
      result.current.confirmDelete({ title: 'Delete brand?' }, onConfirm);
    });

    render(result.current.deleteConfirmation);

    act(() => {
      screen.getByRole('button', { name: 'Cancel' }).click();
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result.current.deleteConfirmation).toBeNull();
  });

  it('shows the description and a custom confirm label', () => {
    const { result } = renderHook(() => useConfirmDelete());

    act(() => {
      result.current.confirmDelete(
        {
          title: 'Delete products permanently?',
          description: 'This cannot be undone.',
          confirmText: 'Delete permanently',
        },
        vi.fn(),
      );
    });

    render(result.current.deleteConfirmation);

    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeInTheDocument();
  });

  it('resolves true on confirm so bulk actions can proceed', async () => {
    const { result } = renderHook(() => useConfirmDelete());

    let decision: Promise<boolean>;
    act(() => {
      decision = result.current.confirmDeleteAsync({ title: 'Delete selected brands?' });
    });

    render(result.current.deleteConfirmation);
    act(() => {
      screen.getByRole('button', { name: 'Delete' }).click();
    });

    await expect(decision!).resolves.toBe(true);
  });

  it('resolves false on cancel so bulk actions can keep the selection', async () => {
    const { result } = renderHook(() => useConfirmDelete());

    let decision: Promise<boolean>;
    act(() => {
      decision = result.current.confirmDeleteAsync({ title: 'Delete selected brands?' });
    });

    render(result.current.deleteConfirmation);
    act(() => {
      screen.getByRole('button', { name: 'Cancel' }).click();
    });

    await expect(decision!).resolves.toBe(false);
  });
});
