import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SetupStatus, useStaggeredRows } from '@/features/onboarding/hooks/use-staggered-rows';

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const advanceRows = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await advance(400);
  }
};

const renderRows = (setupStatus: SetupStatus, runId = 0) =>
  renderHook((props) => useStaggeredRows(props), {
    initialProps: { rowCount: 3, setupStatus, runId },
  });

describe('useStaggeredRows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes the rows one at a time in order', async () => {
    const { result } = renderRows('success');

    expect(result.current).toEqual(['in-progress', 'waiting', 'waiting']);

    await advance(400);
    expect(result.current).toEqual(['completed', 'in-progress', 'waiting']);

    await advance(400);
    expect(result.current).toEqual(['completed', 'completed', 'in-progress']);

    await advance(400);
    expect(result.current).toEqual(['completed', 'completed', 'completed']);
  });

  it('keeps the last row in progress until setup succeeds', async () => {
    const { result, rerender } = renderRows('pending');

    await advanceRows(5);
    expect(result.current).toEqual(['completed', 'completed', 'in-progress']);

    rerender({ rowCount: 3, setupStatus: 'success', runId: 0 });
    expect(result.current).toEqual(['completed', 'completed', 'completed']);
  });

  it('stops the remaining rows when setup fails', async () => {
    const { result, rerender } = renderRows('pending');

    await advance(400);
    rerender({ rowCount: 3, setupStatus: 'error', runId: 0 });
    expect(result.current).toEqual(['completed', 'stopped', 'stopped']);

    await advanceRows(5);
    expect(result.current).toEqual(['completed', 'stopped', 'stopped']);
  });

  it('restarts from the first row on a new run', async () => {
    const { result, rerender } = renderRows('pending');

    await advanceRows(2);
    rerender({ rowCount: 3, setupStatus: 'error', runId: 0 });
    rerender({ rowCount: 3, setupStatus: 'pending', runId: 1 });
    expect(result.current).toEqual(['in-progress', 'waiting', 'waiting']);

    await advance(400);
    expect(result.current).toEqual(['completed', 'in-progress', 'waiting']);
  });
});
