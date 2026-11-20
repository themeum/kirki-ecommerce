import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/toast';

const { sonnerCustom, sonnerDismiss } = vi.hoisted(() => ({
  sonnerCustom: vi.fn(),
  sonnerDismiss: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { custom: sonnerCustom, dismiss: sonnerDismiss } }));

type SonnerCustomOptions = {
  id: string | number;
  duration: number;
  onDismiss: () => void;
  onAutoClose: () => void;
};

const lastCall = () => {
  const calls = sonnerCustom.mock.calls as unknown[][];
  const call = calls[calls.length - 1];

  return {
    renderToast: call[0] as (id: string | number) => ReactElement,
    options: call[1] as SonnerCustomOptions,
  };
};

const renderLatest = () => {
  cleanup();

  const { renderToast, options } = lastCall();

  return render(renderToast(options.id));
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, resolve, reject };
};

describe('toast', () => {
  afterEach(() => {
    toast.dismiss();
    cleanup();
    sonnerCustom.mockReset();
    sonnerDismiss.mockReset();
  });

  it.each(['success', 'info', 'warning', 'error'] as const)(
    'shows a %s toast through sonner with no sonner timer',
    (variant) => {
      const id = toast[variant]('Brand saved');
      const { options } = lastCall();

      expect(options.id).toBe(id);
      expect(options.duration).toBe(Infinity);

      renderLatest();

      expect(screen.getByText('Brand saved')).toBeInTheDocument();
    },
  );

  it('uses the id that the caller gives', () => {
    expect(toast.info('Importing', { id: 'import' })).toBe('import');
  });

  it('changes a toast in place by its id', () => {
    const id = toast.info('Importing products', { loading: true });

    toast.update(id, { variant: 'success', title: '240 products imported', loading: false });

    const { options } = lastCall();

    expect(sonnerCustom).toHaveBeenCalledTimes(2);
    expect(options.id).toBe(id);

    renderLatest();

    expect(screen.getByText('240 products imported')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
  });

  it('does nothing when it updates a toast that is gone', () => {
    const id = toast.info('Importing');

    toast.dismiss(id);
    toast.update(id, { title: 'Imported' });

    expect(sonnerCustom).toHaveBeenCalledTimes(1);
  });

  it('dismisses one toast or all toasts', () => {
    const id = toast.success('Saved');

    toast.dismiss(id);
    toast.dismiss();

    expect(sonnerDismiss).toHaveBeenNthCalledWith(1, id);
    expect(sonnerDismiss).toHaveBeenNthCalledWith(2);
  });

  it('forgets a toast that sonner closes', () => {
    const id = toast.success('Saved');

    lastCall().options.onDismiss();
    toast.update(id, { title: 'Saved again' });

    expect(sonnerCustom).toHaveBeenCalledTimes(1);
  });

  it('closes at once from the close button', () => {
    const id = toast.success('Saved');

    renderLatest();
    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }));

    expect(sonnerDismiss).toHaveBeenCalledWith(id);
  });

  describe('promise', () => {
    it('shows loading, then success content from the result', async () => {
      const work = deferred<number>();

      toast.promise(work.promise, {
        loading: { title: 'Saving brand' },
        success: (count) => ({ title: `${count} brands saved` }),
        error: { title: 'Save failed' },
      });

      renderLatest();

      expect(screen.getByText('Saving brand')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Close notification' })).toBeNull();

      work.resolve(2);
      await flushPromises();
      renderLatest();

      expect(screen.getByRole('status')).toHaveTextContent('2 brands saved');
    });

    it('shows error content from the error when it rejects', async () => {
      const work = deferred<void>();

      toast.promise(work.promise, {
        loading: { title: 'Saving brand', description: 'Please wait' },
        success: { title: 'Brand saved' },
        error: (error) => ({ title: (error as Error).message }),
      });

      work.reject(new Error('Name is taken'));
      await flushPromises();
      renderLatest();

      expect(screen.getByRole('alert')).toHaveTextContent('Name is taken');
      expect(screen.queryByText('Please wait')).toBeNull();
    });

    it('uses the loading variant that the caller gives', () => {
      toast.promise(new Promise(() => undefined), {
        loading: { title: 'Checking stock', variant: 'warning' },
        success: { title: 'Done' },
        error: { title: 'Failed' },
      });

      const { container } = renderLatest();

      expect(container.querySelector('[data-toast-variant="warning"]')).not.toBeNull();
    });
  });

  describe('undo', () => {
    it('runs the undo callback once and closes', () => {
      const onUndo = vi.fn();
      const id = toast.success('Brand deleted', { undo: { onUndo } });

      renderLatest();
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(sonnerDismiss).toHaveBeenCalledWith(id);
    });
  });

  describe('retry', () => {
    it('goes loading, then shows the success content when the retry resolves', async () => {
      const work = deferred<void>();

      toast.error('Save failed', {
        retry: { onRetry: () => work.promise, success: { title: 'Brand saved' } },
      });

      renderLatest();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      renderLatest();

      expect(screen.queryByRole('button', { name: 'Close notification' })).toBeNull();

      work.resolve();
      await flushPromises();
      renderLatest();

      expect(screen.getByRole('status')).toHaveTextContent('Brand saved');
      expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    });

    it('closes when the retry resolves and there is no success content', async () => {
      const id = toast.error('Save failed', { retry: { onRetry: () => Promise.resolve() } });

      renderLatest();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await flushPromises();

      expect(sonnerDismiss).toHaveBeenCalledWith(id);
    });

    it('goes back to the earlier content when the retry rejects', async () => {
      toast.error('Save failed', {
        description: 'The server did not answer.',
        retry: { onRetry: () => Promise.reject(new Error('still down')) },
      });

      renderLatest();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await flushPromises();
      renderLatest();

      expect(screen.getByRole('alert')).toHaveTextContent('Save failed');
      expect(screen.getByText('The server did not answer.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('closes at once when the retry gives back no promise', () => {
      const onRetry = vi.fn();
      const id = toast.error('Save failed', { retry: { onRetry } });

      renderLatest();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(sonnerDismiss).toHaveBeenCalledWith(id);
    });
  });
});
