import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSampleDataImport } from '@/features/home/hooks/use-sample-data-import';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/features/home/services/sample-data', () => ({
  useImportSampleDataMutation: () => ({ mutateAsync }),
}));

const deferred = () => {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, resolve, reject };
};

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('useSampleDataImport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mutateAsync.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fakes the download, runs the import, then reports the load after a pause', async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useSampleDataImport({ onLoaded }));

    act(() => {
      void result.current.start();
    });

    expect(result.current).toMatchObject({ phase: 'downloading', progress: 0, isImporting: true });

    await advance(1200);
    expect(result.current.progress).toBeCloseTo(33.6);
    expect(mutateAsync).not.toHaveBeenCalled();

    await advance(1300);
    expect(result.current.phase).toBe('creating');
    expect(mutateAsync).toHaveBeenCalledTimes(1);

    await advance(500);
    expect(result.current.progress).toBeGreaterThan(70);

    await act(async () => {
      request.resolve();
      await request.promise;
    });

    expect(result.current).toMatchObject({ phase: 'done', progress: 100, isImporting: false });
    expect(onLoaded).not.toHaveBeenCalled();

    await advance(1000);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('keeps the bar below 95% while the import runs', async () => {
    mutateAsync.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });
    await advance(60000);

    expect(result.current.phase).toBe('creating');
    expect(result.current.progress).toBeLessThan(95);
    expect(result.current.progress).toBeGreaterThan(90);
  });

  it('returns to idle when the import fails', async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useSampleDataImport({ onLoaded }));

    act(() => {
      void result.current.start();
    });
    await advance(2500);

    await act(async () => {
      request.reject(new Error('Import failed'));
      await request.promise.catch(() => undefined);
    });
    await advance(1000);

    expect(result.current).toMatchObject({ phase: 'idle', progress: 0, isImporting: false });
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('stops the fake download when the component unmounts', async () => {
    const { result, unmount } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });
    unmount();
    await advance(5000);

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
