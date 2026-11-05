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

  it('sends the import request on the click', () => {
    mutateAsync.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ phase: 'downloading', progress: 0, isImporting: true });
  });

  it('eases the bar out to 95% in 10 seconds', async () => {
    mutateAsync.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });

    await advance(2000);
    expect(result.current.phase).toBe('downloading');
    expect(result.current.progress).toBeCloseTo(46.36);

    await advance(7900);
    expect(result.current.progress).toBeLessThan(95);

    await advance(100);
    expect(result.current).toMatchObject({ phase: 'downloading', progress: 95, isImporting: true });
  });

  it('creeps toward 99% without reaching 100% while the request runs', async () => {
    mutateAsync.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });

    await advance(20000);
    const progressAt20Seconds = result.current.progress;
    expect(result.current.phase).toBe('downloading');
    expect(progressAt20Seconds).toBeGreaterThan(98);
    expect(progressAt20Seconds).toBeLessThan(99);

    await advance(60000);
    expect(result.current.progress).toBeGreaterThan(progressAt20Seconds);
    expect(result.current.progress).toBeLessThan(99);
  });

  it('completes the bar for a fast response and reports the load after a pause', async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useSampleDataImport({ onLoaded }));

    act(() => {
      void result.current.start();
    });
    await advance(4000);
    expect(result.current.phase).toBe('downloading');

    await act(async () => {
      request.resolve();
      await request.promise;
    });

    expect(result.current).toMatchObject({ phase: 'done', progress: 100, isImporting: false });
    expect(onLoaded).not.toHaveBeenCalled();

    await advance(10000);
    expect(result.current).toMatchObject({ phase: 'done', progress: 100 });
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('reports the load at once when the pause is zero', async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useSampleDataImport({ onLoaded, loadedPauseMs: 0 }));

    act(() => {
      void result.current.start();
    });
    await act(async () => {
      request.resolve();
      await request.promise;
    });
    await advance(0);

    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('completes the bar for a response after 10 seconds', async () => {
    const request = deferred();
    mutateAsync.mockReturnValue(request.promise);
    const { result } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });
    await advance(12000);

    await act(async () => {
      request.resolve();
      await request.promise;
    });

    expect(result.current).toMatchObject({ phase: 'done', progress: 100, isImporting: false });
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

  it('stops the progress when the component unmounts', () => {
    mutateAsync.mockReturnValue(new Promise(() => undefined));
    const { result, unmount } = renderHook(() => useSampleDataImport({ onLoaded: vi.fn() }));

    act(() => {
      void result.current.start();
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
